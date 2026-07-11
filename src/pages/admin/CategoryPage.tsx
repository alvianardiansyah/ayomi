import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { categoryService } from '@/services/categoryService'
import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  icon: z.string().optional(),
  sort_order: z.number().min(0),
  is_active: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminCategoryPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const qc = useQueryClient()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, sort_order: 0 },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ is_active: true, sort_order: categories.length + 1, icon: '' })
    setShowDialog(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    reset({ name: cat.name, icon: cat.icon || '', sort_order: cat.sort_order, is_active: cat.is_active })
    setShowDialog(true)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Kategori dihapus') },
    onError: () => toast.error('Gagal. Mungkin ada menu terkait.'),
  })

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await categoryService.update(editing.id, data)
        toast.success('Kategori diperbarui')
      } else {
        await categoryService.create(data as Omit<Category, 'id' | 'created_at' | 'updated_at'>)
        toast.success('Kategori ditambahkan')
      }
      qc.invalidateQueries({ queryKey: ['categories'] })
      setShowDialog(false)
    } catch {
      toast.error('Gagal menyimpan')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Kategori</h1>
          <p className="text-sm text-muted-foreground">{categories.length} kategori</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
              {cat.icon || '📁'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{cat.name}</p>
              <p className="text-xs text-muted-foreground">Urutan: {cat.sort_order}</p>
            </div>
            <Badge variant={cat.is_active ? 'default' : 'secondary'} className="text-xs">
              {cat.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" className="hover:text-destructive" onClick={() => deleteMutation.mutate(cat.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Kategori</Label>
              <Input {...register('name')} placeholder="Makanan" aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Icon (emoji)</Label>
                <Input {...register('icon')} placeholder="🍽️" />
              </div>
              <div className="space-y-1.5">
                <Label>Urutan</Label>
                <Input type="number" {...register('sort_order', { valueAsNumber: true })} placeholder="1" />
              </div>
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
    </div>
  )
}
