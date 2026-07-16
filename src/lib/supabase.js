// src/lib/supabase.js — Supabase client singleton
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '.env faylida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY bo\'lishi shart. ' +
    '.env.example faylini ko\'chiring va to\'ldiring.'
  )
}

// Supabase yangi "publishable key" formatini ham qo'llab-quvvatlaydi (sb_publishable_...)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
