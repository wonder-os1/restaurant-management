import { Router, Response, Request } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createBillSchema, createPaymentSchema, paginationSchema } from '../validators'
import { createRazorpayOrder, verifyWebhookSignature } from '../utils/razorpay'
import { sendPaymentReceipt } from '../utils/email'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/billing/bills
router.get('/bills', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where: any = {}
    if (req.user!.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } })
      if (customer) where.customerId = customer.id
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          order: {
            select: { id: true, type: true, items: true, createdAt: true },
          },
          customer: { include: { user: { select: { name: true, email: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bill.count({ where }),
    ])

    res.json({
      success: true,
      data: bills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/billing/bills/:id
router.get('/bills/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            table: { select: { number: true, section: true } },
          },
        },
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
      },
    })

    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' })
    }

    res.json({ success: true, data: bill })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/bills
router.post('/bills', authenticate, requireStaff, validate(createBillSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { orderId, discount, paymentMethod } = req.body

    // Check if bill already exists for this order
    const existingBill = await prisma.bill.findUnique({ where: { orderId } })
    if (existingBill) {
      return res.status(409).json({ success: false, error: 'Bill already exists for this order' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }

    const amount = order.subtotal
    const tax = order.tax
    const total = amount + tax - (discount || 0)

    const bill = await prisma.bill.create({
      data: {
        orderId,
        customerId: order.customerId,
        amount,
        tax,
        discount: discount || 0,
        total,
        paymentMethod,
      },
      include: {
        order: { select: { id: true, type: true } },
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'bill', entityId: bill.id },
    })

    res.status(201).json({ success: true, data: bill })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/payments
router.post('/payments', authenticate, validate(createPaymentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { billId, method } = req.body

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' })
    }

    if (bill.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, error: 'Bill already paid' })
    }

    if (method === 'razorpay') {
      try {
        const receipt = `BILL-${bill.id.slice(-8).toUpperCase()}`
        const razorpayOrder = await createRazorpayOrder(bill.total, 'INR', receipt)

        const updatedBill = await prisma.bill.update({
          where: { id: billId },
          data: {
            paymentMethod: 'razorpay',
            razorpayOrderId: razorpayOrder.id,
          },
        })

        return res.json({
          success: true,
          data: {
            bill: updatedBill,
            razorpayOrder,
            key: process.env.RAZORPAY_KEY_ID,
          },
        })
      } catch {
        return res.status(500).json({ success: false, error: 'Failed to create payment order' })
      }
    }

    // Cash/Card/UPI - mark as paid directly
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: method,
      },
    })

    // Update order payment status
    await prisma.order.update({
      where: { id: bill.orderId },
      data: { paymentStatus: 'PAID', paymentMethod: method },
    })

    // Send receipt
    if (bill.customer?.user?.email) {
      const formatAmount = `INR ${(bill.total / 100).toLocaleString('en-IN')}`
      sendPaymentReceipt(bill.customer.user.email, {
        customerName: bill.customer.user.name,
        billId: bill.id,
        amount: formatAmount,
      }).catch(console.error)
    }

    // Award loyalty points (1 point per INR 100 spent)
    if (bill.customerId) {
      const pointsEarned = Math.floor(bill.total / 10000) // 1 point per INR 100
      if (pointsEarned > 0) {
        await prisma.customer.update({
          where: { id: bill.customerId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        })
      }
    }

    res.json({ success: true, data: updatedBill })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/refunds/:billId
router.post('/refunds/:billId', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const bill = await prisma.bill.findUnique({ where: { id: req.params.billId } })

    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' })
    }

    if (bill.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, error: 'Bill has not been paid yet' })
    }

    const updatedBill = await prisma.bill.update({
      where: { id: req.params.billId },
      data: { paymentStatus: 'REFUNDED' },
    })

    await prisma.order.update({
      where: { id: bill.orderId },
      data: { paymentStatus: 'REFUNDED' },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'REFUND',
        entity: 'bill',
        entityId: bill.id,
        metadata: { amount: bill.total },
      },
    })

    res.json({ success: true, data: updatedBill })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/webhooks/razorpay
router.post('/webhooks/razorpay', async (req: Request, res: Response, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string
    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing signature' })
    }

    const body = JSON.stringify(req.body)
    if (!verifyWebhookSignature(body, signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' })
    }

    const event = req.body.event
    const paymentEntity = req.body.payload?.payment?.entity

    if (event === 'payment.captured' && paymentEntity) {
      const bill = await prisma.bill.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
      })

      if (bill) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: {
            paymentStatus: 'PAID',
            razorpayPaymentId: paymentEntity.id,
          },
        })

        await prisma.order.update({
          where: { id: bill.orderId },
          data: { paymentStatus: 'PAID', paymentMethod: 'razorpay' },
        })
      }
    }

    if (event === 'payment.failed' && paymentEntity) {
      const bill = await prisma.bill.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
      })

      if (bill) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { paymentStatus: 'FAILED' },
        })
      }
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export { router as billingRoutes }
