import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { orderService } from '@/services/orderService'
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function KasirHistoryPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kasir-history'],
    queryFn: () => orderService.getAll(),
  })

  const history = orders.filter((o) => ['selesai', 'cancelled', 'paid'].includes(o.order_status))

  const handlePrint = (order: typeof history[0]) => {
    const win = window.open('', '_blank', 'width=380,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>Struk ${order.order_number}</title>
      <style>body{font-family:monospace;font-size:12px;padding:10px;}.row{display:flex;justify-content:space-between;}</style>
      </head><body>
      <div style="text-align:center;font-weight:bold;">AYOMI PESAN</div>
      <hr/>
      <div class="row"><span>Order:</span><span>${order.order_number}</span></div>
      <div class="row"><span>Meja:</span><span>${(order.tables as { table_number: number } | undefined)?.table_number || '-'}</span></div>
      <hr/>
      ${order.order_items?.map((i) => `<div class="row"><span>${i.menus?.name} x${i.qty}</span><span>Rp ${i.subtotal.toLocaleString('id-ID')}</span></div>`).join('') || ''}
      <hr/>
      <div class="row" style="font-weight:bold;"><span>TOTAL</span><span>Rp ${order.total.toLocaleString('id-ID')}</span></div>
      <div style="text-align:center;margin-top:10px;">Terima kasih!</div>
      <script>window.print();</script></body></html>
    `)
    win.document.close()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground">{history.length} transaksi</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">📋</p>
          <p>Belum ada riwayat transaksi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((order) => (
            <div key={order.id} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  Meja {(order.tables as { table_number: number } | undefined)?.table_number} · {formatDateTime(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-sm text-primary">{formatCurrency(order.total)}</span>
                <Badge className={`text-xs ${getOrderStatusColor(order.order_status)}`} variant="secondary">
                  {getOrderStatusLabel(order.order_status)}
                </Badge>
                <Button variant="ghost" size="icon-sm" onClick={() => handlePrint(order)}>
                  <Printer className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
