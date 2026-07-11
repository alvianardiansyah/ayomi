import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Menu } from '@/types'

interface CartState {
  items: CartItem[]
  tableId: string | null
  tableNumber: number | null
  customerSession: string | null
  addItem: (menu: Menu, note?: string) => void
  removeItem: (menuId: string) => void
  updateQty: (menuId: string, qty: number) => void
  updateNote: (menuId: string, note: string) => void
  clearCart: () => void
  setTable: (tableId: string, tableNumber: number) => void
  setCustomerSession: (session: string) => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      tableNumber: null,
      customerSession: null,

      addItem: (menu, note = '') => {
        set((state) => {
          const existing = state.items.find((i) => i.menu.id === menu.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menu.id === menu.id ? { ...i, qty: i.qty + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { menu, qty: 1, note }] }
        })
      },

      removeItem: (menuId) => {
        set((state) => ({ items: state.items.filter((i) => i.menu.id !== menuId) }))
      },

      updateQty: (menuId, qty) => {
        if (qty <= 0) {
          get().removeItem(menuId)
          return
        }
        set((state) => ({
          items: state.items.map((i) => (i.menu.id === menuId ? { ...i, qty } : i)),
        }))
      },

      updateNote: (menuId, note) => {
        set((state) => ({
          items: state.items.map((i) => (i.menu.id === menuId ? { ...i, note } : i)),
        }))
      },

      clearCart: () => set({ items: [] }),

      setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),

      setCustomerSession: (session) => set({ customerSession: session }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.menu.price * i.qty, 0),
    }),
    {
      name: 'ayomi-cart',
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
        tableNumber: state.tableNumber,
        customerSession: state.customerSession,
      }),
    }
  )
)
