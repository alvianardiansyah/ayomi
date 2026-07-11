import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { settingsService } from '@/services/settingsService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

const schema = z.object({
  restaurant_name: z.string().min(1, 'Nama restoran wajib'),
  address: z.string().optional(),
  phone: z.string().optional(),
  tax_percentage: z.number().min(0).max(100),
  service_percentage: z.number().min(0).max(100),
})
type FormData = z.infer<typeof schema>

export default function AdminSettingsPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: settings
      ? {
          restaurant_name: settings.restaurant_name,
          address: settings.address || '',
          phone: settings.phone || '',
          tax_percentage: settings.tax_percentage,
          service_percentage: settings.service_percentage,
        }
      : undefined,
  })

  const onSubmit = async (data: FormData) => {
    try {
      const updates: Parameters<typeof settingsService.update>[0] = { ...data }

      if (logoFile) {
        updates.logo_url = await settingsService.uploadLogo(logoFile)
      }
      if (qrisFile) {
        updates.qris_image_url = await settingsService.uploadQris(qrisFile)
      }

      await settingsService.update(updates)
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Pengaturan disimpan')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    }
  }

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Memuat...</div>

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h1 className="text-xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi restoran & pembayaran</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Restaurant Info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Informasi Restoran</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nama Restoran</Label>
              <Input {...register('restaurant_name')} aria-invalid={!!errors.restaurant_name} />
              {errors.restaurant_name && <p className="text-xs text-destructive">{errors.restaurant_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <textarea {...register('address')} rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <Label>Nomor Telepon</Label>
              <Input {...register('phone')} />
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <Label>Logo Restoran</Label>
              {settings?.logo_url && (
                <img src={settings.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border mb-2" />
              )}
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-3 hover:border-primary transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {logoFile ? logoFile.name : 'Upload logo (PNG/JPG)'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pembayaran & Pajak</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Pajak (%)</Label>
                <Input type="number" step="0.5" {...register('tax_percentage', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Biaya Layanan (%)</Label>
                <Input type="number" step="0.5" {...register('service_percentage', { valueAsNumber: true })} />
              </div>
            </div>

            {/* QRIS Upload */}
            <div className="space-y-1.5">
              <Label>QRIS</Label>
              {settings?.qris_image_url && (
                <img src={settings.qris_image_url} alt="QRIS" className="w-32 rounded-lg border mb-2" />
              )}
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-3 hover:border-primary transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {qrisFile ? qrisFile.name : 'Upload gambar QRIS (PNG/JPG)'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setQrisFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </form>
    </div>
  )
}
