import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { authRoutes } from './routes/auth.routes'
import { menuRoutes } from './routes/menu.routes'
import { orderRoutes } from './routes/order.routes'
import { tableRoutes } from './routes/table.routes'
import { reservationRoutes } from './routes/reservation.routes'
import { kitchenRoutes } from './routes/kitchen.routes'
import { inventoryRoutes } from './routes/inventory.routes'
import { billingRoutes } from './routes/billing.routes'
import { customerRoutes } from './routes/customer.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { notificationRoutes } from './routes/notification.routes'
import { settingsRoutes } from './routes/settings.routes'
import { healthRoutes } from './routes/health.routes'
import { deliveryRoutes } from './routes/delivery.routes'
import publicRoutes from './routes/public.routes'

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: env.APP_URL,
  credentials: true,
}))

// Parsing
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/kitchen', kitchenRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/delivery', deliveryRoutes)
import { publicLimiter } from './middleware/rate-limiter'
app.use('/api/public', publicLimiter, publicRoutes)

// Error handler (must be last)
app.use(errorHandler)

export { app }
