
import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"

import {
  X,
  Plus,
  LoaderCircle,
  Ticket as TicketIcon,
} from "lucide-react"

import type {
  NewTicketData,
  TicketPriority,
  TicketCategory,
} from "@/types/ticket"

// Propiedades del formulario
type NewTicketFormProps = {
  onClose: () => void
  onCreate: (ticket: NewTicketData) => Promise<void> | void
}

export default function NewTicketForm({
  onClose,
  onCreate,
}: NewTicketFormProps) {
  // Datos del formulario
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const [priority, setPriority] =
    useState<TicketPriority>("Media")

  const [category, setCategory] =
    useState<TicketCategory>("Software")

  // Estado de envío
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Referencias
  const titleInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Bloquear desplazamiento de la página
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    titleInputRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Cerrar con Escape y mantener el foco en el diálogo
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!submitting) {
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
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]'
        )
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
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

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, submitting])

  // Enviar a TicketsPage
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (submitting) return

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()

    if (!cleanTitle || !cleanDescription) {
      setError("Completa el asunto y la descripción.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      await onCreate({
        title: cleanTitle,
        description: cleanDescription,
        priority,
        category,
      })

      // TicketsPage se encarga de cerrar
      // el formulario cuando guarda correctamente.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el ticket."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Cerrar desde el fondo
  function handleBackdropClick() {
    if (!submitting) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleBackdropClick()
        }
      }}
    >
      {/* MODAL */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        aria-describedby="new-ticket-description"
        className="flex max-h-[95dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl"
      >
        {/* ENCABEZADO */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/15">
              <TicketIcon className="h-5 w-5 text-purple-400" />
            </div>

            <div className="min-w-0">
              <h2
                id="new-ticket-title"
                className="text-lg font-bold text-white sm:text-xl"
              >
                Crear nuevo ticket
              </h2>

              <p
                id="new-ticket-description"
                className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm"
              >
                Registra una solicitud de soporte técnico.
              </p>
            </div>
          </div>

          {/* CERRAR */}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar formulario"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORMULARIO */}
        <form
          id="new-ticket-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* CONTENIDO CON SCROLL */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* ASUNTO */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="ticket-title"
                  className="text-sm font-medium text-zinc-300"
                >
                  Asunto
                  <span className="ml-1 text-purple-400">*</span>
                </label>

                <span className="text-xs text-zinc-500">
                  {title.length}/100
                </span>
              </div>

              <input
                ref={titleInputRef}
                id="ticket-title"
                type="text"
                required
                maxLength={100}
                autoComplete="off"
                value={title}
                disabled={submitting}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setError("")
                }}
                placeholder="Ej: Problema con internet"
                className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500 disabled:opacity-60 sm:text-sm"
              />
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label
                htmlFor="ticket-description"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Descripción
                <span className="ml-1 text-purple-400">*</span>
              </label>

              <textarea
                id="ticket-description"
                required
                rows={4}
                maxLength={2000}
                value={description}
                disabled={submitting}
                onChange={(event) => {
                  setDescription(event.target.value)
                  setError("")
                }}
                placeholder="Describe el problema, cuándo comenzó y qué sucede..."
                className="min-h-28 w-full min-w-0 resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base leading-relaxed text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500 disabled:opacity-60 sm:text-sm"
              />

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-zinc-500">
                  {description.length}/2000
                </span>
              </div>
            </div>

            {/* PRIORIDAD Y CATEGORÍA */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* PRIORIDAD */}
              <div className="min-w-0">
                <label
                  htmlFor="ticket-priority"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Prioridad
                </label>

                <select
                  id="ticket-priority"
                  value={priority}
                  disabled={submitting}
                  onChange={(event) =>
                    setPriority(
                      event.target.value as TicketPriority
                    )
                  }
                  className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none transition-colors focus:border-purple-500 disabled:opacity-60 sm:text-sm"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>

              {/* CATEGORÍA */}
              <div className="min-w-0">
                <label
                  htmlFor="ticket-category"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Categoría
                </label>

                <select
                  id="ticket-category"
                  value={category}
                  disabled={submitting}
                  onChange={(event) =>
                    setCategory(
                      event.target.value as TicketCategory
                    )
                  }
                  className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none transition-colors focus:border-purple-500 disabled:opacity-60 sm:text-sm"
                >
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Redes">Redes</option>
                  <option value="Accesos">Accesos</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* INFORMACIÓN */}
            <div className="rounded-lg border border-purple-500/15 bg-purple-500/5 p-3">
              <p className="text-xs leading-relaxed text-zinc-400">
                Tu solicitud se registrará en NEXDESK
                y podrá ser gestionada por el equipo
                de soporte TI.
              </p>
            </div>
          </div>

          {/* BOTONES FIJOS EN LA PARTE INFERIOR */}
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-11 w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creando ticket...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
