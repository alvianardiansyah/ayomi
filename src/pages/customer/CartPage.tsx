import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Trash2, MessageSquare, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { settingsService } from '@/services/settingsService'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQty, removeItem, updateNote, subtotal, tableNumber } = useCartStore()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  })

  const sub = subtotal()
  const taxRate = (settings?.tax_percentage || 10) / 100
  const serviceRate = (settings?.service_percentage || 0) / 100
  const tax = Math.round(sub * taxRate)
  const serviceFee = Math.round(sub * serviceRate)
  const total = sub + tax + serviceFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🛒</div>
        <h2 className="text-xl font-bold">Keranjang Kosong</h2>
        <p className="text-muted-foreground text-sm">Belum ada item yang dipilih</p>
        <Button onClick={() => navigate(-1)}>Kembali ke Menu</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold">Keranjang</h1>
          {tableNumber && <p className="text-xs text-muted-foreground">Meja {tableNumber}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-40">
        {/* Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.menu.id}
                layout
                exit={{ opacity: 0, x: -100 }}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {item.menu.image_url ? (
                      <img src={item.menu.image_url} alt={item.menu.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{item.menu.name}</p>
                        <p className="text-primary text-sm font-bold">{formatCurrency(item.menu.price)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.menu.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Qty Control */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.menu.id, item.qty - 1)}
                        className="w-7 h-7 border rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.menu.id, item.qty + 1)}
                        className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="ml-auto text-sm font-semibold">
                        {formatCurrency(item.menu.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-3 relative">
                  <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Catatan (opsional): tidak pedas, tanpa bawang..."
                    value={item.note}
                    onChange={(e) => updateNote(item.menu.id, e.target.value)}
                    className="pl-9 text-xs h-9 bg-gray-50"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <h3 className="font-semibold text-sm mb-3">Ringkasan Pesanan</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(sub)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pajak ({settings?.tax_percentage || 10}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Biaya Layanan ({settings?.service_percentage}%)</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 max-w-2xl mx-auto">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => navigate('/checkout')}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Pesan Sekarang · {formatCurrency(total)}
        </Button>
      </div>
    </div>
  )
}
