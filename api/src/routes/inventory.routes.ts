import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff, requireManager } from '../middleware/rbac'
import { requireFeature } from '../middleware/feature-gate'
import { validate } from '../middleware/validate'
import {
  createInventorySchema,
  updateInventorySchema,
  restockInventorySchema,
  createSupplierSchema,
  updateSupplierSchema,
  paginationSchema,
} from '../validators'

const router = Router()

// ===================== INVENTORY =====================

// GET /api/inventory
router.get('/', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { lowStock } = req.query as Record<string, string>

    const where: any = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const items = await prisma.inventory.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    })

    const total = await prisma.inventory.count({ where })

    // Filter low stock items if requested
    let data = items
    if (lowStock === 'true') {
      data = items.filter((item) => Number(item.quantity) <= Number(item.minQuantity))
    }

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/inventory/alerts
router.get('/alerts', authenticate, requireStaff, async (_req, res, next) => {
  try {
    const items = await prisma.inventory.findMany({
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { name: 'asc' },
    })

    const lowStockItems = items.filter((item) => Number(item.quantity) <= Number(item.minQuantity))

    res.json({
      success: true,
      data: {
        alerts: lowStockItems,
        totalLowStock: lowStockItems.length,
        totalItems: items.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/inventory/:id
router.get('/:id', authenticate, requireStaff, async (req, res, next) => {
  try {
    const item = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: { supplier: true },
    })

    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' })
    }

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// POST /api/inventory
router.post('/', authenticate, requireManager, validate(createInventorySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const item = await prisma.inventory.create({
      data: req.body,
      include: { supplier: { select: { id: true, name: true } } },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'inventory', entityId: item.id },
    })

    res.status(201).json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/inventory/:id
router.patch('/:id', authenticate, requireManager, validate(updateInventorySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const item = await prisma.inventory.update({
      where: { id: req.params.id },
      data: req.body,
      include: { supplier: { select: { id: true, name: true } } },
    })

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// POST /api/inventory/:id/restock
router.post('/:id/restock', authenticate, requireStaff, validate(restockInventorySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { quantity, costPerUnit } = req.body

    const existing = await prisma.inventory.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' })
    }

    const newQuantity = Number(existing.quantity) + quantity

    const item = await prisma.inventory.update({
      where: { id: req.params.id },
      data: {
        quantity: newQuantity,
        ...(costPerUnit !== undefined && { costPerUnit }),
        lastRestocked: new Date(),
      },
      include: { supplier: { select: { id: true, name: true } } },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'RESTOCK',
        entity: 'inventory',
        entityId: item.id,
        metadata: { quantity, costPerUnit, newQuantity },
      },
    })

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/inventory/:id
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.inventory.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Inventory item deleted' })
  } catch (error) {
    next(error)
  }
})

// ===================== SUPPLIERS =====================

// GET /api/inventory/suppliers/list
router.get('/suppliers/list', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { inventory: true } } },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.count({ where }),
    ])

    res.json({
      success: true,
      data: suppliers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/inventory/suppliers
router.post('/suppliers', authenticate, requireManager, validate(createSupplierSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'supplier', entityId: supplier.id },
    })

    res.status(201).json({ success: true, data: supplier })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/inventory/suppliers/:id
router.patch('/suppliers/:id', authenticate, requireManager, validate(updateSupplierSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.json({ success: true, data: supplier })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/inventory/suppliers/:id
router.delete('/suppliers/:id', authenticate, requireManager, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Supplier deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as inventoryRoutes }
