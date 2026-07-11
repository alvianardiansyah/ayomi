import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, QrCode, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { QRCodeCanvas as QRCode } from 'qrcode.react'
import { tableService } from '@/services/tableService'
import type { Table } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

const schema = z.object({
  table_number: z.number({ message: 'Nomor meja harus angka' }).min(1),
  notes: z.string().optional(),
  is_active: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminTablePage() {
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Table | null>(null)
  const [qrTable, setQrTable] = useState<Table | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableService.getAll(),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ is_active: true, table_number: tables.length + 1 })
    setShowDialog(true)
  }

  const openEdit = (t: Table) => {
    setEditing(t)
    reset({ table_number: t.table_number, notes: t.notes || '', is_active: t.is_active })
    setShowDialog(true)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tableService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('Meja dihapus') },
    onError: () => toast.error('Gagal. Ada pesanan terkait.'),
  })

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await tableService.update(editing.id, data)
        toast.success('Meja diperbarui')
      } else {
        await tableService.create(data.table_number, data.notes)
        toast.success('Meja ditambahkan')
      }
      qc.invalidateQueries({ queryKey: ['tables'] })
      setShowDialog(false)
    } catch {
      toast.error('Gagal menyimpan')
    }
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-meja-${qrTable?.table_number}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Meja</h1>
          <p className="text-sm text-muted-foreground">{tables.length} meja</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah Meja</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((table) => (
          <div key={table.id} className="bg-card rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Meja {table.table_number}</p>
                {table.notes && <p className="text-xs text-muted-foreground">{table.notes}</p>}
              </div>
              <Badge variant={table.is_active ? 'default' : 'secondary'} className="text-xs">
                {table.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setQrTable(table)}>
                <QrCode className="w-3.5 h-3.5 mr-1" /> QR Code
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(table)}><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="hover:text-destructive" onClick={() => deleteMutation.mutate(table.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Meja' : 'Tambah Meja'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nomor Meja</Label>
              <Input type="number" {...register('table_number', { valueAsNumber: true })} placeholder="1" aria-invalid={!!errors.table_number} />
              {errors.table_number && <p className="text-xs text-destructive">{errors.table_number.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan (opsional)</Label>
              <Input {...register('notes')} placeholder="Dekat jendela" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={!!qrTable} onOpenChange={() => setQrTable(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>QR Code Meja {qrTable?.table_number}</DialogTitle></DialogHeader>
          {qrTable && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div ref={qrRef} className="p-4 bg-white rounded-xl border">
                <QRCode
                  value={tableService.getQRUrl(qrTable.table_uuid)}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center break-all">
                {tableService.getQRUrl(qrTable.table_uuid)}
              </p>
              <Button onClick={downloadQR} className="w-full" size="sm">
                <Download className="w-4 h-4 mr-2" /> Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
