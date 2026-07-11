import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCheck, UserX, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userService } from '@/services/userService'
import { authService } from '@/services/authService'
import type { UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['kasir', 'dapur']),
})
type FormData = z.infer<typeof schema>

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  kasir: 'bg-blue-100 text-blue-700',
  dapur: 'bg-orange-100 text-orange-700',
}

export default function AdminUsersPage() {
  const [showDialog, setShowDialog] = useState(false)
  const qc = useQueryClient()

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'kasir' },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.toggleActive(id, isActive),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status diperbarui') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Pengguna dihapus') },
    onError: () => toast.error('Gagal menghapus'),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authService.createStaffUser(data.email, data.password, data.full_name, data.role as UserRole)
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Akun berhasil dibuat')
      setShowDialog(false)
      reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat akun'
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">{users.length} akun staf</p>
        </div>
        <Button onClick={() => { reset(); setShowDialog(true) }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Tambah Staf
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-card rounded-xl border p-4 flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">{formatDate(user.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[user.role]}`}>
                {user.role}
              </span>
              <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                {user.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.is_active })}
                title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              >
                {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hover:text-destructive"
                onClick={() => deleteMutation.mutate(user.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Akun Staf</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input {...register('full_name')} placeholder="Budi Santoso" aria-invalid={!!errors.full_name} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} placeholder="staf@restaurant.com" aria-invalid={!!errors.email} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" {...register('password')} placeholder="••••••••" aria-invalid={!!errors.password} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select onValueChange={(v) => setValue('role', v as 'kasir' | 'dapur')} defaultValue="kasir">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kasir">Kasir</SelectItem>
                  <SelectItem value="dapur">Dapur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Membuat...' : 'Buat Akun'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
