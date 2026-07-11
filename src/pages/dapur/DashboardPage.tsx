import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChefHat, Truck, CheckCircle, Bell } from 'lucide-react'
import { orderService } from '@/services/orderService'
import type { Order, OrderStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const DAPUR_STATUS_FLOW: Array<{ key: OrderStatus; label: string; next?: OrderStatus; nextLabel?: string; color: string; icon: React.ElementType }> = [
  { key: 'paid', label: 'Pesanan Baru', next: 'diproses', nextLabel: 'Mulai Proses', color: 'border-blue-300 bg-blue-50', icon: Bell },
  { key: 'diproses', label: 'Diproses', next: 'dimasak', nextLabel: 'Mulai Masak', color: 'border-purple-300 bg-purple-50', icon: Clock },
  { key: 'dimasak', label: 'Sedang Dimasak', next: 'siap_diantar', nextLabel: 'Siap Diantar', color: 'border-orange-300 bg-orange-50', icon: ChefHat },
  { key: 'siap_diantar', label: 'Siap Diantar', next: 'selesai', nextLabel: 'Selesai', color: 'border-green-300 bg-green-50', icon: Truck },
]

export default function DapurDashboardPage() {
  const qc = useQueryClient()

  const { data: orders = [] } = useQuery({
    queryKey: ['dapur-orders'],
    queryFn: () => orderService.getActiveForDapur(),
    refetchInterval: 10000,
  })

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('dapur_orders_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as { order_status?: string }
        if (newOrder.order_status === 'paid') {
          toast('🔔 Pesanan baru masuk!', { icon: '🍳', duration: 4000 })
        }
        qc.invalidateQueries({ queryKey: ['dapur-orders'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dapur-orders'] })
      toast.success('Status diperbarui')
    },
    onError: () => toast.error('Gagal update status'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard Dapur</h1>
          <p className="text-sm text-muted-foreground">{orders.length} pesanan aktif</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {DAPUR_STATUS_FLOW.map((s) => {
            const count = orders.filter((o) => o.order_status === s.key).length
            return count > 0 ? (
              <span key={s.key} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                {s.label}: {count}
              </span>
            ) : null
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ChefHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Tidak ada pesanan aktif</p>
          <p className="text-sm text-muted-foreground">Pesanan baru akan muncul di sini secara realtime</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DAPUR_STATUS_FLOW.map((statusConfig) => {
            const statusOrders = orders.filter((o) => o.order_status === statusConfig.key)
            const Icon = statusConfig.icon
            return (
              <div key={statusConfig.key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{statusConfig.label}</h2>
                  <span className="ml-auto bg-primary/10 text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {statusOrders.length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {statusOrders.map((order) => (
                      <DapurOrderCard
                        key={order.id}
                        order={order}
                        statusConfig={statusConfig}
                        onUpdate={(id, status) => updateMutation.mutate({ id, status })}
                      />
                    ))}
                  </AnimatePresence>
                  {statusOrders.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">Kosong</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DapurOrderCard({
  order,
  statusConfig,
  onUpdate,
}: {
  order: Order
  statusConfig: typeof DAPUR_STATUS_FLOW[0]
  onUpdate: (id: string, status: OrderStatus) => void
}) {
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
  const isUrgent = elapsed > 20 && statusConfig.key !== 'siap_diantar'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-xl border-2 p-3 ${statusConfig.color} ${isUrgent ? 'ring-2 ring-red-400' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-sm">{order.order_number}</p>
          <p className="text-xs text-gray-600">
            Meja {(order.tables as { table_number: number } | undefined)?.table_number || '-'}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
            {elapsed}m
          </p>
          {isUrgent && <p className="text-xs text-red-500">⚠️ Lambat</p>}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center font-bold text-primary text-xs shrink-0">
              {item.qty}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{item.menus?.name}</span>
              {item.note && <p className="text-gray-500 italic text-xs">{item.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-gray-600 italic mb-2 bg-white/60 rounded px-2 py-1">
          📝 {order.notes}
        </p>
      )}

      {/* Action */}
      {statusConfig.next && (
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => onUpdate(order.id, statusConfig.next!)}
        >
          {statusConfig.nextLabel}
        </Button>
      )}
      {statusConfig.key === 'siap_diantar' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs border-green-400 text-green-700 hover:bg-green-50"
          onClick={() => onUpdate(order.id, 'selesai')}
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Selesai
        </Button>
      )}
    </motion.div>
  )
}
