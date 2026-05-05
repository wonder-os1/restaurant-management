import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

// GET /api/public/menu - Public menu (no auth required)
router.get('/menu', async (req, res, next) => {
  try {
    const { categorySlug, isVeg } = req.query as Record<string, string>

    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: {
            isAvailable: true,
            ...(isVeg !== undefined && { isVeg: isVeg === 'true' }),
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Filter by category slug if provided
    const data = categorySlug
      ? categories.filter((c) => c.slug === categorySlug)
      : categories

    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

// GET /api/public/menu/:id - Public menu item detail
router.get('/menu/:id', async (req, res, next) => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: req.params.id, isAvailable: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' })
    }

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// GET /api/public/categories - Public menu categories
router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { items: { where: { isAvailable: true } } } } },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
})

// GET /api/public/info - Restaurant info
router.get('/info', async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'restaurantName', 'address', 'phone', 'email',
            'businessHoursStart', 'businessHoursEnd', 'currency',
          ],
        },
      },
    })

    const info: Record<string, any> = {}
    settings.forEach((s) => { info[s.key] = s.value })

    res.json({ success: true, data: info })
  } catch (error) {
    next(error)
  }
})

// POST /api/public/reserve - Public reservation (no auth required)
router.post('/reserve', async (req, res, next) => {
  try {
    const { guestName, guestPhone, guestEmail, date, time, partySize, notes } = req.body

    if (!guestName || !guestPhone || !date || !time || !partySize) {
      return res.status(400).json({
        success: false,
        error: 'guestName, guestPhone, date, time, and partySize are required',
      })
    }

    // Find a suitable table
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const suitableTables = await prisma.table.findMany({
      where: {
        capacity: { gte: parseInt(partySize) },
        status: { not: 'MAINTENANCE' },
      },
      orderBy: { capacity: 'asc' },
    })

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
    const availableTable = suitableTables.find((t) => !reservedIds.has(t.id))

    const reservation = await prisma.reservation.create({
      data: {
        guestName,
        guestPhone,
        guestEmail,
        tableId: availableTable?.id || null,
        date: new Date(date),
        time,
        partySize: parseInt(partySize),
        notes,
        status: 'PENDING',
      },
      include: {
        table: { select: { number: true, section: true } },
      },
    })

    res.status(201).json({ success: true, data: reservation })
  } catch (error) {
    next(error)
  }
})

// POST /api/public/order - Public online order (no auth required)
router.post('/order', async (req, res, next) => {
  try {
    const { customerName, customerPhone, customerEmail, type, items, deliveryAddress, notes } = req.body

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'customerName, customerPhone, and items are required',
      })
    }

    if (type === 'DELIVERY' && !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Delivery address is required for delivery orders',
      })
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { user: { phone: customerPhone } },
      include: { user: true },
    })

    if (!customer) {
      const { hashPassword, generateSecurePassword } = require('../utils/password')
      const user = await prisma.user.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || `${customerPhone}@customer.local`,
          password: await hashPassword(generateSecurePassword()),
          role: 'CUSTOMER',
        },
      })
      customer = await prisma.customer.create({
        data: { userId: user.id },
        include: { user: true },
      })
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const tax = Math.round(subtotal * 0.05)
    const total = subtotal + tax

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: customer!.id,
          type: type || 'TAKEAWAY',
          items,
          subtotal,
          tax,
          total,
          deliveryAddress,
          notes,
          status: 'PENDING',
        },
        include: {
          customer: { include: { user: { select: { name: true, phone: true } } } },
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
        },
      })

      return newOrder
    })

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
})

export default router
