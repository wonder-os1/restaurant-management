import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { requireFeature } from '../middleware/feature-gate'
import { validate } from '../middleware/validate'
import { createReservationSchema, updateReservationStatusSchema, paginationSchema } from '../validators'
import { sendReservationConfirmation } from '../utils/email'

const router = Router()

// GET /api/reservations
router.get('/', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { status, date } = req.query as Record<string, string>

    const where: any = {}
    if (status) where.status = status
    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = { gte: targetDate, lt: nextDay }
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
          table: { select: { id: true, number: true, capacity: true, section: true } },
        },
        skip,
        take: limit,
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      }),
      prisma.reservation.count({ where }),
    ])

    res.json({
      success: true,
      data: reservations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/reservations/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        table: true,
      },
    })

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' })
    }

    res.json({ success: true, data: reservation })
  } catch (error) {
    next(error)
  }
})

// POST /api/reservations
router.post('/', authenticate, validate(createReservationSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { customerId, guestName, guestPhone, guestEmail, tableId, date, time, partySize, notes } = req.body

    // Check table availability if a table is specified
    if (tableId) {
      const conflicting = await prisma.reservation.findFirst({
        where: {
          tableId,
          date: new Date(date),
          time,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      })

      if (conflicting) {
        return res.status(409).json({ success: false, error: 'Table is already reserved for this time slot' })
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerId,
        guestName,
        guestPhone,
        guestEmail,
        tableId,
        date: new Date(date),
        time,
        partySize,
        notes,
      },
      include: {
        table: { select: { number: true } },
      },
    })

    // Send confirmation email
    if (guestEmail) {
      sendReservationConfirmation(guestEmail, {
        guestName,
        date: new Date(date).toLocaleDateString('en-IN'),
        time,
        partySize,
        tableNumber: reservation.table?.number,
      }).catch(console.error)
    }

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'reservation', entityId: reservation.id },
    })

    res.status(201).json({ success: true, data: reservation })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/reservations/:id/status
router.patch('/:id/status', authenticate, requireStaff, validate(updateReservationStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, tableId, notes } = req.body

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(tableId && { tableId }),
        ...(notes && { notes }),
      },
      include: {
        table: true,
        customer: { include: { user: { select: { id: true } } } },
      },
    })

    // If seated, mark the table as occupied
    if (status === 'SEATED' && reservation.tableId) {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'OCCUPIED' },
      })
    }

    // If completed/cancelled/no_show, free up the table
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status) && reservation.tableId) {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'AVAILABLE' },
      })
    }

    // Notify customer
    if (reservation.customer?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: reservation.customer.user.id,
          type: 'RESERVATION',
          title: `Reservation ${status}`,
          message: `Your reservation has been ${status.toLowerCase().replace('_', ' ')}`,
          data: { reservationId: reservation.id },
        },
      })
    }

    res.json({ success: true, data: reservation })
  } catch (error) {
    next(error)
  }
})

// GET /api/reservations/availability/check
router.get('/availability/check', authenticate, async (req, res, next) => {
  try {
    const { date, time, partySize } = req.query as Record<string, string>

    if (!date || !time || !partySize) {
      return res.status(400).json({ success: false, error: 'date, time, and partySize are required' })
    }

    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Find tables that can accommodate the party
    const suitableTables = await prisma.table.findMany({
      where: {
        capacity: { gte: parseInt(partySize) },
        status: { not: 'MAINTENANCE' },
      },
      orderBy: { capacity: 'asc' },
    })

    // Find reservations that conflict
    const reservedTableIds = await prisma.reservation.findMany({
      where: {
        date: { gte: targetDate, lt: nextDay },
        time,
        status: { in: ['PENDING', 'CONFIRMED'] },
        tableId: { not: null },
      },
      select: { tableId: true },
    })

    const reservedIds = new Set(reservedTableIds.map((r) => r.tableId))

    const availableTables = suitableTables.filter((t) => !reservedIds.has(t.id))

    res.json({
      success: true,
      data: {
        available: availableTables.length > 0,
        tables: availableTables,
        totalSuitable: suitableTables.length,
        totalAvailable: availableTables.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/reservations/:id
router.delete('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.reservation.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Reservation deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as reservationRoutes }
