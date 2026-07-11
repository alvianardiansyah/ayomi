export type UserRole = 'admin' | 'kasir' | 'dapur'
export type PaymentMethod = 'qris' | 'cash'
export type PaymentStatus = 'waiting' | 'paid' | 'failed'
export type OrderStatus =
  | 'pending'
  | 'waiting_payment'
  | 'waiting_cash_payment'
  | 'paid'
  | 'diproses'
  | 'dimasak'
  | 'siap_diantar'
  | 'selesai'
  | 'cancelled'

export interface User {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number
  is_available: boolean
  is_best_seller: boolean
  created_at: string
  updated_at: string
  categories?: Category
}

export interface Table {
  id: string
  table_number: number
  table_uuid: string
  qr_code_url: string | null
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  table_id: string
  customer_session: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  subtotal: number
  tax: number
  service_fee: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  tables?: Table
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  qty: number
  price: number
  subtotal: number
  note: string | null
  created_at: string
  menus?: Menu
}

export interface Payment {
  id: string
  order_id: string
  method: string
  transaction_id: string | null
  external_reference: string | null
  amount: number
  payment_status: string
  paid_at: string | null
  created_at: string
}

export interface RestaurantSettings {
  id: string
  restaurant_name: string
  address: string | null
  phone: string | null
  logo_url: string | null
  qris_image_url: string | null
  tax_percentage: number
  service_percentage: number
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  module: string
  description: string | null
  created_at: string
  users?: User
}

export interface CartItem {
  menu: Menu
  qty: number
  note: string
}

export interface DashboardStats {
  total_revenue: number
  total_orders: number
  orders_today: number
  active_tables: number
}
