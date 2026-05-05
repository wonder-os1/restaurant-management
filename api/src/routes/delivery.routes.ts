import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { requireFeature } from '../middleware/feature-gate'
import { validate } from '../middleware/validate'
import { updateDeliveryStatusSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/delivery/orders
router.get('/orders', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { status } = req.query as Record<string, string>

    const where: any = { type: 'DELIVERY' }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { include: { user: { select: { name: true, phone: true, email: true } } } },
          kitchenOrders: { select: { id: true, status: true } },
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

// GET /api/delivery/orders/:id
router.get('/orders/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { include: { user: { select: { name: true, phone: true, email: true } } } },
        kitchenOrders: true,
        bill: true,
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }

    if (order.type !== 'DELIVERY') {
      return res.status(400).json({ success: false, error: 'This is not a delivery order' })
    }

    // Customers can only view their own delivery orders
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

// PATCH /api/delivery/orders/:id/status
router.patch('/orders/:id/status', authenticate, requireStaff, validate(updateDeliveryStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, notes } = req.body

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }

    if (order.type !== 'DELIVERY') {
      return res.status(400).json({ success: false, error: 'This is not a delivery order' })
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(notes && { notes }),
      },
      include: {
        customer: { include: { user: { select: { id: true, name: true } } } },
      },
    })

    // Notify customer about delivery status
    if (updated.customer?.user?.id) {
      const statusMessages: Record<string, string> = {
        CONFIRMED: 'Your delivery order has been confirmed',
        PREPARING: 'Your food is being prepared',
        READY: 'Your food is ready and will be dispatched soon',
        DELIVERED: 'Your order has been delivered. Enjoy your meal!',
        CANCELLED: 'Your delivery order has been cancelled',
      }

      await prisma.notification.create({
        data: {
          userId: updated.customer.user.id,
          type: 'ORDER',
          title: `Delivery ${status}`,
          message: statusMessages[status] || `Delivery order status updated to ${status}`,
          data: { orderId: updated.id },
        },
      })
    }

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// GET /api/delivery/stats
router.get('/stats', authenticate, requireStaff, async (_req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      totalToday,
      pending,
      preparing,
      outForDelivery,
      delivered,
      cancelled,
      revenue,
    ] = await Promise.all([
      prisma.order.count({ where: { type: 'DELIVERY', createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { type: 'DELIVERY', status: 'PENDING' } }),
      prisma.order.count({ where: { type: 'DELIVERY', status: 'PREPARING' } }),
      prisma.order.count({ where: { type: 'DELIVERY', status: 'READY' } }),
      prisma.order.count({
        where: { type: 'DELIVERY', status: 'DELIVERED', createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.count({
        where: { type: 'DELIVERY', status: 'CANCELLED', createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.aggregate({
        where: {
          type: 'DELIVERY',
          status: 'DELIVERED',
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { total: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        totalToday,
        pending,
        preparing,
        outForDelivery,
        delivered,
        cancelled,
        revenue: revenue._sum.total || 0,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as deliveryRoutes }
