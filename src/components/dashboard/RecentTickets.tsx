
import {
  Inbox,
  ArrowUpRight,
  CalendarDays,
  Ticket as TicketIcon,
  Tag,
} from "lucide-react"

import { Link } from "react-router-dom"

import { getRecentTickets } from "@/services/ticketStorage"

import { useAppSettings } from "@/hooks/useAppSettings"
import { formatAppDate } from "@/services/settingsService"

import type {
  Ticket,
  TicketStatus,
} from "@/types/ticket"

interface RecentTicketsProps {
  tickets: Ticket[]
}

const statusColors: Record<TicketStatus, string> = {
  Pendiente:
    "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  "En progreso":
    "border-purple-500/20 bg-purple-500/10 text-purple-400",
  Resuelto:
    "border-green-500/20 bg-green-500/10 text-green-400",
}

export default function RecentTickets({
  tickets,
}: RecentTicketsProps) {
  // Preferencias
  const settings = useAppSettings()

  const compactMode = settings.compactMode
  const dateFormat = settings.dateFormat

  // Últimos cinco tickets
  const recentTickets = getRecentTickets(tickets, 5)

  const sectionMargin = compactMode
    ? "mt-4"
    : "mt-7 sm:mt-8"

  const headerPadding = compactMode
    ? "p-3 sm:p-4"
    : "p-4 sm:p-6"

  const cellPadding = compactMode
    ? "px-4 py-3"
    : "px-5 py-4"

  const mobilePadding = compactMode
    ? "p-3"
    : "p-4"

  return (
    <section
      className={`${sectionMargin} min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950`}
    >
      {/* ENCABEZADO */}
      <div
        className={`flex flex-col gap-4 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between ${headerPadding}`}
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Tickets recientes
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Últimas solicitudes de soporte registradas
          </p>
        </div>

        <Link
          to="/tickets"
          className="inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/10 hover:text-purple-300"
        >
          Ver todos los tickets
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* SIN TICKETS */}
      {recentTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-14">
          <div className="mb-4 rounded-xl bg-purple-500/10 p-4">
            <Inbox className="h-8 w-8 text-purple-400" />
          </div>

          <h3 className="text-base font-semibold text-white sm:text-lg">
            Todavía no hay tickets
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
            Cuando registres solicitudes de soporte,
            aparecerán aquí automáticamente.
          </p>

          <Link
            to="/tickets"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            Ir a Tickets
          </Link>
        </div>
      ) : (
        <>
          {/* TARJETAS PARA CELULARES */}
          <div
            className={`space-y-3 md:hidden ${mobilePadding}`}
          >
            {recentTickets.map((ticket) => (
              <article
                key={ticket.id}
                className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-purple-500/30"
              >
                {/* ID Y ESTADO */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    title={ticket.id}
                    className="flex items-center gap-1.5 font-mono text-xs text-purple-400"
                  >
                    <TicketIcon className="h-3.5 w-3.5" />
                    #{ticket.id.slice(0, 8)}
                  </span>

                  <span
                    className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusColors[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>
                </div>

                {/* ASUNTO */}
                <Link
                  to={`/tickets?search=${encodeURIComponent(ticket.title)}`}
                  className="mt-3 block break-words text-sm font-semibold leading-relaxed text-white transition-colors hover:text-purple-400"
                >
                  {ticket.title}
                </Link>

                {/* DESCRIPCIÓN */}
                <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-zinc-400">
                  {ticket.description}
                </p>

                {/* CATEGORÍA Y FECHA */}
                <div className="mt-4 flex flex-col gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-between">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 shrink-0 text-purple-400" />

                    <span className="break-words">
                      {ticket.category}
                    </span>
                  </div>

                  <div className="flex min-w-0 items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />

                    <span className="break-words">
                      {formatAppDate(
                        ticket.createdAt,
                        dateFormat
                      )}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* TABLA PARA COMPUTADORES */}
          <div className="hidden min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-zinc-800 bg-zinc-900/30 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className={cellPadding}>
                    ID
                  </th>

                  <th className={cellPadding}>
                    Asunto
                  </th>

                  <th className={cellPadding}>
                    Categoría
                  </th>

                  <th className={cellPadding}>
                    Estado
                  </th>

                  <th className={cellPadding}>
                    Fecha
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-zinc-800/70 transition-colors last:border-0 hover:bg-zinc-900/60"
                  >
                    {/* ID */}
                    <td className={cellPadding}>
                      <span
                        title={ticket.id}
                        className="font-mono text-xs text-purple-400"
                      >
                        {ticket.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* ASUNTO */}
                    <td className={cellPadding}>
                      <Link
                        to={`/tickets?search=${encodeURIComponent(ticket.title)}`}
                        className="block max-w-sm truncate text-sm font-medium text-white transition-colors hover:text-purple-400"
                      >
                        {ticket.title}
                      </Link>

                      <p className="mt-1 max-w-sm truncate text-xs text-zinc-500">
                        {ticket.description}
                      </p>
                    </td>

                    {/* CATEGORÍA */}
                    <td
                      className={`${cellPadding} text-sm text-zinc-400`}
                    >
                      {ticket.category}
                    </td>

                    {/* ESTADO */}
                    <td className={cellPadding}>
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${statusColors[ticket.status]}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    {/* FECHA */}
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm text-zinc-400">
                        <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />

                        {formatAppDate(
                          ticket.createdAt,
                          dateFormat
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
