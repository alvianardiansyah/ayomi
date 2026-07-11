import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  QrCode, ChefHat, CreditCard, BarChart3, Smartphone,
  ArrowRight, LogIn, Utensils, Clock,
  ShieldCheck, Zap, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: QrCode,
    title: 'Pesan via QR Code',
    desc: 'Pelanggan cukup scan QR di meja, pilih menu, dan pesan — tanpa antri, tanpa aplikasi tambahan.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ChefHat,
    title: 'Dashboard Dapur Realtime',
    desc: 'Tim dapur menerima pesanan baru secara langsung. Update status dari dimasak hingga siap diantar.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: CreditCard,
    title: 'Bayar QRIS atau Tunai',
    desc: 'Dukung pembayaran QRIS dan tunai. Kasir konfirmasi pembayaran dengan satu klik.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Laporan & Analitik',
    desc: 'Pantau pendapatan harian, mingguan, bulanan. Export laporan ke CSV kapan saja.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Smartphone,
    title: 'Responsif di Semua Perangkat',
    desc: 'Tampilan optimal di HP, tablet, dan desktop — baik untuk pelanggan maupun staf.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: ShieldCheck,
    title: 'Akses Berbasis Peran',
    desc: 'Empat peran terpisah: Admin, Kasir, Dapur, dan Pelanggan — masing-masing dengan akses yang sesuai.',
    color: 'bg-teal-50 text-teal-600',
  },
]

const flow = [
  { step: '01', title: 'Scan QR Meja', desc: 'Pelanggan scan QR Code yang ada di meja untuk masuk ke halaman menu.', icon: QrCode },
  { step: '02', title: 'Pilih & Pesan', desc: 'Pilih menu favorit, atur jumlah dan catatan, lalu masukkan ke keranjang.', icon: Utensils },
  { step: '03', title: 'Bayar', desc: 'Pilih metode pembayaran QRIS atau tunai di kasir. Cepat dan mudah.', icon: CreditCard },
  { step: '04', title: 'Pantau Status', desc: 'Lacak status pesanan secara realtime — dari dapur hingga siap diantar.', icon: Clock },
]

const roles = [
  { role: 'Admin', desc: 'Kelola menu, meja, staf, laporan, dan seluruh konfigurasi sistem.', badge: 'bg-purple-100 text-purple-700', icon: '👑' },
  { role: 'Kasir', desc: 'Konfirmasi pembayaran tunai, cetak struk, dan pantau transaksi.', badge: 'bg-blue-100 text-blue-700', icon: '💳' },
  { role: 'Dapur', desc: 'Terima pesanan baru secara realtime dan update status masakan.', badge: 'bg-orange-100 text-orange-700', icon: '🍳' },
  { role: 'Pelanggan', desc: 'Pesan langsung dari meja via QR — tanpa daftar, tanpa login.', badge: 'bg-green-100 text-green-700', icon: '🪑' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-sm">Ayomi Pesan</span>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/login')}
            className="gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk Panel Staf
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 px-3 py-1 text-xs font-semibold gap-1.5">
              <Zap className="w-3 h-3" />
              Sistem Pemesanan Dine In Modern
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-[1.15] mb-6"
          >
            Restoran Lebih Efisien{' '}
            <span className="text-primary">Tanpa Antrian</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Ayomi Pesan adalah sistem pemesanan makanan berbasis QR Code untuk restoran Dine In.
            Pelanggan scan QR di meja, pilih menu, bayar — dapur dan kasir menerima pesanan
            secara realtime. Tanpa kertas, tanpa antri, tanpa ribet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="lg" className="gap-2 h-12 px-8 text-base font-semibold" onClick={() => navigate('/login')}>
              <LogIn className="w-4 h-4" />
              Masuk ke Panel Staf
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base font-semibold" onClick={() => navigate('/menu')}>
              Lihat Demo Menu
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-14 flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              { val: '4', label: 'Role Pengguna' },
              { val: 'Realtime', label: 'Update Status' },
              { val: 'QRIS + Tunai', label: 'Metode Bayar' },
              { val: '100%', label: 'Tanpa Login Pelanggan' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary">{s.val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Cara Kerja</p>
            <h2 className="text-3xl font-bold tracking-tight">Pesan semudah scan dan klik</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {flow.map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card border rounded-2xl p-5 relative"
              >
                <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{item.step}</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Fitur Unggulan</p>
            <h2 className="text-3xl font-bold tracking-tight">Semua yang dibutuhkan restoran modern</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Role Pengguna</p>
            <h2 className="text-3xl font-bold tracking-tight">Dirancang untuk semua pihak</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Setiap anggota tim dan pelanggan memiliki tampilan yang sesuai dengan kebutuhan mereka.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card border rounded-2xl p-5 text-center"
              >
                <div className="text-3xl mb-3">{r.icon}</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${r.badge}`}>
                  {r.role}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
              <span className="text-primary-foreground font-bold text-2xl">A</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Siap mulai dengan Ayomi Pesan?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Masuk ke panel staf untuk mengelola restoran Anda. Admin dapat membuat akun kasir dan dapur dari dalam dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 h-12 px-8 text-base font-semibold" onClick={() => navigate('/login')}>
                <LogIn className="w-4 h-4" />
                Masuk ke Panel Staf
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base" onClick={() => navigate('/menu')}>
                Lihat Halaman Menu
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-sm">Ayomi Pesan</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sistem Pemesanan Dine In berbasis QR Code · Semua hak dilindungi
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-primary" fill="currentColor" />
            <span>Dibuat dengan penuh semangat</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
