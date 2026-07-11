import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Printer, Clock, CreditCard, Banknote, Eye } from 'lucide-react'
import { orderService } from '@/services/orderService'
import type { Order } from '@/types'
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function KasirDashboardPage() {
  const [detail, setDetail] = useState<Order | null>(null)
  const qc = useQueryClient()

  const { data: orders = [] } = useQuery({
    queryKey: ['kasir-orders'],
    queryFn: () => orderService.getAll(),
    refetchInterval: 10000,
  })

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('kasir_orders_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['kasir-orders'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const confirmMutation = useMutation({
    mutationFn: (id: string) => orderService.confirmCashPayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kasir-orders'] })
      setDetail(null)
      toast.success('Pembayaran dikonfirmasi! Pesanan masuk dapur.')
    },
    onError: () => toast.error('Gagal konfirmasi'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kasir-orders'] })
      setDetail(null)
      toast.success('Pesanan dibatalkan')
    },
  })

  const waitingCash = orders.filter((o) => o.order_status === 'waiting_cash_payment')
  const waitingQris = orders.filter((o) => o.order_status === 'waiting_payment')
  const paid = orders.filter((o) => ['paid', 'diproses', 'dimasak', 'siap_diantar', 'selesai'].includes(o.order_status))

  const handlePrint = (order: Order) => {
    const win = window.open('', '_blank', 'width=380,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>Struk ${order.order_number}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 10px; }
        hr { border-top: 1px dashed #000; }
        .center { text-align: center; }
        .row { display: flex; justify-content: space-between; }
        .bold { font-weight: bold; }
      </style></head><body>
      <div class="center bold">AYOMI PESAN</div>
      <div class="center">====================</div>
      <div class="row"><span>Order:</span><span>${order.order_number}</span></div>
      <div class="row"><span>Meja:</span><span>${(order.tables as { table_number: number } | undefined)?.table_number || '-'}</span></div>
      <div class="row"><span>Waktu:</span><span>${new Date(order.created_at).toLocaleString('id-ID')}</span></div>
      <hr/>
      ${order.order_items?.map((item) => `
        <div class="row">
          <span>${item.menus?.name || ''} x${item.qty}</span>
          <span>Rp ${item.subtotal.toLocaleString('id-ID')}</span>
        </div>
        ${item.note ? `<div style="font-style:italic;font-size:10px;">  Catatan: ${item.note}</div>` : ''}
      `).join('') || ''}
      <hr/>
      <div class="row"><span>Subtotal</span><span>Rp ${order.subtotal.toLocaleString('id-ID')}</span></div>
      <div class="row"><span>Pajak</span><span>Rp ${order.tax.toLocaleString('id-ID')}</span></div>
      ${order.service_fee > 0 ? `<div class="row"><span>Layanan</span><span>Rp ${order.service_fee.toLocaleString('id-ID')}</span></div>` : ''}
      <div class="row bold"><span>TOTAL</span><span>Rp ${order.total.toLocaleString('id-ID')}</span></div>
      <hr/>
      <div class="center">Terima kasih!</div>
      <script>window.print();</script>
      </body></html>
    `)
    win.document.close()
  }

  const OrderCard = ({ order, showConfirm = false }: { order: Order; showConfirm?: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-card rounded-xl border p-4 space-y-2"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-sm">{order.order_number}</p>
          <p className="text-xs text-muted-foreground">
            Meja {(order.tables as { table_number: number } | undefined)?.table_number || '-'}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
          <div className="flex items-center gap-1 mt-1">
            {order.payment_method === 'qris'
              ? <CreditCard className="w-3 h-3 text-blue-500" />
              : <Banknote className="w-3 h-3 text-green-500" />}
            <span className="text-xs text-muted-foreground capitalize">{order.payment_method}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {order.order_items?.slice(0, 2).map((item) => (
          <span key={item.id} className="mr-2">{item.menus?.name} x{item.qty}</span>
        ))}
        {(order.order_items?.length || 0) > 2 && (
          <span>+{(order.order_items?.length || 0) - 2} lagi</span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(order)}>
          <Eye className="w-3.5 h-3.5 mr-1" /> Detail
        </Button>
        <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
          <Printer className="w-3.5 h-3.5" />
        </Button>
        {showConfirm && (
          <>
            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => confirmMutation.mutate(order.id)}>
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Konfirmasi
            </Button>
            <Button variant="destructive" size="sm" onClick={() => cancelMutation.mutate(order.id)}>
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Dashboard Kasir</h1>
        <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {waitingCash.length} tunai menunggu
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {waitingQris.length} QRIS menunggu
          </span>
        </div>
      </div>

      <Tabs defaultValue="cash">
        <TabsList className="w-full">
          <TabsTrigger value="cash" className="flex-1">
            Tunai ({waitingCash.length})
          </TabsTrigger>
          <TabsTrigger value="qris" className="flex-1">
            QRIS ({waitingQris.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-1">
            Diproses ({paid.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash" className="space-y-2 mt-3">
          <AnimatePresence>
            {waitingCash.length === 0 ? (
              <EmptyState message="Tidak ada pesanan tunai menunggu" />
            ) : (
              waitingCash.map((o) => <OrderCard key={o.id} order={o} showConfirm />)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="qris" className="space-y-2 mt-3">
          <AnimatePresence>
            {waitingQris.length === 0 ? (
              <EmptyState message="Tidak ada pesanan QRIS menunggu" />
            ) : (
              waitingQris.map((o) => <OrderCard key={o.id} order={o} />)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="paid" className="space-y-2 mt-3">
          <AnimatePresence>
            {paid.length === 0 ? (
              <EmptyState message="Belum ada pesanan yang sedang diproses" />
            ) : (
              paid.map((o) => <OrderCard key={o.id} order={o} />)
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        {detail && (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Detail {detail.order_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meja</span>
                  <span className="font-medium">{(detail.tables as { table_number: number } | undefined)?.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`text-xs ${getOrderStatusColor(detail.order_status)}`} variant="secondary">
                    {getOrderStatusLabel(detail.order_status)}
                  </Badge>
                </div>
              </div>
              <div className="border rounded-lg p-3 space-y-1.5">
                {detail.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.menus?.name} x{item.qty}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
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
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handlePrint(detail)}>
                  <Printer className="w-4 h-4 mr-1" /> Cetak Struk
                </Button>
                {detail.order_status === 'waiting_cash_payment' && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => confirmMutation.mutate(detail.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Konfirmasi
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <p className="text-3xl mb-2">📋</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
