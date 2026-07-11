import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye } from 'lucide-react'
import { orderService } from '@/services/orderService'
import type { Order, OrderStatus } from '@/types'
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

const STATUS_OPTIONS: OrderStatus[] = [
  'pending', 'waiting_payment', 'waiting_cash_payment', 'paid',
  'diproses', 'dimasak', 'siap_diantar', 'selesai', 'cancelled',
]

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [detail, setDetail] = useState<Order | null>(null)
  const qc = useQueryClient()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderService.getAll(),
    refetchInterval: 15000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Status diperbarui')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Pesanan dibatalkan')
      setDetail(null)
    },
  })

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || o.order_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Pesanan</h1>
        <p className="text-sm text-muted-foreground">{orders.length} total pesanan</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nomor pesanan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{getOrderStatusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">📋</p>
          <p>Tidak ada pesanan ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="bg-card rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-bold text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Meja {(order.tables as { table_number: number } | undefined)?.table_number || '-'} · {formatDateTime(order.created_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.payment_method === 'qris' ? 'QRIS' : 'Tunai'} · {order.order_items?.length || 0} item
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-primary">{formatCurrency(order.total)}</span>
                  <Badge className={`text-xs ${getOrderStatusColor(order.order_status)}`} variant="secondary">
                    {getOrderStatusLabel(order.order_status)}
                  </Badge>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDetail(order)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {/* Quick status update */}
              <div className="mt-2 flex gap-2 flex-wrap">
                {order.order_status !== 'selesai' && order.order_status !== 'cancelled' && (
                  <Select
                    value={order.order_status}
                    onValueChange={(v) => updateMutation.mutate({ id: order.id, status: v as OrderStatus })}
                  >
                    <SelectTrigger className="h-7 text-xs w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((s) => s !== 'cancelled').map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{getOrderStatusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        {detail && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detail {detail.order_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Meja</p>
                  <p className="font-medium">{(detail.tables as { table_number: number } | undefined)?.table_number || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pembayaran</p>
                  <p className="font-medium capitalize">{detail.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge className={`text-xs ${getOrderStatusColor(detail.order_status)}`} variant="secondary">
                    {getOrderStatusLabel(detail.order_status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Waktu</p>
                  <p className="font-medium text-xs">{formatDateTime(detail.created_at)}</p>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-1.5">
                {detail.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.menus?.name} x{item.qty}{item.note ? ` (${item.note})` : ''}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{formatCurrency(detail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pajak</span><span>{formatCurrency(detail.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span><span className="text-primary">{formatCurrency(detail.total)}</span>
                  </div>
                </div>
              </div>

              {detail.order_status !== 'cancelled' && detail.order_status !== 'selesai' && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => cancelMutation.mutate(detail.id)}
                >
                  Batalkan Pesanan
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
