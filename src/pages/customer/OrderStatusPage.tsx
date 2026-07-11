import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, ChefHat, Truck, XCircle, RefreshCw, UtensilsCrossed } from 'lucide-react'
import { orderService } from '@/services/orderService'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const statusSteps = [
  { key: 'waiting_payment', label: 'Menunggu Pembayaran', icon: Clock },
  { key: 'waiting_cash_payment', label: 'Menunggu Konfirmasi Kasir', icon: Clock },
  { key: 'paid', label: 'Pembayaran Diterima', icon: CheckCircle },
  { key: 'diproses', label: 'Pesanan Diproses', icon: UtensilsCrossed },
  { key: 'dimasak', label: 'Sedang Dimasak', icon: ChefHat },
  { key: 'siap_diantar', label: 'Siap Diantar', icon: Truck },
  { key: 'selesai', label: 'Pesanan Selesai', icon: CheckCircle },
]

export default function OrderStatusPage() {
  const [searchParams] = useSearchParams()
  const session = searchParams.get('session') || localStorage.getItem('customer_session')
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    if (!session) return
    setLoading(true)
    try {
      const data = await orderService.getBySession(session)
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    if (!session) return
    const channel = supabase
      .channel(`orders_status_${session}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat status pesanan...</p>
        </div>
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-5xl">📋</p>
        <h2 className="text-xl font-bold">Belum Ada Pesanan</h2>
        <p className="text-muted-foreground text-sm text-center">Belum ada pesanan aktif untuk sesi ini.</p>
        <Button onClick={() => navigate(-1)}>Kembali ke Menu</Button>
      </div>
    )
  }

  const activeOrder = orders[0]
  const isCancelled = activeOrder.order_status === 'cancelled'
  const isDone = activeOrder.order_status === 'selesai'

  const getStepsForOrder = () => {
    if (activeOrder.payment_method === 'qris') {
      return statusSteps.filter((s) => s.key !== 'waiting_cash_payment')
    }
    return statusSteps.filter((s) => s.key !== 'waiting_payment')
  }

  const steps = getStepsForOrder()
  const currentStepIndex = steps.findIndex((s) => s.key === activeOrder.order_status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="max-w-md mx-auto text-center">
          {isCancelled ? (
            <XCircle className="w-12 h-12 mx-auto mb-2 text-red-300" />
          ) : isDone ? (
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 mx-auto mb-2"
            >
              <RefreshCw className="w-full h-full" />
            </motion.div>
          )}
          <h1 className="text-xl font-bold">
            {isCancelled ? 'Pesanan Dibatalkan' : isDone ? 'Pesanan Selesai!' : 'Memproses Pesanan'}
          </h1>
          <p className="text-white/80 text-sm mt-1">#{activeOrder.order_number}</p>
          {activeOrder.tables && (
            <p className="text-white/70 text-sm">Meja {(activeOrder.tables as { table_number: number }).table_number}</p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm mb-4">Status Pesanan</h3>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-100'
                    }`}>
                      {isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                        </motion.div>
                      ) : (
                        <Icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                    {isCompleted && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Detail Pesanan</h3>
          <div className="space-y-2">
            {activeOrder.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.menus?.name || 'Menu'} x{item.qty}
                  {item.note && <span className="text-xs block text-gray-400 italic">{item.note}</span>}
                </span>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pajak</span>
                <span>{formatCurrency(activeOrder.tax)}</span>
              </div>
              {activeOrder.service_fee > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Biaya Layanan</span>
                  <span>{formatCurrency(activeOrder.service_fee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(activeOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border p-4 text-sm space-y-1 text-muted-foreground">
          <p>Dipesan: {formatDateTime(activeOrder.created_at)}</p>
          <p>Pembayaran: {activeOrder.payment_method === 'qris' ? 'QRIS' : 'Tunai/Kasir'}</p>
          <p>Status Bayar: {activeOrder.payment_status === 'paid' ? '✅ Lunas' : '⏳ Menunggu'}</p>
        </div>

        <Button variant="outline" className="w-full" onClick={loadOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Perbarui Status
        </Button>

        <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
          Kembali ke Menu
        </Button>
      </div>
    </div>
  )
}
