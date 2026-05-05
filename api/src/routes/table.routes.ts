import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff, requireManager } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createTableSchema, updateTableSchema } from '../validators'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/tables
router.get('/', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, section } = req.query as Record<string, string>

    const where: any = {}
    if (status) where.status = status
    if (section) where.section = section

    const tables = await prisma.table.findMany({
      where,
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
          select: { id: true, status: true, total: true, items: true, createdAt: true },
        },
        reservations: {
          where: {
            date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: { id: true, guestName: true, time: true, partySize: true, status: true },
        },
      },
      orderBy: { number: 'asc' },
    })

    res.json({ success: true, data: tables })
  } catch (error) {
    next(error)
  }
})

// GET /api/tables/:id
router.get('/:id', authenticate, requireStaff, async (req, res, next) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          where: { status: { notIn: ['CANCELLED'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: { include: { user: { select: { name: true } } } },
          },
        },
        reservations: {
          where: {
            date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
          orderBy: { time: 'asc' },
        },
      },
    })

    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' })
    }

    res.json({ success: true, data: table })
  } catch (error) {
    next(error)
  }
})

// POST /api/tables
router.post('/', authenticate, requireManager, validate(createTableSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const table = await prisma.table.create({ data: req.body })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'table', entityId: table.id },
    })

    res.status(201).json({ success: true, data: table })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/tables/:id
router.patch('/:id', authenticate, requireStaff, validate(updateTableSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.json({ success: true, data: table })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/tables/:id/status
router.patch('/:id/status', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body as { status: string }

    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid table status' })
    }

    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { status: status as any },
    })

    res.json({ success: true, data: table })
  } catch (error) {
    next(error)
  }
})

// POST /api/tables/:id/qr
router.post('/:id/qr', authenticate, requireManager, async (req: AuthRequest, res: Response, next) => {
  try {
    const table = await prisma.table.findUnique({ where: { id: req.params.id } })
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' })
    }

    const qrCode = `TBL-${table.number}-${uuidv4().slice(0, 8).toUpperCase()}`

    const updated = await prisma.table.update({
      where: { id: req.params.id },
      data: { qrCode },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/tables/:id
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response, next) => {
  try {
    const table = await prisma.table.findUnique({ where: { id: req.params.id } })
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' })
    }

    if (table.status === 'OCCUPIED') {
      return res.status(400).json({ success: false, error: 'Cannot delete an occupied table' })
    }

    await prisma.table.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Table deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as tableRoutes }
