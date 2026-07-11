import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (error) throw error
    return data as Category[]
  },

  async create(payload: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as Category
  },

  async update(id: string, payload: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Category
  },

  async delete(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },
}
