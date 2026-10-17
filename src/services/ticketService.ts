
import { supabase } from "../lib/supabase"
import type { Ticket } from "../types/ticket"

type TicketRow = {
  id: string
  title: string
  description: string
  priority: Ticket["priority"]
  category: Ticket["category"]
  status: Ticket["status"]
  created_at: string
  assigned_to: string | null
}

const ticketColumns =
  "id, title, description, priority, category, status, created_at, assigned_to"

function mapTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    assignedTo: row.assigned_to,
  }
}

// Obtener tickets según los permisos del usuario autenticado
export async function getTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select(ticketColumns)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) =>
    mapTicket(row as TicketRow)
  )
}

// Crear un ticket nuevo
export async function createTicket(
  ticket: Pick<
    Ticket,
    "title" | "description" | "priority" | "category"
  >
): Promise<Ticket> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error("Debes iniciar sesión")

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      status: "Pendiente",
      user_id: user.id,
    })
    .select(ticketColumns)
    .single()

  if (error) throw error

  return mapTicket(data as TicketRow)
}

// Actualizar un ticket existente
export async function updateTicket(
  id: string,
  changes: Partial<
    Pick<
      Ticket,
      "title" | "description" | "priority" | "category" | "status"
    >
  >
): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .update(changes)
    .eq("id", id)
    .select(ticketColumns)
    .single()

  if (error) throw error

  return mapTicket(data as TicketRow)
}

// Asignar o quitar un técnico de un ticket
// Solo los administradores deben tener permiso en Supabase
export async function assignTicket(
  ticketId: string,
  technicianId: string | null
): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .update({
      assigned_to: technicianId,
    })
    .eq("id", ticketId)
    .select(ticketColumns)
    .single()

  if (error) throw error

  return mapTicket(data as TicketRow)
}

// Eliminar un ticket
export async function deleteTicket(
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from("tickets")
    .delete()
    .eq("id", id)
    .select("id")

  if (error) throw error

  if (!data?.length) {
    throw new Error(
      "No se encontró el ticket o no tienes permiso"
    )
  }
}

