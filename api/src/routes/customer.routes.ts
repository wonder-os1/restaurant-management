import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { hashPassword, generateSecurePassword } from '../utils/password'
import { createCustomerSchema, updateCustomerSchema, addLoyaltyPointsSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/customers
router.get('/', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where: any = search
      ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
            { user: { phone: { contains: search } } },
          ],
        }
      : {}

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          _count: { select: { orders: true, reservations: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ])

    res.json({
      success: true,
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/customers/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true, avatar: true } },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, status: true, total: true, createdAt: true },
        },
        reservations: {
          take: 5,
          orderBy: { date: 'desc' },
          select: { id: true, date: true, time: true, partySize: true, status: true },
        },
        bills: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, total: true, paymentStatus: true, createdAt: true },
        },
      },
    })

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }

    // Customers can only view their own profile
    if (req.user!.role === 'CUSTOMER' && customer.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    res.json({ success: true, data: customer })
  } catch (error) {
    next(error)
  }
})

// POST /api/customers
router.post('/', authenticate, requireStaff, validate(createCustomerSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, email, phone, password, preferences, addresses } = req.body

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: await hashPassword(password || generateSecurePassword()),
          role: 'CUSTOMER',
        },
      })

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          preferences,
          addresses,
        },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      })

      await tx.auditLog.create({
        data: { userId: req.user!.userId, action: 'CREATE', entity: 'customer', entityId: customer.id },
      })

      return customer
    })

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/customers/:id
router.patch('/:id', authenticate, validate(updateCustomerSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } })
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }

    if (req.user!.role === 'CUSTOMER' && customer.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const { name, email, phone, preferences, addresses } = req.body

    const updated = await prisma.$transaction(async (tx) => {
      if (name || phone) {
        await tx.user.update({
          where: { id: customer.userId },
          data: { ...(name && { name }), ...(phone && { phone }) },
        })
      }

      return tx.customer.update({
        where: { id: req.params.id },
        data: {
          ...(preferences !== undefined && { preferences }),
          ...(addresses !== undefined && { addresses }),
        },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      })
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// GET /api/customers/:id/orders
router.get('/:id/orders', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } })
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }

    if (req.user!.role === 'CUSTOMER' && customer.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: req.params.id },
        include: {
          table: { select: { number: true } },
          bill: { select: { id: true, total: true, paymentStatus: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { customerId: req.params.id } }),
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

// POST /api/customers/:id/loyalty
router.post('/:id/loyalty', authenticate, requireStaff, validate(addLoyaltyPointsSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { points, reason } = req.body

    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } })
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }

    const newPoints = customer.loyaltyPoints + points
    if (newPoints < 0) {
      return res.status(400).json({ success: false, error: 'Insufficient loyalty points' })
    }

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { loyaltyPoints: newPoints },
      include: { user: { select: { id: true, name: true } } },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: points > 0 ? 'ADD_POINTS' : 'REDEEM_POINTS',
        entity: 'customer',
        entityId: customer.id,
        metadata: { points, reason, newBalance: newPoints },
      },
    })

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: customer.userId,
        type: 'GENERAL',
        title: points > 0 ? 'Loyalty Points Added' : 'Loyalty Points Redeemed',
        message: `${Math.abs(points)} points ${points > 0 ? 'added to' : 'redeemed from'} your account. Balance: ${newPoints}`,
        data: { points, reason },
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/customers/:id
router.delete('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Customer deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as customerRoutes }
