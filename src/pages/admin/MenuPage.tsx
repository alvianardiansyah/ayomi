import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Star, Image as ImageIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { menuService } from '@/services/menuService'
import { categoryService } from '@/services/categoryService'
import { formatCurrency } from '@/lib/utils'
import type { Menu } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  price: z.number({ message: 'Harga harus angka' }).min(0),
  description: z.string().nullable().optional(),
  stock: z.number({ message: 'Stok harus angka' }).min(0),
  is_available: z.boolean(),
  is_best_seller: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminMenuPage() {
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Menu | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const qc = useQueryClient()

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['menus-admin'],
    queryFn: () => menuService.getAll(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_available: true, is_best_seller: false, stock: 0 },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ is_available: true, is_best_seller: false, stock: 0, price: 0 })
    setImageFile(null)
    setImagePreview(null)
    setShowDialog(true)
  }

  const openEdit = (menu: Menu) => {
    setEditing(menu)
    reset({
      name: menu.name,
      category_id: menu.category_id,
      price: menu.price,
      description: menu.description || '',
      stock: menu.stock,
      is_available: menu.is_available,
      is_best_seller: menu.is_best_seller,
    })
    setImagePreview(menu.image_url)
    setImageFile(null)
    setShowDialog(true)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus-admin'] })
      toast.success('Menu dihapus')
    },
    onError: () => toast.error('Gagal menghapus menu'),
  })

  const onSubmit = async (data: FormData) => {
    try {
      let image_url = editing?.image_url || null
      if (imageFile) {
        setUploadingImage(true)
        image_url = await menuService.uploadImage(imageFile)
        setUploadingImage(false)
      }

      if (editing) {
        await menuService.update(editing.id, { ...data, image_url })
        toast.success('Menu diperbarui')
      } else {
        await menuService.create({ ...data, description: data.description ?? null, image_url })
        toast.success('Menu ditambahkan')
      }
      qc.invalidateQueries({ queryKey: ['menus-admin'] })
      setShowDialog(false)
    } catch {
      toast.error('Gagal menyimpan menu')
    }
  }

  const filtered = menus.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Menu</h1>
          <p className="text-sm text-muted-foreground">{menus.length} menu tersedia</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Tambah Menu
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((menu, i) => (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl border p-3 flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                {menu.image_url ? (
                  <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{menu.name}</p>
                  {menu.is_best_seller && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0" variant="secondary">
                      <Star className="w-3 h-3 mr-0.5" fill="currentColor" /> Best Seller
                    </Badge>
                  )}
                </div>
                <p className="text-primary font-bold text-sm">{formatCurrency(menu.price)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={menu.is_available ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                    {menu.is_available ? 'Tersedia' : 'Habis'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{menu.categories?.name}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(menu)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hover:text-destructive"
                  onClick={() => deleteMutation.mutate(menu.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Menu' : 'Tambah Menu'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image */}
            <div className="space-y-1.5">
              <Label>Foto Menu</Label>
              <div
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('menu-image-input')?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-sm">Klik untuk upload foto</p>
                  </div>
                )}
              </div>
              <input
                id="menu-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    setImagePreview(URL.createObjectURL(file))
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nama Menu</Label>
              <Input {...register('name')} placeholder="Nasi Goreng Spesial" aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select onValueChange={(v) => setValue('category_id', v)} defaultValue={editing?.category_id}>
                <SelectTrigger aria-invalid={!!errors.category_id}>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Harga (Rp)</Label>
                <Input
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="25000"
                  aria-invalid={!!errors.price}
                />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Stok</Label>
                <Input
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Deskripsi (opsional)</Label>
              <textarea
                {...register('description')}
                placeholder="Nasi goreng dengan telur..."
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Tersedia</Label>
              <Switch
                checked={watch('is_available')}
                onCheckedChange={(v) => setValue('is_available', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Best Seller</Label>
              <Switch
                checked={watch('is_best_seller')}
                onCheckedChange={(v) => setValue('is_best_seller', v)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting || uploadingImage}>
                {isSubmitting || uploadingImage ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
