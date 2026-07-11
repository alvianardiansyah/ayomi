import { supabase } from '@/lib/supabase'
import type { RestaurantSettings } from '@/types'

export const settingsService = {
  async get() {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data as RestaurantSettings | null
  },

  async update(payload: Partial<RestaurantSettings>) {
    const { data: existing } = await supabase
      .from('restaurant_settings')
      .select('id')
      .maybeSingle()

    let result
    if (existing?.id) {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      result = data
    }
    return result as RestaurantSettings
  },

  async uploadLogo(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `logo.${ext}`
    const { error } = await supabase.storage
      .from('restaurant-logo')
      .upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('restaurant-logo').getPublicUrl(fileName)
    return data.publicUrl
  },

  async uploadQris(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `qris.${ext}`
    const { error } = await supabase.storage
      .from('qris')
      .upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('qris').getPublicUrl(fileName)
    return data.publicUrl
  },
}
