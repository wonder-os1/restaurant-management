import { z } from 'zod'

// ---- Auth ----
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  role: z.enum(['MANAGER', 'STAFF', 'CUSTOMER']).default('CUSTOMER'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ---- Menu Category ----
export const createMenuCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const updateMenuCategorySchema = createMenuCategorySchema.partial()

// ---- Menu Item ----
export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  price: z.number().int().min(0),
  categoryId: z.string(),
  image: z.string().optional(),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateMenuItemSchema = createMenuItemSchema.partial()

// ---- Order ----
export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  tableId: z.string().optional(),
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).default('DINE_IN'),
  items: z.array(z.object({
    menuItemId: z.string(),
    name: z.string(),
    price: z.number().int().min(0),
    quantity: z.number().int().min(1),
    notes: z.string().optional(),
  })).min(1),
  deliveryAddress: z.object({
    address: z.string(),
    city: z.string(),
    pincode: z.string(),
    phone: z.string(),
  }).optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['razorpay', 'cash', 'card', 'upi']).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().optional(),
})

// ---- Table ----
export const createTableSchema = z.object({
  number: z.number().int().min(1),
  capacity: z.number().int().min(1).default(4),
  section: z.string().optional(),
})

export const updateTableSchema = z.object({
  capacity: z.number().int().min(1).optional(),
  section: z.string().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']).optional(),
})

// ---- Reservation ----
export const createReservationSchema = z.object({
  customerId: z.string().optional(),
  guestName: z.string().min(2),
  guestPhone: z.string().min(10),
  guestEmail: z.string().email().optional(),
  tableId: z.string().optional(),
  date: z.string(), // ISO date string
  time: z.string(), // "19:00"
  partySize: z.number().int().min(1),
  notes: z.string().optional(),
})

export const updateReservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  tableId: z.string().optional(),
  notes: z.string().optional(),
})

// ---- Kitchen ----
export const updateKitchenOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'SERVED']),
})

export const updateKitchenOrderPrioritySchema = z.object({
  priority: z.number().int().min(0).max(10),
})

// ---- Inventory ----
export const createInventorySchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(0),
  costPerUnit: z.number().int().min(0).default(0),
  supplierId: z.string().optional(),
})

export const updateInventorySchema = createInventorySchema.partial()

export const restockInventorySchema = z.object({
  quantity: z.number().min(0),
  costPerUnit: z.number().int().min(0).optional(),
})

// ---- Supplier ----
export const createSupplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

// ---- Billing ----
export const createBillSchema = z.object({
  orderId: z.string(),
  discount: z.number().int().min(0).default(0),
  paymentMethod: z.enum(['razorpay', 'cash', 'card', 'upi']).default('cash'),
})

export const createPaymentSchema = z.object({
  billId: z.string(),
  method: z.enum(['razorpay', 'cash', 'card', 'upi']).default('razorpay'),
})

// ---- Customer ----
export const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  preferences: z.any().optional(),
  addresses: z.any().optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const addLoyaltyPointsSchema = z.object({
  points: z.number().int(),
  reason: z.string().optional(),
})

// ---- Delivery ----
export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  notes: z.string().optional(),
})

// ---- Settings ----
export const updateSettingSchema = z.object({
  key: z.string(),
  value: z.any(),
})

// ---- Notification ----
export const createNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['ORDER', 'RESERVATION', 'BILLING', 'KITCHEN', 'GENERAL']).default('GENERAL'),
})

// ---- Pagination ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
