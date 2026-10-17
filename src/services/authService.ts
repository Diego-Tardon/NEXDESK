
import { supabase } from "../lib/supabase"

// Registrar un nuevo usuario
export async function registerUser(
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  return data
}

// Iniciar sesión
export async function loginUser(
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

// Cerrar sesión
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

// Obtener la sesión actual
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  return data.session
}
