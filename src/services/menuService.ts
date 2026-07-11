import { supabase } from '@/lib/supabase'
import type { Menu } from '@/types'

export const menuService = {
  async getAll(categoryId?: string) {
    let query = supabase
      .from('menus')
      .select('*, categories(id, name, icon)')
      .order('created_at', { ascending: false })
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data, error } = await query
    if (error) throw error
    return data as Menu[]
  },

  async getAvailable(categoryId?: string) {
    let query = supabase
      .from('menus')
      .select('*, categories(id, name, icon)')
      .eq('is_available', true)
      .order('is_best_seller', { ascending: false })
      .order('name')
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data, error } = await query
    if (error) throw error
    return data as Menu[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('menus')
      .select('*, categories(id, name, icon)')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as Menu | null
  },

  async create(payload: Omit<Menu, 'id' | 'created_at' | 'updated_at' | 'categories'>) {
    const { data, error } = await supabase
      .from('menus')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as Menu
  },

  async update(id: string, payload: Partial<Menu>) {
    const { data, error } = await supabase
      .from('menus')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Menu
  },

  async delete(id: string) {
    const { error } = await supabase.from('menus').delete().eq('id', id)
    if (error) throw error
  },

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName)
    return data.publicUrl
  },
}
