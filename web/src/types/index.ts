export type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "DELIVERED"
  | "CANCELLED";

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED";

export type KitchenOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "READY"
  | "SERVED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "UPI"
  | "RAZORPAY"
  | "WALLET";

export type NotificationType =
  | "ORDER"
  | "RESERVATION"
  | "SYSTEM"
  | "PROMOTION";

export type SettingType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  user?: User;
  loyaltyPoints: number;
  preferences?: Record<string, unknown>;
  addresses?: CustomerAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  items?: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number; // in paise
  categoryId: string;
  category?: MenuCategory;
  image?: string;
  isVeg: boolean;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number; // in paise
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customer?: Customer;
  tableId?: string;
  table?: Table;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number; // paise
  tax: number; // paise
  total: number; // paise
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  section?: string;
  status: TableStatus;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  customerId?: string;
  customer?: Customer;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  tableId?: string;
  table?: Table;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KitchenOrder {
  id: string;
  orderId: string;
  order?: Order;
  items: OrderItem[];
  status: KitchenOrderStatus;
  priority: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPerUnit: number; // paise
  supplierId?: string;
  supplier?: Supplier;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  orderId: string;
  order?: Order;
  customerId?: string;
  customer?: Customer;
  amount: number; // paise
  tax: number; // paise
  discount: number; // paise
  total: number; // paise
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  tablesOccupied: number;
  pendingReservations: number;
  totalCustomers: number;
  popularItems: { name: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  ordersByHour: { hour: number; count: number }[];
}
