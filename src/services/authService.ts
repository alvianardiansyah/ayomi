import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types'

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data as User | null
  },

  async createStaffUser(email: string, password: string, fullName: string, role: UserRole) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        full_name: fullName,
        email,
        role,
        is_active: true,
      })
      .select()
      .single()
    if (error) throw error
    return data as User
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      ;(async () => {
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle()
          callback(data as User | null)
        } else {
          callback(null)
        }
      })()
    })
  },
}
