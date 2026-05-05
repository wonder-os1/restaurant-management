import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { updateSettingSchema } from '../validators'

const router = Router()

// GET /api/settings
router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany()
    const settingsMap: Record<string, any> = {}
    settings.forEach((s) => { settingsMap[s.key] = s.value })
    res.json({ success: true, data: settingsMap })
  } catch (error) {
    next(error)
  }
})

// GET /api/settings/:key
router.get('/:key', authenticate, async (req, res, next) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: req.params.key } })
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' })
    }
    res.json({ success: true, data: setting })
  } catch (error) {
    next(error)
  }
})

// PUT /api/settings
router.put('/', authenticate, requireAdmin, validate(updateSettingSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { key, value } = req.body

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'UPDATE', entity: 'setting', entityId: setting.id },
    })

    res.json({ success: true, data: setting })
  } catch (error) {
    next(error)
  }
})

// PUT /api/settings/bulk
router.put('/bulk', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const settings = req.body as Array<{ key: string; value: any }>

    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, error: 'Expected an array of settings' })
    }

    const results = await prisma.$transaction(
      settings.map((s) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value },
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'BULK_UPDATE',
        entity: 'setting',
        metadata: { keys: settings.map((s) => s.key) },
      },
    })

    res.json({ success: true, data: results })
  } catch (error) {
    next(error)
  }
})

export { router as settingsRoutes }
