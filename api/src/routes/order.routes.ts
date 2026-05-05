import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createOrderSchema, updateOrderStatusSchema, paginationSchema } from '../validators'
import { sendOrderConfirmation } from '../utils/email'

const router = Router()

// GET /api/orders
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { status, type, tableId, customerId } = req.query as Record<string, string>

    const where: any = {}

    // Role-based filtering
    if (req.user!.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } })
      if (customer) where.customerId = customer.id
    }

    if (status) where.status = status
    if (type) where.type = type
    if (tableId) where.tableId = tableId
    if (customerId) where.customerId = customerId

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
          table: { select: { id: true, number: true, section: true } },
          kitchenOrders: true,
          bill: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        table: true,
        kitchenOrders: true,
        bill: true,
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }

    // Customers can only view their own orders
    if (req.user!.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } })
      if (!customer || order.customerId !== customer.id) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
    }

    res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
})

// POST /api/orders
router.post('/', authenticate, validate(createOrderSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { customerId, tableId, type, items, deliveryAddress, notes, paymentMethod } = req.body

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const tax = Math.round(subtotal * 0.05) // 5% GST
    const total = subtotal + tax

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customerId,
          tableId,
          type,
          items,
          subtotal,
          tax,
          total,
          deliveryAddress,
          notes,
          paymentMethod,
          status: 'PENDING',
        },
        include: {
          customer: { include: { user: { select: { name: true, email: true } } } },
          table: { select: { id: true, number: true } },
        },
      })

      // Create kitchen order
      await tx.kitchenOrder.create({
        data: {
          orderId: newOrder.id,
          items: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            notes: item.notes || '',
            status: 'PENDING',
          })),
          status: 'PENDING',
          priority: type === 'DINE_IN' ? 1 : 0,
        },
      })

      // Update table status if dine-in
      if (tableId && type === 'DINE_IN') {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        })
      }

      await tx.auditLog.create({
        data: { userId: req.user!.userId, action: 'CREATE', entity: 'order', entityId: newOrder.id },
      })

      return newOrder
    })

    // Send confirmation email if customer has email
    if (order.customer?.user?.email) {
      const formatAmount = `INR ${(total / 100).toLocaleString('en-IN')}`
      sendOrderConfirmation(order.customer.user.email, {
        customerName: order.customer.user.name,
        orderId: order.id,
        total: formatAmount,
        type: type,
      }).catch(console.error)
    }

    // Create notification for kitchen staff
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MANAGER', 'STAFF'] }, isActive: true },
      select: { id: true },
    })
    for (const staff of staffUsers) {
      await prisma.notification.create({
        data: {
          userId: staff.id,
          type: 'ORDER',
          title: 'New Order Received',
          message: `New ${type.replace('_', ' ').toLowerCase()} order #${order.id.slice(-6)}`,
          data: { orderId: order.id },
        },
      })
    }

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, requireStaff, validate(updateOrderStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, notes } = req.body

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(notes && { notes }),
      },
      include: {
        customer: { include: { user: { select: { id: true, name: true, email: true } } } },
        table: true,
      },
    })

    // If order is served/delivered/cancelled and it was dine-in, free up the table
    if (['SERVED', 'CANCELLED'].includes(status) && order.tableId) {
      // Check if there are other active orders for this table
      const activeOrders = await prisma.order.count({
        where: {
          tableId: order.tableId,
          id: { not: order.id },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
        },
      })
      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        })
      }
    }

    // Create notification for customer
    if (order.customer?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: order.customer.user.id,
          type: 'ORDER',
          title: `Order ${status}`,
          message: `Your order #${order.id.slice(-6)} has been ${status.toLowerCase().replace('_', ' ')}`,
          data: { orderId: order.id },
        },
      })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
})

// GET /api/orders/today/summary
router.get('/today/summary', authenticate, requireStaff, async (_req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalOrders, pendingOrders, preparingOrders, completedOrders, revenue] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow }, status: 'PENDING' } }),
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow }, status: 'PREPARING' } }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: { in: ['SERVED', 'DELIVERED'] } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: { in: ['SERVED', 'DELIVERED'] } },
        _sum: { total: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        preparingOrders,
        completedOrders,
        revenue: revenue._sum.total || 0,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/orders/:id
router.delete('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }

    if (!['PENDING', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Can only delete pending or cancelled orders' })
    }

    await prisma.order.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Order deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as orderRoutes }
