
import { supabase } from "@/lib/supabase"

// Roles disponibles en NEXDESK
export type UserRole = "admin" | "technician" | "user"

// Estructura del perfil
export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

// Obtener el perfil del usuario autenticado
export async function getMyProfile(): Promise<UserProfile> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError

  if (!user) {
    throw new Error("No hay una sesión activa")
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .single()

  if (error) throw error

  return data as UserProfile
}

// Actualizar el nombre del perfil propio
export async function updateMyProfile(
  fullName: string
): Promise<UserProfile> {
  const cleanName = fullName.trim()

  if (cleanName.length < 2) {
    throw new Error(
      "El nombre debe tener al menos 2 caracteres"
    )
  }

  if (cleanName.length > 100) {
    throw new Error(
      "El nombre no puede superar los 100 caracteres"
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError

  if (!user) {
    throw new Error("Debes iniciar sesión")
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: cleanName })
    .eq("id", user.id)

  if (error) throw error

  return getMyProfile()
}
