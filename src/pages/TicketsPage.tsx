
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import {
  Plus,
  Search,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  Ticket as TicketIcon,
  UserRound,
  CalendarDays,
} from "lucide-react"

import NewTicketForm from "@/components/tickets/NewTicketForm"
import TicketDetails from "@/components/tickets/TicketDetails"
import EditTicketForm from "@/components/tickets/EditTicketForm"
import DeleteTicketDialog from "@/components/tickets/DeleteTicketDialog"

import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
} from "@/services/ticketService"

import {
  getMyProfile,
  type UserRole,
} from "@/services/profileService"

import {
  getTicketAssigneeNames,
} from "@/services/ticketAssigneeService"

import { useAppSettings } from "@/hooks/useAppSettings"
import { formatAppDate } from "@/services/settingsService"
import { supabase } from "@/lib/supabase"

import type {
  Ticket,
  NewTicketData,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket"

// Colores de prioridades
const priorityColors: Record<TicketPriority, string> = {
  Baja: "bg-green-500/10 text-green-400",
  Media: "bg-blue-500/10 text-blue-400",
  Alta: "bg-orange-500/10 text-orange-400",
  Crítica: "bg-red-500/10 text-red-400",
}

// Colores de estados
const statusColors: Record<TicketStatus, string> = {
  Pendiente: "bg-yellow-500/10 text-yellow-400",
  "En progreso": "bg-blue-500/10 text-blue-400",
  Resuelto: "bg-green-500/10 text-green-400",
}

// Manejo de errores
function getErrorMessage(error: unknown): string {
  console.error("Error de Supabase:", error)

  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "Ocurrió un error desconocido con Supabase"
}

export default function TicketsPage() {
  // Preferencias
  const settings = useAppSettings()
  const compactMode = settings.compactMode
  const dateFormat = settings.dateFormat

  // Búsqueda desde la URL
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get("search") ?? ""

  // Datos
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [assigneeNames, setAssigneeNames] =
    useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Permisos
  const [role, setRole] = useState<UserRole>("user")
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [permissionsLoaded, setPermissionsLoaded] =
    useState(false)

  // Ventanas
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [selectedTicketId, setSelectedTicketId] =
    useState<string | null>(null)

  const [editingTicketId, setEditingTicketId] =
    useState<string | null>(null)

  const [deletingTicketId, setDeletingTicketId] =
    useState<string | null>(null)

  // Filtros
  const [priorityFilter, setPriorityFilter] =
    useState("Todas")

  const [statusFilter, setStatusFilter] =
    useState("Todos")

  // Espaciados
  const pagePadding = compactMode
    ? "p-3 sm:p-4 lg:p-5"
    : "p-4 sm:p-6 lg:p-8"

  const sectionSpacing = compactMode ? "mt-4" : "mt-8"

  const tableSpacing = compactMode
    ? "px-4 py-2.5"
    : "px-6 py-4"

  const panelPadding = compactMode
    ? "p-3 sm:p-4"
    : "p-4 sm:p-5"

  // Actualizar búsqueda en la URL
  function handleSearchChange(value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)

        if (value.trim()) {
          next.set("search", value)
        } else {
          next.delete("search")
        }

        return next
      },
      { replace: true }
    )
  }

  // Obtener nombres de técnicos
  async function refreshAssigneeNames() {
    const assignments = await getTicketAssigneeNames()
    const names: Record<string, string> = {}

    for (const assignment of assignments) {
      names[assignment.ticket_id] =
        assignment.technician_name.trim() ||
        "Técnico sin nombre"
    }

    setAssigneeNames(names)
  }

  // Cargar información
  useEffect(() => {
    let active = true

    async function loadPage() {
      setLoading(true)
      setError("")

      try {
        const [
          ticketData,
          profile,
          authResult,
          assignments,
        ] = await Promise.all([
          getTickets(),
          getMyProfile(),
          supabase.auth.getUser(),
          getTicketAssigneeNames(),
        ])

        if (authResult.error) {
          throw authResult.error
        }

        if (!authResult.data.user) {
          throw new Error("No hay una sesión activa")
        }

        if (!active) return

        const names: Record<string, string> = {}

        for (const assignment of assignments) {
          names[assignment.ticket_id] =
            assignment.technician_name.trim() ||
            "Técnico sin nombre"
        }

        setTickets(ticketData)
        setAssigneeNames(names)
        setRole(profile.role)
        setCurrentUserId(authResult.data.user.id)
        setPermissionsLoaded(true)
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      active = false
    }
  }, [])

  // Crear ticket
  async function handleCreateTicket(data: NewTicketData) {
    if (saving) return

    setSaving(true)
    setError("")

    try {
      const newTicket = await createTicket(data)

      setTickets((previousTickets) => [
        newTicket,
        ...previousTickets,
      ])

      setIsFormOpen(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Cambiar estado
  async function handleChangeStatus(
    ticketId: string,
    newStatus: TicketStatus
  ) {
    if (saving || !permissionsLoaded) return

    const ticket = tickets.find(
      (item) => item.id === ticketId
    )

    if (!ticket) return

    const canChangeStatus =
      role === "admin" ||
      (
        role === "technician" &&
        currentUserId !== null &&
        ticket.assignedTo === currentUserId
      )

    if (!canChangeStatus) return

    setSaving(true)
    setError("")

    try {
      const updatedTicket = await updateTicket(
        ticketId,
        { status: newStatus }
      )

      setTickets((previousTickets) =>
        previousTickets.map((item) =>
          item.id === ticketId ? updatedTicket : item
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Editar ticket
  async function handleEditTicket(
    ticketId: string,
    data: NewTicketData
  ) {
    if (saving) return

    setSaving(true)
    setError("")

    try {
      const updatedTicket = await updateTicket(
        ticketId,
        {
          title: data.title,
          description: data.description,
          priority: data.priority,
          category: data.category,
        }
      )

      setTickets((previousTickets) =>
        previousTickets.map((item) =>
          item.id === ticketId ? updatedTicket : item
        )
      )

      setEditingTicketId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Eliminar ticket
  async function handleDeleteTicket(ticketId: string) {
    if (saving || role !== "admin") return

    setSaving(true)
    setError("")

    try {
      await deleteTicket(ticketId)

      setTickets((previousTickets) =>
        previousTickets.filter(
          (item) => item.id !== ticketId
        )
      )

      setAssigneeNames((previousNames) => {
        const nextNames = { ...previousNames }
        delete nextNames[ticketId]
        return nextNames
      })

      setDeletingTicketId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Asignar o quitar técnico
  async function handleAssignTicket(
    ticketId: string,
    technicianId: string | null
  ): Promise<void> {
    if (saving) {
      throw new Error("Ya hay una operación en curso")
    }

    if (role !== "admin") {
      throw new Error(
        "Solo los administradores pueden asignar técnicos"
      )
    }

    setSaving(true)
    setError("")

    try {
      const updatedTicket = await assignTicket(
        ticketId,
        technicianId
      )

      setTickets((previousTickets) =>
        previousTickets.map((item) =>
          item.id === ticketId ? updatedTicket : item
        )
      )

      try {
        await refreshAssigneeNames()
      } catch (refreshError) {
        console.error(
          "No se pudieron actualizar los nombres:",
          refreshError
        )

        setError(
          "La asignación se guardó, pero no se pudo actualizar el nombre del técnico. Recarga la página."
        )
      }
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Limpiar filtros
  function handleClearFilters() {
    handleSearchChange("")
    setPriorityFilter("Todas")
    setStatusFilter("Todos")
  }

  // Filtrar tickets
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(normalizedSearch) ||
      ticket.description.toLowerCase().includes(normalizedSearch) ||
      ticket.category.toLowerCase().includes(normalizedSearch)

    const matchesPriority =
      priorityFilter === "Todas" ||
      ticket.priority === priorityFilter

    const matchesStatus =
      statusFilter === "Todos" ||
      ticket.status === statusFilter

    return (
      matchesSearch &&
      matchesPriority &&
      matchesStatus
    )
  })

  // Tickets seleccionados
  const selectedTicket =
    tickets.find(
      (ticket) => ticket.id === selectedTicketId
    ) ?? null

  const editingTicket =
    tickets.find(
      (ticket) => ticket.id === editingTicketId
    ) ?? null

  const deletingTicket =
    tickets.find(
      (ticket) => ticket.id === deletingTicketId
    ) ?? null

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    priorityFilter !== "Todas" ||
    statusFilter !== "Todos"

  // Permisos de estado
  function canChangeTicketStatus(ticket: Ticket): boolean {
    if (!permissionsLoaded) return false

    return (
      role === "admin" ||
      (
        role === "technician" &&
        currentUserId !== null &&
        ticket.assignedTo === currentUserId
      )
    )
  }

  // Permisos de edición
  function canEditTicket(ticket: Ticket): boolean {
    if (!permissionsLoaded) return false

    if (role === "admin") return true

    return (
      ticket.status === "Pendiente" &&
      ticket.assignedTo == null
    )
  }

  // Nombre del técnico
  function getAssigneeLabel(ticket: Ticket): string {
    if (!ticket.assignedTo) {
      return "Sin asignar"
    }

    return (
      assigneeNames[ticket.id] ??
      "Cargando nombre..."
    )
  }

  // Estado reutilizable en móvil y escritorio
  function renderTicketStatus(ticket: Ticket) {
    if (canChangeTicketStatus(ticket)) {
      return (
        <select
          aria-label={`Estado del ticket ${ticket.title}`}
          value={ticket.status}
          disabled={saving}
          onChange={(event) =>
            void handleChangeStatus(
              ticket.id,
              event.target.value as TicketStatus
            )
          }
          className={`max-w-full cursor-pointer rounded-lg border border-zinc-800 px-3 text-xs font-medium outline-none focus:border-purple-500 disabled:opacity-50 ${
            compactMode ? "py-1.5" : "py-2"
          } ${statusColors[ticket.status]}`}
        >
          <option value="Pendiente" className="bg-zinc-900">
            Pendiente
          </option>

          <option value="En progreso" className="bg-zinc-900">
            En progreso
          </option>

          <option value="Resuelto" className="bg-zinc-900">
            Resuelto
          </option>
        </select>
      )
    }

    return (
      <span
        className={`inline-flex rounded-lg px-3 text-xs font-medium ${
          compactMode ? "py-1.5" : "py-2"
        } ${statusColors[ticket.status]}`}
      >
        {ticket.status}
      </span>
    )
  }

  // Acciones reutilizables
  function renderTicketActions(
    ticket: Ticket,
    mobile = false
  ) {
    return (
      <div
        className={`flex items-center ${
          mobile
            ? "w-full gap-2"
            : compactMode
              ? "gap-1"
              : "gap-2"
        }`}
      >
        <button
          type="button"
          onClick={() => setSelectedTicketId(ticket.id)}
          aria-label={`Ver detalles de ${ticket.title}`}
          title="Ver detalles"
          className={`flex items-center justify-center gap-2 rounded-lg border border-zinc-800 text-zinc-300 transition-colors hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-400 ${
            mobile
              ? "min-h-10 flex-1 px-3 py-2 text-xs font-medium"
              : "p-2"
          }`}
        >
          <Eye className="h-4 w-4 shrink-0" />
          {mobile && <span>Ver detalles</span>}
        </button>

        {canEditTicket(ticket) && (
          <button
            type="button"
            disabled={saving}
            onClick={() => setEditingTicketId(ticket.id)}
            aria-label={`Editar ${ticket.title}`}
            title="Editar ticket"
            className={`flex items-center justify-center gap-2 rounded-lg border border-zinc-800 text-zinc-300 transition-colors hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-400 disabled:opacity-50 ${
              mobile
                ? "min-h-10 flex-1 px-3 py-2 text-xs font-medium"
                : "p-2"
            }`}
          >
            <Pencil className="h-4 w-4 shrink-0" />
            {mobile && <span>Editar</span>}
          </button>
        )}

        {permissionsLoaded && role === "admin" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => setDeletingTicketId(ticket.id)}
            aria-label={`Eliminar ${ticket.title}`}
            title="Eliminar ticket"
            className={`flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-50 ${
              mobile
                ? "min-h-10 min-w-10 px-3 py-2"
                : "p-2"
            }`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <main
      className={`min-w-0 flex-1 bg-zinc-900 ${pagePadding}`}
    >
      {/* ENCABEZADO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400">
            NEXDESK / Tickets
          </p>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Gestión de Tickets
          </h1>

          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Administra las solicitudes de soporte TI.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          disabled={saving}
          className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo ticket
        </button>
      </div>

      {/* ERRORES */}
      {error && (
        <div
          role="alert"
          className="mt-6 break-words rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {/* GUARDANDO */}
      {saving && (
        <p
          role="status"
          className="mt-4 text-sm text-purple-400"
        >
          Guardando cambios en Supabase...
        </p>
      )}

      {/* BUSCADOR Y FILTROS */}
      <section
        className={`${sectionSpacing} rounded-xl border border-zinc-800 bg-zinc-950 ${panelPadding}`}
      >
        <div className={compactMode ? "mb-3" : "mb-4"}>
          <h2 className="text-base font-semibold text-white">
            Buscar y filtrar
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Encuentra solicitudes rápidamente.
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
            compactMode ? "lg:gap-3" : "lg:gap-4"
          }`}
        >
          {/* BUSCADOR */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="ticket-search"
              className="mb-2 block text-sm text-zinc-400"
            >
              Buscar tickets
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <input
                id="ticket-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                placeholder="Asunto, descripción o categoría..."
                className={`w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-500 ${
                  compactMode ? "py-2.5" : "py-3"
                }`}
              />
            </div>
          </div>

          {/* PRIORIDAD */}
          <div className="min-w-0">
            <label
              htmlFor="priority-filter"
              className="mb-2 block text-sm text-zinc-400"
            >
              Prioridad
            </label>

            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className={`w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-purple-500 sm:px-4 ${
                compactMode ? "py-2.5" : "py-3"
              }`}
            >
              <option value="Todas">
                Todas las prioridades
              </option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          {/* ESTADO */}
          <div className="min-w-0">
            <label
              htmlFor="status-filter"
              className="mb-2 block text-sm text-zinc-400"
            >
              Estado
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className={`w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-purple-500 sm:px-4 ${
                compactMode ? "py-2.5" : "py-3"
              }`}
            >
              <option value="Todos">
                Todos los estados
              </option>
              <option value="Pendiente">Pendiente</option>
              <option value="En progreso">En progreso</option>
              <option value="Resuelto">Resuelto</option>
            </select>
          </div>
        </div>

        {/* LIMPIAR FILTROS */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-purple-400 transition-colors hover:bg-purple-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {/* LISTADO DE TICKETS */}
      <section
        className={`${
          compactMode ? "mt-4" : "mt-6"
        } min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950`}
      >
        {/* ENCABEZADO */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 ${
            compactMode ? "p-4" : "p-4 sm:p-6"
          }`}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">
              Todos los tickets
            </h2>

            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              {loading
                ? "Cargando tickets desde Supabase..."
                : hasActiveFilters
                  ? `Mostrando ${filteredTickets.length} de ${tickets.length} tickets`
                  : "Solicitudes de soporte registradas"}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
            {filteredTickets.length} resultados
          </span>
        </div>

        {/* CARGANDO */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500" />

            <p className="text-sm text-zinc-400">
              Cargando tickets...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* SIN RESULTADOS */
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <div className="rounded-xl bg-purple-500/10 p-4">
              {hasActiveFilters ? (
                <Search className="h-8 w-8 text-purple-400" />
              ) : (
                <TicketIcon className="h-8 w-8 text-purple-400" />
              )}
            </div>

            <h3 className="text-lg font-semibold text-white">
              {hasActiveFilters
                ? "No se encontraron tickets"
                : "No hay tickets registrados"}
            </h3>

            <p className="max-w-sm text-sm text-zinc-400">
              {hasActiveFilters
                ? "Prueba con otros términos o cambia los filtros."
                : "Presiona Nuevo ticket para registrar tu primera solicitud de soporte técnico."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* TARJETAS MÓVILES */}
            <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
              {filteredTickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className={`min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 ${
                    compactMode ? "p-3" : "p-4"
                  }`}
                >
                  {/* TÍTULO Y PRIORIDAD */}
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        title={ticket.id}
                        className="mb-2 font-mono text-[11px] text-purple-400"
                      >
                        #{ticket.id.slice(0, 8)}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTicketId(ticket.id)
                        }
                        className="block max-w-full break-words text-left text-sm font-semibold text-white transition-colors hover:text-purple-400"
                      >
                        {ticket.title}
                      </button>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        priorityColors[ticket.priority]
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  {/* DESCRIPCIÓN */}
                  <p className="mt-2 line-clamp-2 break-words text-xs leading-relaxed text-zinc-400">
                    {ticket.description}
                  </p>

                  {/* CATEGORÍA Y FECHA */}
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] text-zinc-500">
                        Categoría
                      </p>

                      <p className="truncate text-xs font-medium text-zinc-200">
                        {ticket.category}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] text-zinc-500">
                        Fecha
                      </p>

                      <p className="flex items-center gap-1.5 text-xs text-zinc-200">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate">
                          {formatAppDate(
                            ticket.createdAt,
                            dateFormat
                          )}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ESTADO */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500">
                      Estado
                    </span>

                    {renderTicketStatus(ticket)}
                  </div>

                  {/* TÉCNICO */}
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
                    <span className="shrink-0 text-xs text-zinc-500">
                      Técnico
                    </span>

                    <div className="flex min-w-0 items-center gap-2">
                      {ticket.assignedTo && (
                        <UserRound className="h-4 w-4 shrink-0 text-purple-400" />
                      )}

                      <span className="truncate text-right text-xs text-zinc-300">
                        {getAssigneeLabel(ticket)}
                      </span>
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="mt-4 border-t border-zinc-800 pt-3">
                    {renderTicketActions(ticket, true)}
                  </div>
                </article>
              ))}
            </div>

            {/* TABLA ESCRITORIO */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className={tableSpacing}>Asunto</th>
                    <th className={tableSpacing}>Categoría</th>
                    <th className={tableSpacing}>Prioridad</th>
                    <th className={tableSpacing}>Estado</th>
                    <th className={tableSpacing}>
                      Técnico asignado
                    </th>
                    <th className={tableSpacing}>Fecha</th>
                    <th className={tableSpacing}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-zinc-800/70 transition-colors last:border-0 hover:bg-zinc-900"
                    >
                      {/* ASUNTO */}
                      <td className={tableSpacing}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTicketId(ticket.id)
                          }
                          className="max-w-xs break-words text-left text-sm font-medium text-white transition-colors hover:text-purple-400"
                        >
                          {ticket.title}
                        </button>

                        <p className="mt-1 max-w-xs truncate text-xs text-zinc-500">
                          {ticket.description}
                        </p>
                      </td>

                      {/* CATEGORÍA */}
                      <td
                        className={`${tableSpacing} text-sm text-zinc-400`}
                      >
                        {ticket.category}
                      </td>

                      {/* PRIORIDAD */}
                      <td className={tableSpacing}>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            priorityColors[ticket.priority]
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className={tableSpacing}>
                        {renderTicketStatus(ticket)}
                      </td>

                      {/* TÉCNICO */}
                      <td className={tableSpacing}>
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                              <UserRound className="h-4 w-4 text-purple-400" />
                            </div>

                            <span className="max-w-[180px] truncate text-sm font-medium text-zinc-200">
                              {getAssigneeLabel(ticket)}
                            </span>
                          </div>
                        ) : (
                          <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs text-zinc-400">
                            Sin asignar
                          </span>
                        )}
                      </td>

                      {/* FECHA */}
                      <td
                        className={`${tableSpacing} whitespace-nowrap text-sm text-zinc-400`}
                      >
                        {formatAppDate(
                          ticket.createdAt,
                          dateFormat
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className={tableSpacing}>
                        {renderTicketActions(ticket)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* CREAR TICKET */}
      {isFormOpen && (
        <NewTicketForm
          onClose={() => {
            if (!saving) {
              setIsFormOpen(false)
            }
          }}
          onCreate={handleCreateTicket}
        />
      )}

      {/* DETALLES Y ASIGNACIÓN */}
      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => {
            if (!saving) {
              setSelectedTicketId(null)
            }
          }}
          onAssign={handleAssignTicket}
          saving={saving}
        />
      )}

      {/* EDITAR TICKET */}
      {editingTicket && (
        <EditTicketForm
          key={editingTicket.id}
          ticket={editingTicket}
          onClose={() => {
            if (!saving) {
              setEditingTicketId(null)
            }
          }}
          onSave={handleEditTicket}
        />
      )}

      {/* ELIMINAR TICKET */}
      {deletingTicket && (
        <DeleteTicketDialog
          ticket={deletingTicket}
          onClose={() => {
            if (!saving) {
              setDeletingTicketId(null)
            }
          }}
          onConfirm={handleDeleteTicket}
        />
      )}
    </main>
  )
}
