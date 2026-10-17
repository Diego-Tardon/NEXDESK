
import type { Ticket } from "@/types/ticket"

// Clave utilizada para guardar los tickets
export const TICKETS_STORAGE_KEY = "nexdesk-tickets"

// Obtener todos los tickets guardados
export function getStoredTickets(): Ticket[] {
  try {
    const savedTickets = localStorage.getItem(
      TICKETS_STORAGE_KEY
    )

    if (!savedTickets) {
      return []
    }

    const parsed: unknown = JSON.parse(savedTickets)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as Ticket[]
  } catch (error) {
    console.error(
      "Error al cargar los tickets:",
      error
    )

    return []
  }
}

// Guardar todos los tickets
export function saveStoredTickets(
  tickets: Ticket[]
): void {
  try {
    localStorage.setItem(
      TICKETS_STORAGE_KEY,
      JSON.stringify(tickets)
    )
  } catch (error) {
    console.error(
      "Error al guardar los tickets:",
      error
    )
  }
}

// Obtener estadísticas para el Dashboard
export function getTicketStats(tickets: Ticket[]) {
  const total = tickets.length

  const pending = tickets.filter(
    (ticket) => ticket.status === "Pendiente"
  ).length

  const inProgress = tickets.filter(
    (ticket) => ticket.status === "En progreso"
  ).length

  const resolved = tickets.filter(
    (ticket) => ticket.status === "Resuelto"
  ).length

  const resolutionRate =
    total > 0
      ? Math.round((resolved / total) * 100)
      : 0

  return {
    total,
    pending,
    inProgress,
    resolved,
    resolutionRate,
  }
}

// Obtener los tickets más recientes
export function getRecentTickets(
  tickets: Ticket[],
  limit = 5
): Ticket[] {
  return [...tickets]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, limit)
}
