import { supabase } from '@/lib/supabase'
import type { Table } from '@/types'

export const tableService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number')
    if (error) throw error
    return data as Table[]
  },

  async getByUuid(tableUuid: string) {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('table_uuid', tableUuid)
      .maybeSingle()
    if (error) throw error
    return data as Table | null
  },

  async create(tableNumber: number, notes?: string) {
    const { data, error } = await supabase
      .from('tables')
      .insert({ table_number: tableNumber, notes: notes || null })
      .select()
      .single()
    if (error) throw error
    return data as Table
  },

  async update(id: string, payload: Partial<Table>) {
    const { data, error } = await supabase
      .from('tables')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Table
  },

  async delete(id: string) {
    const { error } = await supabase.from('tables').delete().eq('id', id)
    if (error) throw error
  },

  getQRUrl(tableUuid: string): string {
    return `${window.location.origin}/menu?table=${tableUuid}`
  },
}
