
import { supabase } from "@/lib/supabase"

export type UserRole = "admin" | "technician" | "user"

export interface SystemUser {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

// Obtener los usuarios registrados en NEXDESK.
// Supabase solo devuelve resultados a administradores.
export async function getAllUsers(): Promise<SystemUser[]> {
  const { data, error } = await supabase.rpc("get_all_users")

  if (error) {
    throw error
  }

  return (data ?? []) as SystemUser[]
}

// Convertir los roles a nombres visibles.
export function getUserRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrador",
    technician: "Técnico TI",
    user: "Usuario",
  }

  return labels[role]
}


export async function updateUserRole(
  userId: string,
  newRole: "user" | "technician"
): Promise<void> {
  const { error } = await supabase.rpc("update_user_role", {
    target_user_id: userId,
    new_role: newRole,
  })

  if (error) {
    throw error
  }
}

