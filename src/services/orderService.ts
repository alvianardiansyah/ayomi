import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus } from '@/types'
import { generateOrderNumber } from '@/lib/utils'

export const orderService = {
  async create(payload: {
    table_id: string
    customer_session: string
    payment_method: 'qris' | 'cash'
    subtotal: number
    tax: number
    service_fee: number
    total: number
    notes?: string
    items: Array<{ menu_id: string; qty: number; price: number; subtotal: number; note?: string }>
  }) {
    const orderNumber = generateOrderNumber()
    const status = payload.payment_method === 'qris' ? 'waiting_payment' : 'waiting_cash_payment'

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        table_id: payload.table_id,
        customer_session: payload.customer_session,
        payment_method: payload.payment_method,
        payment_status: 'waiting',
        order_status: status,
        subtotal: payload.subtotal,
        tax: payload.tax,
        service_fee: payload.service_fee,
        total: payload.total,
        notes: payload.notes || null,
      })
      .select()
      .single()
    if (orderError) throw orderError

    const items = payload.items.map((item) => ({
      order_id: order.id,
      menu_id: item.menu_id,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal,
      note: item.note || null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(items)
    if (itemsError) throw itemsError

    return order as Order
  },

  async getAll(filters?: { status?: OrderStatus; date?: string }) {
    let query = supabase
      .from('orders')
      .select('*, tables(id, table_number), order_items(*, menus(id, name, image_url))')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('order_status', filters.status)
    if (filters?.date) {
      query = query.gte('created_at', `${filters.date}T00:00:00`)
        .lte('created_at', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Order[]
  },

  async getBySession(customerSession: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(id, table_number), order_items(*, menus(id, name, image_url, price))')
      .eq('customer_session', customerSession)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Order[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(id, table_number), order_items(*, menus(id, name, image_url, price))')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as Order | null
  },

  async updateStatus(id: string, status: OrderStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Order
  },

  async confirmCashPayment(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: 'paid', payment_status: 'paid' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await supabase.from('payments').insert({
      order_id: id,
      method: 'cash',
      amount: data.total,
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })

    return data as Order
  },

  async cancel(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Order
  },

  async getByWaitingCash() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(id, table_number), order_items(*, menus(id, name))')
      .eq('order_status', 'waiting_cash_payment')
      .order('created_at')
    if (error) throw error
    return data as Order[]
  },

  async getActiveForDapur() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(id, table_number), order_items(*, menus(id, name, image_url))')
      .in('order_status', ['paid', 'diproses', 'dimasak', 'siap_diantar'])
      .order('created_at')
    if (error) throw error
    return data as Order[]
  },

  subscribeToOrders(callback: (payload: { new: Order; eventType: string }) => void) {
    return supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        callback({ new: payload.new as Order, eventType: payload.eventType })
      })
      .subscribe()
  },
}
