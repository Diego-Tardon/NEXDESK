
import { useEffect, useRef } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"

import type { Ticket } from "@/types/ticket"

type DeleteTicketDialogProps = {
  ticket: Ticket
  onClose: () => void
  onConfirm: (ticketId: string) => void
}

export default function DeleteTicketDialog({
  ticket,
  onClose,
  onConfirm,
}: DeleteTicketDialogProps) {
  // Referencia al botón Cancelar
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Permitir cerrar con Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    // Enfocar Cancelar para evitar borrados accidentales
    cancelButtonRef.current?.focus()

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  // Confirmar eliminación
  function handleConfirm() {
    onConfirm(ticket.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-ticket-title"
        aria-describedby="delete-ticket-description"
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        {/* ENCABEZADO */}
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar confirmación"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="space-y-4 p-6">
          <div>
            <h2
              id="delete-ticket-title"
              className="text-xl font-bold text-white"
            >
              ¿Eliminar este ticket?
            </h2>

            <p
              id="delete-ticket-description"
              className="mt-2 text-sm leading-6 text-zinc-400"
            >
              Estás a punto de eliminar una solicitud de
              soporte técnico. Esta acción no se puede
              deshacer desde NEXDESK.
            </p>
          </div>

          {/* TICKET SELECCIONADO */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ticket seleccionado
            </p>

            <p className="break-words text-sm font-semibold text-white">
              {ticket.title}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              Categoría: {ticket.category}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Estado: {ticket.status}
            </p>
          </div>

          {/* ADVERTENCIA */}
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <p className="text-xs leading-5 text-red-300">
              El ticket será eliminado de la lista y del
              almacenamiento local de este navegador.
            </p>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 p-6 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Sí, eliminar ticket
          </button>
        </div>
      </div>
    </div>
  )
}
