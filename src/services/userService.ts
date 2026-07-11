import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as User[]
  },

  async update(id: string, payload: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as User
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as User
  },

  async delete(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
  },
}
