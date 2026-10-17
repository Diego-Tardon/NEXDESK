
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react"

import {
  X,
  Pencil,
  Save,
  FileText,
  AlertCircle,
  Tag,
  LoaderCircle,
} from "lucide-react"

import type {
  Ticket,
  TicketPriority,
  TicketCategory,
  NewTicketData,
} from "@/types/ticket"

type EditTicketFormProps = {
  ticket: Ticket
  onClose: () => void
  onSave: (
    ticketId: string,
    data: NewTicketData
  ) => Promise<void> | void
}

export default function EditTicketForm({
  ticket,
  onClose,
  onSave,
}: EditTicketFormProps) {
  // Datos actuales
  const [title, setTitle] = useState(ticket.title)
  const [description, setDescription] = useState(
    ticket.description
  )

  const [priority, setPriority] =
    useState<TicketPriority>(ticket.priority)

  const [category, setCategory] =
    useState<TicketCategory>(ticket.category)

  // Estado del formulario
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showDiscardConfirm, setShowDiscardConfirm] =
    useState(false)

  // Referencias
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const discardButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Validaciones
  const isFormValid =
    title.trim().length > 0 &&
    description.trim().length > 0

  const hasChanges =
    title.trim() !== ticket.title ||
    description.trim() !== ticket.description ||
    priority !== ticket.priority ||
    category !== ticket.category

  // Bloquear scroll del fondo y guardar el foco anterior
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement

    document.body.style.overflow = "hidden"
    titleInputRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus()
      }
    }
  }, [])

  // Solicitar cierre
  function requestClose() {
    if (submitting) return

    if (hasChanges) {
      setShowDiscardConfirm(true)
      return
    }

    onClose()
  }

  // Cerrar con Escape y mantener el foco dentro del diálogo
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()

        if (showDiscardConfirm) {
          setShowDiscardConfirm(false)
        } else {
          requestClose()
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
      ).filter(
        (element) =>
          element.getClientRects().length > 0
      )

      if (focusable.length === 0) return

      // Mientras se confirma el descarte,
      // el foco permanece en sus botones.
      const activeFocusable = showDiscardConfirm
        ? focusable.filter((element) =>
            element.closest("[data-discard-confirm]")
          )
        : focusable

      if (activeFocusable.length === 0) return

      const first = activeFocusable[0]
      const last =
        activeFocusable[activeFocusable.length - 1]

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

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  })

  // Enfocar la confirmación cuando se abre
  useEffect(() => {
    if (showDiscardConfirm) {
      discardButtonRef.current?.focus()
    } else {
      closeButtonRef.current?.focus()
    }
  }, [showDiscardConfirm])

  // Guardar cambios
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (submitting || !isFormValid || !hasChanges) {
      return
    }

    setSubmitting(true)
    setError("")

    try {
      await onSave(ticket.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
      })

      // TicketsPage cierra el formulario
      // únicamente después de guardar correctamente.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-ticket-title"
        aria-describedby="edit-ticket-description"
        className="flex max-h-[95dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 sm:max-h-[90dvh] sm:max-w-xl sm:rounded-2xl"
      >
        {/* ENCABEZADO */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
              <Pencil className="h-5 w-5 text-purple-400" />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                Gestión de tickets
              </p>

              <h2
                id="edit-ticket-title"
                className="text-lg font-bold text-white sm:text-xl"
              >
                Editar ticket
              </h2>

              <p
                id="edit-ticket-description"
                className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm"
              >
                Modifica la información de la solicitud.
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            disabled={submitting}
            aria-label="Cerrar formulario"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* CONTENIDO CON SCROLL */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* IDENTIFICADOR */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
              <span className="text-xs text-zinc-500">
                Ticket
              </span>

              <span className="font-mono text-xs text-purple-400">
                #{ticket.id.slice(0, 8)}
              </span>
            </div>

            {/* ASUNTO */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="edit-ticket-subject"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-300"
                >
                  <FileText className="h-4 w-4 text-purple-400" />
                  Asunto
                  <span className="text-purple-400">*</span>
                </label>

                <span className="text-xs text-zinc-500">
                  {title.length}/120
                </span>
              </div>

              <input
                ref={titleInputRef}
                id="edit-ticket-subject"
                type="text"
                value={title}
                disabled={submitting}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setError("")
                }}
                maxLength={120}
                required
                placeholder="Escribe el asunto del ticket"
                className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500 disabled:opacity-60 sm:text-sm"
              />
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label
                htmlFor="edit-ticket-description-field"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
              >
                <FileText className="h-4 w-4 text-purple-400" />
                Descripción
                <span className="text-purple-400">*</span>
              </label>

              <textarea
                id="edit-ticket-description-field"
                value={description}
                disabled={submitting}
                onChange={(event) => {
                  setDescription(event.target.value)
                  setError("")
                }}
                rows={5}
                maxLength={2000}
                required
                placeholder="Describe el problema..."
                className="min-h-32 w-full min-w-0 resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base leading-relaxed text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500 disabled:opacity-60 sm:text-sm"
              />

              <p className="mt-1 text-right text-xs text-zinc-500">
                {description.length}/2000
              </p>
            </div>

            {/* PRIORIDAD Y CATEGORÍA */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="edit-ticket-priority"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
                >
                  <AlertCircle className="h-4 w-4 text-purple-400" />
                  Prioridad
                </label>

                <select
                  id="edit-ticket-priority"
                  value={priority}
                  disabled={submitting}
                  onChange={(event) =>
                    setPriority(
                      event.target.value as TicketPriority
                    )
                  }
                  className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-purple-500 disabled:opacity-60 sm:text-sm"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="edit-ticket-category"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
                >
                  <Tag className="h-4 w-4 text-purple-400" />
                  Categoría
                </label>

                <select
                  id="edit-ticket-category"
                  value={category}
                  disabled={submitting}
                  onChange={(event) =>
                    setCategory(
                      event.target.value as TicketCategory
                    )
                  }
                  className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-purple-500 disabled:opacity-60 sm:text-sm"
                >
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Redes">Redes</option>
                  <option value="Accesos">Accesos</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* AVISO */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 sm:p-4">
              <p className="text-xs leading-relaxed text-zinc-400">
                Los cambios actualizarán la información
                de este ticket. Su identificador, estado
                y fecha de creación permanecerán iguales.
              </p>
            </div>
          </div>

          {/* BOTONES INFERIORES */}
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              className="min-h-11 w-full rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !isFormValid ||
                !hasChanges
              }
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>

        {/* CONFIRMAR DESCARTE */}
        {showDiscardConfirm && (
          <div
            data-discard-confirm
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            aria-describedby="discard-description"
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
              <h3
                id="discard-title"
                className="text-base font-semibold text-white"
              >
                ¿Descartar cambios?
              </h3>

              <p
                id="discard-description"
                className="mt-2 text-sm leading-relaxed text-zinc-400"
              >
                Modificaste este ticket, pero todavía
                no guardaste los cambios.
              </p>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowDiscardConfirm(false)
                  }
                  className="min-h-11 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Seguir editando
                </button>

                <button
                  ref={discardButtonRef}
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Descartar cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
