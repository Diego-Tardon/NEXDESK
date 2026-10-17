
import { useEffect, useRef, useState } from "react"

import {
  X,
  Ticket as TicketIcon,
  CalendarDays,
  Tag,
  AlertCircle,
  Clock3,
  FileText,
  Hash,
  UserRound,
  Save,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react"

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket"

import {
  getTechnicians,
  type Technician,
} from "@/services/technicianService"

import { supabase } from "@/lib/supabase"

type TicketDetailsProps = {
  ticket: Ticket
  onClose: () => void
  onAssign: (
    ticketId: string,
    technicianId: string | null
  ) => Promise<void>
  saving: boolean
}

const priorityColors: Record<TicketPriority, string> = {
  Baja: "bg-green-500/10 text-green-400 border-green-500/20",
  Media: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Alta: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Crítica: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusColors: Record<TicketStatus, string> = {
  Pendiente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "En progreso": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Resuelto: "bg-green-500/10 text-green-400 border-green-500/20",
}

export default function TicketDetails({
  ticket,
  onClose,
  onAssign,
  saving,
}: TicketDetailsProps) {
  const [technicians, setTechnicians] =
    useState<Technician[]>([])

  const [loadingTechnicians, setLoadingTechnicians] =
    useState(true)

  const [canAssign, setCanAssign] = useState(false)

  const [selectedTechnician, setSelectedTechnician] =
    useState(ticket.assignedTo ?? "")

  const [assignmentSaving, setAssignmentSaving] =
    useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const isSaving = saving || assignmentSaving

  // Cargar técnicos y comprobar rol
  useEffect(() => {
    let active = true

    async function loadTechnicians() {
      setLoadingTechnicians(true)

      try {
        const [technicianResult, roleResult] =
          await Promise.allSettled([
            getTechnicians(),
            supabase.rpc("get_my_role"),
          ])

        if (!active) return

        if (technicianResult.status === "fulfilled") {
          setTechnicians(technicianResult.value)
        } else {
          setError(
            "No se pudo cargar la lista de técnicos."
          )
        }

        if (
          roleResult.status === "fulfilled" &&
          !roleResult.value.error
        ) {
          setCanAssign(
            roleResult.value.data === "admin"
          )
        } else {
          // Si no podemos verificar el rol,
          // no habilitamos la asignación.
          setCanAssign(false)
        }
      } catch {
        if (active) {
          setError(
            "No se pudo cargar la información del ticket."
          )
          setCanAssign(false)
        }
      } finally {
        if (active) {
          setLoadingTechnicians(false)
        }
      }
    }

    void loadTechnicians()

    return () => {
      active = false
    }
  }, [])

  // Sincronizar la asignación cuando cambia el ticket
  useEffect(() => {
    setSelectedTechnician(ticket.assignedTo ?? "")
  }, [ticket.assignedTo])

  // Bloquear el desplazamiento de la página
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow

    const previousFocus = document.activeElement

    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus()
      }
    }
  }, [])

  // Cerrar con Escape y mantener el foco en el modal
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isSaving) {
          event.preventDefault()
          onClose()
        }
        return
      }

      if (event.key !== "Tab") return

      const dialog = dialogRef.current

      if (!dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href]'
        )
      ).filter(
        (element) =>
          element.getClientRects().length > 0
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [onClose, isSaving])

  const formattedDate = new Date(
    ticket.createdAt
  ).toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  })

  const hasChanges =
    selectedTechnician !==
    (ticket.assignedTo ?? "")

  const assignedTechnician = technicians.find(
    (technician) =>
      technician.id === ticket.assignedTo
  )

  // Guardar asignación en Supabase
  async function handleSaveAssignment() {
    if (
      isSaving ||
      !hasChanges ||
      !canAssign ||
      loadingTechnicians
    ) {
      return
    }

    setAssignmentSaving(true)
    setError("")
    setSuccess("")

    try {
      await onAssign(
        ticket.id,
        selectedTechnician || null
      )

      setSuccess(
        "Asignación guardada correctamente."
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la asignación."
      )
    } finally {
      setAssignmentSaving(false)
    }
  }

  function requestClose() {
    if (!isSaving) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          requestClose()
        }
      }}
    >
      {/* VENTANA PRINCIPAL */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-details-title"
        className="flex max-h-[95dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl"
      >
        {/* ENCABEZADO */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 sm:h-12 sm:w-12">
              <TicketIcon className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                Detalles del ticket
              </p>

              <h2
                id="ticket-details-title"
                className="break-words text-lg font-bold leading-snug text-white sm:text-xl"
              >
                {ticket.title}
              </h2>

              <p className="mt-2 font-mono text-xs text-zinc-500">
                #{ticket.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Cerrar detalles"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENIDO DESPLAZABLE */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {/* DESCRIPCIÓN */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />

              <h3 className="text-sm font-semibold text-white">
                Descripción del problema
              </h3>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
                {ticket.description}
              </p>
            </div>
          </section>

          {/* INFORMACIÓN GENERAL */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-white">
              Información general
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* PRIORIDAD */}
              <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-zinc-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-xs">
                    Prioridad
                  </span>
                </div>

                <span
                  className={`inline-flex max-w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium ${priorityColors[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
              </div>

              {/* ESTADO */}
              <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-zinc-400">
                  <Clock3 className="h-4 w-4 shrink-0" />
                  <span className="text-xs">
                    Estado
                  </span>
                </div>

                <span
                  className={`inline-flex max-w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium ${statusColors[ticket.status]}`}
                >
                  {ticket.status}
                </span>
              </div>

              {/* CATEGORÍA */}
              <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-zinc-400">
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="text-xs">
                    Categoría
                  </span>
                </div>

                <p className="break-words text-sm font-medium text-white">
                  {ticket.category}
                </p>
              </div>

              {/* FECHA */}
              <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-zinc-400">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="text-xs">
                    Fecha de creación
                  </span>
                </div>

                <p className="break-words text-xs leading-relaxed font-medium text-white sm:text-sm">
                  {formattedDate}
                </p>
              </div>
            </div>
          </section>

          {/* ASIGNACIÓN DE TÉCNICOS */}
          <section className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5">
            <div className="mb-4 flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <UserRound className="h-5 w-5 text-purple-400" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Técnico asignado
                </h3>

                <p className="mt-1 break-words text-xs leading-relaxed text-zinc-400">
                  {ticket.assignedTo
                    ? assignedTechnician?.full_name ??
                      "Técnico asignado"
                    : "Este ticket aún no tiene técnico"}
                </p>
              </div>
            </div>

            {loadingTechnicians ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando técnicos...
              </div>
            ) : canAssign ? (
              <>
                <label
                  htmlFor="ticket-technician"
                  className="mb-2 block text-xs font-medium text-zinc-400"
                >
                  Seleccionar técnico
                </label>

                <select
                  id="ticket-technician"
                  value={selectedTechnician}
                  onChange={(event) => {
                    setSelectedTechnician(
                      event.target.value
                    )
                    setError("")
                    setSuccess("")
                  }}
                  disabled={isSaving}
                  className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none transition-colors focus:border-purple-500 disabled:opacity-50 sm:text-sm"
                >
                  <option value="">
                    Sin técnico asignado
                  </option>

                  {ticket.assignedTo &&
                    !technicians.some(
                      (technician) =>
                        technician.id ===
                        ticket.assignedTo
                    ) && (
                      <option
                        value={ticket.assignedTo}
                      >
                        Técnico asignado actualmente
                      </option>
                    )}

                  {technicians.map((technician) => (
                    <option
                      key={technician.id}
                      value={technician.id}
                    >
                      {technician.full_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    void handleSaveAssignment()
                  }
                  disabled={
                    isSaving ||
                    !hasChanges
                  }
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar asignación
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-500">
                Solo los administradores pueden cambiar
                la asignación de técnicos.
              </p>
            )}

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* CONFIRMACIÓN */}
            {success && (
              <div
                role="status"
                className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}
          </section>

          {/* IDENTIFICADOR */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <Hash className="h-4 w-4" />

              <span className="text-xs">
                Identificador único del ticket
              </span>
            </div>

            <p className="break-all font-mono text-xs leading-relaxed text-zinc-300">
              {ticket.id}
            </p>
          </section>
        </div>

        {/* PIE FIJO */}
        <div className="flex shrink-0 justify-end border-t border-zinc-800 bg-zinc-950 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            className="min-h-11 w-full rounded-lg bg-zinc-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 sm:w-auto"
          >
            Cerrar detalles
          </button>
        </div>
      </div>
    </div>
  )
}
