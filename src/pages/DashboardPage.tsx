
import { useEffect, useState } from "react"

import {
  Ticket,
  Clock3,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react"

import StatCard from "@/components/dashboard/StatCard"
import RecentTickets from "@/components/dashboard/RecentTickets"

import { getTickets } from "@/services/ticketService"
import { getTicketStats } from "@/services/ticketStorage"

import { useAppSettings } from "@/hooks/useAppSettings"

import {
  getMyProfile,
  type UserRole,
} from "@/services/profileService"

import type { Ticket as TicketType } from "@/types/ticket"

// Contenido personalizado por rol
const dashboardContent: Record<
  UserRole,
  {
    title: string
    description: string
    totalDescription: string
    pendingDescription: string
    progressDescription: string
    resolvedDescription: string
  }
> = {
  admin: {
    title: "Panel de administración",
    description:
      "Supervisa las solicitudes y el trabajo del equipo de soporte TI.",
    totalDescription:
      "Tickets registrados en el sistema",
    pendingDescription:
      "Solicitudes esperando atención",
    progressDescription:
      "Solicitudes en atención",
    resolvedDescription:
      "Solicitudes solucionadas",
  },

  technician: {
    title: "Mi panel de soporte TI",
    description:
      "Consulta el estado de los tickets asignados a tu cuenta.",
    totalDescription:
      "Tickets visibles para ti",
    pendingDescription:
      "Solicitudes pendientes",
    progressDescription:
      "Solicitudes en las que trabajas",
    resolvedDescription:
      "Solicitudes resueltas",
  },

  user: {
    title: "Mis solicitudes",
    description:
      "Revisa y consulta el estado de tus solicitudes de soporte.",
    totalDescription:
      "Solicitudes registradas",
    pendingDescription:
      "Solicitudes esperando atención",
    progressDescription:
      "Solicitudes en atención",
    resolvedDescription:
      "Solicitudes solucionadas",
  },
}

// Manejo de errores
function getErrorMessage(error: unknown): string {
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

  return "No se pudieron cargar los datos del dashboard."
}

// Skeleton de carga
function StatCardSkeleton() {
  return (
    <div className="min-w-0 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-3 w-28 max-w-full rounded bg-zinc-800" />
          <div className="mt-5 h-9 w-16 rounded bg-zinc-800" />
          <div className="mt-4 h-3 w-36 max-w-full rounded bg-zinc-800" />
        </div>

        <div className="h-11 w-11 shrink-0 rounded-xl bg-zinc-800" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // Preferencias globales
  const settings = useAppSettings()
  const compactMode = settings.compactMode

  // Datos
  const [tickets, setTickets] =
    useState<TicketType[]>([])

  const [role, setRole] =
    useState<UserRole>("user")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Cargar información desde Supabase
  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setError("")

      try {
        const [ticketData, profile] =
          await Promise.all([
            getTickets(),
            getMyProfile(),
          ])

        if (!active) return

        setTickets(ticketData)
        setRole(profile.role)
      } catch (err) {
        if (!active) return

        setError(getErrorMessage(err))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  // Estadísticas
  const stats = getTicketStats(tickets)

  // Textos según el rol
  const content = dashboardContent[role]

  // Diseño adaptable
  const pagePadding = compactMode
    ? "px-3 py-4 sm:px-4 sm:py-5 lg:px-5"
    : "px-4 py-5 sm:px-6 sm:py-7 lg:px-8"

  const sectionSpacing = compactMode
    ? "mt-5"
    : "mt-7 sm:mt-8"

  const gridGap = compactMode
    ? "gap-3"
    : "gap-3 sm:gap-4 xl:gap-5"

  return (
    <main
      className={`min-w-0 flex-1 overflow-x-hidden ${pagePadding}`}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        {/* ENCABEZADO */}
        <header className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 shrink-0 text-purple-400" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400 sm:text-xs">
              NEXDESK / Dashboard
            </p>
          </div>

          <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[32px]">
            {loading
              ? "Dashboard"
              : content.title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {loading
              ? "Preparando tu espacio de trabajo..."
              : content.description}
          </p>
        </header>

        {/* CARGANDO */}
        {loading && (
          <div role="status" aria-live="polite">
            <div className="mt-6 flex items-center gap-2 text-sm text-purple-400">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Cargando estadísticas...
            </div>

            <section
              aria-label="Cargando estadísticas"
              className={`grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 ${sectionSpacing} ${gridGap}`}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))}
            </section>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-400">
                No se pudo cargar el dashboard
              </p>

              <p className="mt-1 break-words text-sm leading-relaxed text-red-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {!loading && !error && (
          <>
            {/* ESTADÍSTICAS */}
            <section
              aria-label="Resumen de tickets"
              className={`grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 ${sectionSpacing} ${gridGap}`}
            >
              <StatCard
                title={
                  role === "technician"
                    ? "Mis tickets"
                    : role === "user"
                      ? "Mis solicitudes"
                      : "Total de tickets"
                }
                value={stats.total}
                description={content.totalDescription}
                icon={Ticket}
              />

              <StatCard
                title="Pendientes"
                value={stats.pending}
                description={content.pendingDescription}
                icon={Clock3}
              />

              <StatCard
                title="En progreso"
                value={stats.inProgress}
                description={content.progressDescription}
                icon={LoaderCircle}
              />

              <StatCard
                title="Resueltos"
                value={stats.resolved}
                description={content.resolvedDescription}
                icon={CheckCircle2}
              />
            </section>

            {/* TICKETS RECIENTES */}
            <div
              className={`min-w-0 ${
                compactMode
                  ? "[&>section]:!mt-4"
                  : ""
              }`}
            >
              <RecentTickets tickets={tickets} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}
