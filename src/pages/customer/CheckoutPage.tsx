import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CreditCard, Banknote, CheckCircle } from 'lucide-react'
import { orderService } from '@/services/orderService'
import { settingsService } from '@/services/settingsService'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cash' | null>(null)
  const [loading, setLoading] = useState(false)
  const [qrisVisible, setQrisVisible] = useState(false)
  const { items, tableId, tableNumber, customerSession, subtotal, clearCart } = useCartStore()

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

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast.error('Pilih metode pembayaran terlebih dahulu')
      return
    }
    if (!tableId) {
      toast.error('Nomor meja tidak ditemukan. Scan QR Code kembali.')
      return
    }
    if (!customerSession) {
      toast.error('Session tidak valid. Refresh halaman.')
      return
    }

    setLoading(true)
    try {
      await orderService.create({
        table_id: tableId,
        customer_session: customerSession,
        payment_method: paymentMethod,
        subtotal: sub,
        tax,
        service_fee: serviceFee,
        total,
        items: items.map((item) => ({
          menu_id: item.menu.id,
          qty: item.qty,
          price: item.menu.price,
          subtotal: item.menu.price * item.qty,
          note: item.note,
        })),
      })

      if (paymentMethod === 'qris') {
        setQrisVisible(true)
      } else {
        clearCart()
        toast.success('Pesanan berhasil! Silakan bayar di kasir.')
        navigate(`/order-status?session=${customerSession}`)
      }
    } catch (err) {
      toast.error('Gagal membuat pesanan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (qrisVisible && settings?.qris_image_url) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-1">Scan QRIS untuk Membayar</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Total: <span className="font-bold text-primary">{formatCurrency(total)}</span>
          </p>
          <div className="bg-white rounded-2xl p-4 border shadow-sm mb-6">
            <img src={settings.qris_image_url} alt="QRIS" className="w-full max-w-[240px] mx-auto" />
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Setelah pembayaran berhasil, pesanan akan otomatis diproses oleh dapur.
          </p>
          <Button onClick={() => { clearCart(); navigate(`/order-status?session=${customerSession}`) }} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Sudah Bayar, Pantau Pesanan
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold">Checkout</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Order Summary */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Ringkasan Pesanan — Meja {tableNumber}</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.menu.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.menu.name} x{item.qty}</span>
                <span>{formatCurrency(item.menu.price * item.qty)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pajak ({settings?.tax_percentage || 10}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Biaya Layanan</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Metode Pembayaran</h3>
          <div className="space-y-2">
            {settings?.qris_image_url && (
              <PaymentOption
                id="qris"
                selected={paymentMethod === 'qris'}
                onSelect={() => setPaymentMethod('qris')}
                icon={<CreditCard className="w-5 h-5 text-primary" />}
                title="QRIS"
                desc="Bayar dengan scan QR Code"
              />
            )}
            <PaymentOption
              id="cash"
              selected={paymentMethod === 'cash'}
              onSelect={() => setPaymentMethod('cash')}
              icon={<Banknote className="w-5 h-5 text-green-600" />}
              title="Bayar di Kasir"
              desc="Bayar tunai/kartu di kasir"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 max-w-2xl mx-auto">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handlePlaceOrder}
          disabled={!paymentMethod || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memproses...
            </span>
          ) : (
            `Konfirmasi Pesanan · ${formatCurrency(total)}`
          )}
        </Button>
      </div>
    </div>
  )
}

function PaymentOption({
  selected, onSelect, icon, title, desc
}: {
  id: string; selected: boolean; onSelect: () => void; icon: React.ReactNode; title: string; desc: string
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
        selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        selected ? 'border-primary' : 'border-gray-300'
      }`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
    </button>
  )
}
