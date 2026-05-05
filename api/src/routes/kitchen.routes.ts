import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { updateKitchenOrderStatusSchema, updateKitchenOrderPrioritySchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/kitchen/orders - Kitchen Display System
router.get('/orders', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.query as Record<string, string>

    const where: any = {}
    if (status) {
      where.status = status
    } else {
      // Default: show active orders (not served)
      where.status = { in: ['PENDING', 'IN_PROGRESS', 'READY'] }
    }

    const kitchenOrders = await prisma.kitchenOrder.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            type: true,
            status: true,
            tableId: true,
            notes: true,
            createdAt: true,
            table: { select: { number: true, section: true } },
            customer: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })

    res.json({ success: true, data: kitchenOrders })
  } catch (error) {
    next(error)
  }
})

// GET /api/kitchen/orders/:id
router.get('/orders/:id', authenticate, requireStaff, async (req, res, next) => {
  try {
    const kitchenOrder = await prisma.kitchenOrder.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            table: true,
            customer: { include: { user: { select: { name: true, phone: true } } } },
          },
        },
      },
    })

    if (!kitchenOrder) {
      return res.status(404).json({ success: false, error: 'Kitchen order not found' })
    }

    res.json({ success: true, data: kitchenOrder })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/kitchen/orders/:id/status
router.patch('/orders/:id/status', authenticate, requireStaff, validate(updateKitchenOrderStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body

    const updateData: any = { status }

    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date()
    }
    if (status === 'READY' || status === 'SERVED') {
      updateData.completedAt = new Date()
    }

    const kitchenOrder = await prisma.kitchenOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: {
          select: { id: true, tableId: true, customerId: true, type: true },
        },
      },
    })

    // Update parent order status based on kitchen order status
    if (status === 'IN_PROGRESS') {
      await prisma.order.update({
        where: { id: kitchenOrder.orderId },
        data: { status: 'PREPARING' },
      })
    } else if (status === 'READY') {
      // Check if all kitchen orders for this order are ready
      const pendingKitchenOrders = await prisma.kitchenOrder.count({
        where: {
          orderId: kitchenOrder.orderId,
          id: { not: kitchenOrder.id },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      })
      if (pendingKitchenOrders === 0) {
        await prisma.order.update({
          where: { id: kitchenOrder.orderId },
          data: { status: 'READY' },
        })
      }

      // Notify staff that food is ready
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER', 'STAFF'] }, isActive: true },
        select: { id: true },
      })
      for (const staff of staffUsers) {
        await prisma.notification.create({
          data: {
            userId: staff.id,
            type: 'KITCHEN',
            title: 'Order Ready',
            message: `Kitchen order for order #${kitchenOrder.orderId.slice(-6)} is ready`,
            data: { kitchenOrderId: kitchenOrder.id, orderId: kitchenOrder.orderId },
          },
        })
      }
    }

    res.json({ success: true, data: kitchenOrder })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/kitchen/orders/:id/priority
router.patch('/orders/:id/priority', authenticate, requireStaff, validate(updateKitchenOrderPrioritySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { priority } = req.body

    const kitchenOrder = await prisma.kitchenOrder.update({
      where: { id: req.params.id },
      data: { priority },
    })

    res.json({ success: true, data: kitchenOrder })
  } catch (error) {
    next(error)
  }
})

// GET /api/kitchen/stats
router.get('/stats', authenticate, requireStaff, async (_req, res, next) => {
  try {
    const [pending, inProgress, ready, served] = await Promise.all([
      prisma.kitchenOrder.count({ where: { status: 'PENDING' } }),
      prisma.kitchenOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.kitchenOrder.count({ where: { status: 'READY' } }),
      prisma.kitchenOrder.count({ where: { status: 'SERVED' } }),
    ])

    // Average prep time for completed orders today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedToday = await prisma.kitchenOrder.findMany({
      where: {
        status: { in: ['READY', 'SERVED'] },
        completedAt: { not: null },
        startedAt: { not: null },
        createdAt: { gte: today },
      },
      select: { startedAt: true, completedAt: true },
    })

    let avgPrepTime = 0
    if (completedToday.length > 0) {
      const totalTime = completedToday.reduce((sum, order) => {
        const diff = (order.completedAt!.getTime() - order.startedAt!.getTime()) / 60000 // minutes
        return sum + diff
      }, 0)
      avgPrepTime = Math.round(totalTime / completedToday.length)
    }

    res.json({
      success: true,
      data: { pending, inProgress, ready, served, avgPrepTime },
    })
  } catch (error) {
    next(error)
  }
})

export { router as kitchenRoutes }
