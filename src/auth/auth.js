// src/auth/auth.js — Autentifikatsiya yordamchi funksiyalari
import { supabase } from '../lib/supabase.js'

/**
 * Email va parol bilan kirish
 * @returns {{ session, profile, error }}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { session: null, profile: null, error }

  const profile = await getProfile(data.user.id)
  return { session: data.session, profile, error: null }
}

/**
 * Tizimdan chiqish
 */
export async function signOut() {
  await supabase.auth.signOut()
}

/**
 * Joriy sessiyani va profilni oladi
 * @returns {{ session, profile } | null}
 */
export async function getSessionAndProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const profile = await getProfile(session.user.id)
  return { session, profile }
}

/**
 * Profil ma'lumotlarini oladi
 * @param {string} userId
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Profil olishda xato:', error)
    return null
  }
  return data
}

/**
 * Barcha o'quvchilarni oladi (teacher uchun)
 */
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('coins', { ascending: false })

  if (error) { console.error(error); return [] }
  return data
}

/**
 * Yangi o'quvchi yaratadi (teacher uchun)
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 */
export async function createStudent(email, password, fullName) {
  // Supabase Admin API kerak emas — signUp + metadata ishlatamiz
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'student' }
    }
  })
  if (error) return { error }
  return { data, error: null }
}
