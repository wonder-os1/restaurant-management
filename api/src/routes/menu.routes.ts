import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff, requireManager } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  paginationSchema,
} from '../validators'

const router = Router()

// ===================== CATEGORIES =====================

// GET /api/menu/categories
router.get('/categories', authenticate, async (_req, res, next) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    })

    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
})

// GET /api/menu/categories/:id
router.get('/categories/:id', authenticate, async (req, res, next) => {
  try {
    const category = await prisma.menuCategory.findUnique({
      where: { id: req.params.id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' })
    }

    res.json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

// POST /api/menu/categories
router.post('/categories', authenticate, requireManager, validate(createMenuCategorySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const category = await prisma.menuCategory.create({ data: req.body })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'menu_category', entityId: category.id },
    })

    res.status(201).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/menu/categories/:id
router.patch('/categories/:id', authenticate, requireManager, validate(updateMenuCategorySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/menu/categories/:id
router.delete('/categories/:id', authenticate, requireManager, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    next(error)
  }
})

// ===================== ITEMS =====================

// GET /api/menu/items
router.get('/items', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { categoryId, isVeg, isAvailable } = req.query as Record<string, string>

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (isVeg !== undefined) where.isVeg = isVeg === 'true'
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true'

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.menuItem.count({ where }),
    ])

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/menu/items/:id
router.get('/items/:id', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    })

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' })
    }

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// POST /api/menu/items
router.post('/items', authenticate, requireManager, validate(createMenuItemSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const item = await prisma.menuItem.create({
      data: req.body,
      include: { category: { select: { id: true, name: true } } },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'menu_item', entityId: item.id },
    })

    res.status(201).json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/menu/items/:id
router.patch('/items/:id', authenticate, requireManager, validate(updateMenuItemSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: { select: { id: true, name: true } } },
    })

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/menu/items/:id/availability
router.patch('/items/:id/availability', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' })
    }

    const updated = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable: !item.isAvailable },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/menu/items/:id
router.delete('/items/:id', authenticate, requireManager, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Menu item deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as menuRoutes }
