
export type TicketPriority =
  | "Baja"
  | "Media"
  | "Alta"
  | "Crítica"

export type TicketCategory =
  | "Software"
  | "Hardware"
  | "Redes"
  | "Accesos"
  | "Otro"

export type TicketStatus =
  | "Pendiente"
  | "En progreso"
  | "Resuelto"

export type Ticket = {
  id: string
  title: string
  description: string
  priority: TicketPriority
  category: TicketCategory
  status: TicketStatus
  createdAt: string

  // UUID del técnico asignado
  // null significa que no tiene técnico
  assignedTo?: string | null
}

export type NewTicketData = Pick<
  Ticket,
  "title" | "description" | "priority" | "category"
>
