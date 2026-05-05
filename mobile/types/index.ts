export type UserRole = 'ADMIN' | 'MANAGER' | 'CHEF' | 'WAITER' | 'CASHIER' | 'CUSTOMER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  createdAt: string
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE'

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET'

export interface Order {
  id: string
  orderNumber: string
  type: OrderType
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  tableId?: string
  table?: Table
  customerId?: string
  customer?: User
  waiterId?: string
  waiter?: User
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  menuItem?: MenuItem
  name: string
  quantity: number
  unitPrice: number
  total: number
  notes?: string
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  category?: MenuCategory
  imageUrl?: string
  isAvailable: boolean
  isVegetarian: boolean
  isVegan: boolean
  spiceLevel?: number
  preparationTime?: number
  allergens?: string[]
  createdAt: string
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  sortOrder: number
  items?: MenuItem[]
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'

export interface Table {
  id: string
  number: string
  capacity: number
  status: TableStatus
  section?: string
  currentOrderId?: string
  currentOrder?: Order
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  partySize: number
  date: string
  time: string
  tableId?: string
  table?: Table
  status: ReservationStatus
  notes?: string
  createdAt: string
}

export interface KitchenOrder {
  id: string
  orderNumber: string
  type: OrderType
  tableNumber?: string
  items: KitchenOrderItem[]
  createdAt: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
}

export interface KitchenOrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
  status: 'PENDING' | 'PREPARING' | 'READY'
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  activeOrders: number
  tablesOccupied: number
  totalTables: number
  pendingReservations: number
  popularItems: { name: string; count: number }[]
  recentOrders: Order[]
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}
