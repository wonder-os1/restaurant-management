import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const [
      // Today's orders
      todayOrders,
      todayPending,
      todayCompleted,
      todayCancelled,
      // Revenue
      todayRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      // Tables
      totalTables,
      occupiedTables,
      reservedTables,
      // Customers
      totalCustomers,
      newCustomersThisMonth,
      // Reservations today
      todayReservations,
      // Recent orders
      recentOrders,
      // Pending kitchen orders
      pendingKitchenOrders,
    ] = await Promise.all([
      // Today's orders
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: 'PENDING' },
      }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: { in: ['SERVED', 'DELIVERED'] } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: 'CANCELLED' },
      }),
      // Revenue
      prisma.bill.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { total: true },
      }),
      prisma.bill.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: thisMonthStart },
        },
        _sum: { total: true },
      }),
      prisma.bill.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      // Tables
      prisma.table.count(),
      prisma.table.count({ where: { status: 'OCCUPIED' } }),
      prisma.table.count({ where: { status: 'RESERVED' } }),
      // Customers
      prisma.customer.count(),
      prisma.customer.count({ where: { createdAt: { gte: thisMonthStart } } }),
      // Reservations today
      prisma.reservation.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      // Recent orders
      prisma.order.findMany({
        where: { createdAt: { gte: today } },
        include: {
          customer: { include: { user: { select: { name: true } } } },
          table: { select: { number: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Pending kitchen orders
      prisma.kitchenOrder.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
    ])

    const currentMonthRev = monthlyRevenue._sum.total || 0
    const lastMonthRev = lastMonthRevenue._sum.total || 0
    const revenueGrowth = lastMonthRev > 0 ? Math.round(((currentMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0

    // Popular items (from today's orders)
    const todayOrderItems = await prisma.order.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      select: { items: true },
    })

    const itemCounts: Record<string, { name: string; count: number }> = {}
    for (const order of todayOrderItems) {
      const items = order.items as any[]
      if (Array.isArray(items)) {
        for (const item of items) {
          if (!itemCounts[item.menuItemId]) {
            itemCounts[item.menuItemId] = { name: item.name, count: 0 }
          }
          itemCounts[item.menuItemId].count += item.quantity || 1
        }
      }
    }

    const popularItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([id, data]) => ({ menuItemId: id, ...data }))

    res.json({
      success: true,
      data: {
        todayOrders,
        todayPending,
        todayCompleted,
        todayCancelled,
        todayRevenue: todayRevenue._sum.total || 0,
        monthlyRevenue: currentMonthRev,
        lastMonthRevenue: lastMonthRev,
        revenueGrowth,
        totalTables,
        occupiedTables,
        reservedTables,
        availableTables: totalTables - occupiedTables - reservedTables,
        tableOccupancy: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
        totalCustomers,
        newCustomersThisMonth,
        todayReservations,
        pendingKitchenOrders,
        recentOrders,
        popularItems,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as dashboardRoutes }
