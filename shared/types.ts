/** Shared types used across web, api, and mobile layers */

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isVeg: boolean
  isAvailable: boolean
  preparationTime: number // minutes
}

export interface Order {
  id: string
  items: OrderItem[]
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  type: 'dine_in' | 'takeaway' | 'delivery'
  tableNumber?: number
  totalAmount: number
  customerId?: string
  createdAt: string
}

export interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
  notes?: string
}

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  date: string
  time: string
  partySize: number
  tableId?: string
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
}

export interface Table {
  id: string
  number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  section?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  lastVisit?: string
}

export interface FeatureFlags {
  onlineOrdering: boolean
  tableReservation: boolean
  kitchenDisplay: boolean
  inventoryManagement: boolean
  loyaltyProgram: boolean
  deliveryTracking: boolean
}
