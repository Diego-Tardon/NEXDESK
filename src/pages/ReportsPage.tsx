
import { useEffect, useMemo, useState } from "react"

import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  LoaderCircle,
  RefreshCw,
  Ticket as TicketIcon,
  CalendarDays,
  AlertCircle,
  TrendingUp,
} from "lucide-react"

import StatCard from "@/components/dashboard/StatCard"

import { getTickets } from "@/services/ticketService"
import { getTicketStats } from "@/services/ticketStorage"
import { getMyProfile } from "@/services/profileService"

import { useAppSettings } from "@/hooks/useAppSettings"

import {
  formatAppDate,
  type DateFormat,
} from "@/services/settingsService"

import type {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket"

// Estados disponibles
const statuses: TicketStatus[] = [
  "Pendiente",
  "En progreso",
  "Resuelto",
]

// Prioridades disponibles
const priorities: TicketPriority[] = [
  "Baja",
  "Media",
  "Alta",
  "Crítica",
]

// Categorías disponibles
const categories: TicketCategory[] = [
  "Software",
  "Hardware",
  "Redes",
  "Accesos",
  "Otro",
]

type DateFilter = "all" | "7" | "30" | "90"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "No se pudieron cargar los reportes"
}

// Contar tickets por estado, prioridad o categoría
function countBy(
  tickets: Ticket[],
  key: "status" | "priority" | "category",
  values: string[]
) {
  return values.map((name) => ({
    name,
    count: tickets.filter(
      (ticket) => ticket[key] === name
    ).length,
  }))
}

// Exportar tickets a CSV
function downloadCsv(
  tickets: Ticket[],
  dateFormat: DateFormat
) {
  const columns = [
    "ID",
    "Asunto",
    "Descripción",
    "Prioridad",
    "Categoría",
    "Estado",
    "Fecha de creación",
    "Técnico asignado (ID)",
  ]

  const rows = tickets.map((ticket) => [
    ticket.id,
    ticket.title,
    ticket.description,
    ticket.priority,
    ticket.category,
    ticket.status,
    formatAppDate(ticket.createdAt, dateFormat),
    ticket.assignedTo ?? "",
  ])

  // Proteger valores que Excel podría interpretar como fórmulas
  const escapeCsv = (value: string): string => {
    const safe = /^[\s]*[=+@-]/.test(value)
      ? `'${value}`
      : value

    return `"${safe.replace(/"/g, '""')}"`
  }

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n")

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = `nexdesk-reportes-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

// Tarjeta de distribución
interface DistributionCardProps {
  title: string
  data: {
    name: string
    count: number
  }[]
  total: number
  compactMode: boolean
}

function DistributionCard({
  title,
  data,
  total,
  compactMode,
}: DistributionCardProps) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 ${
        compactMode
          ? "p-3 sm:p-4"
          : "p-4 sm:p-6"
      }`}
    >
      {/* ENCABEZADO */}
      <div
        className={`flex min-w-0 items-center gap-2 ${
          compactMode ? "mb-4" : "mb-5 sm:mb-6"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
          <BarChart3 className="h-4 w-4 text-purple-400" />
        </div>

        <h2 className="min-w-0 break-words text-sm font-semibold text-white sm:text-base">
          {title}
        </h2>
      </div>

      {/* BARRAS */}
      <div
        className={
          compactMode
            ? "space-y-3"
            : "space-y-4 sm:space-y-5"
        }
      >
        {data.map(({ name, count }) => {
          const percent = total
            ? Math.round((count / total) * 100)
            : 0

          return (
            <div key={name} className="min-w-0">
              <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs sm:text-sm">
                <span className="min-w-0 break-words text-zinc-300">
                  {name}
                </span>

                <span className="shrink-0 font-medium text-zinc-400 tabular-nums">
                  {count}{" "}
                  <span className="text-zinc-600">
                    ({percent}%)
                  </span>
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                  }}
                  role="progressbar"
                  aria-label={`${name}: ${count} tickets`}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )
        })}
      </div>

      {total === 0 && (
        <p className="mt-5 text-xs leading-relaxed text-zinc-500">
          No hay tickets en el período seleccionado.
        </p>
      )}
    </section>
  )
}

// Página principal de reportes
export default function ReportsPage() {
  // Preferencias
  const settings = useAppSettings()

  const compactMode = settings.compactMode
  const dateFormat = settings.dateFormat

  // Datos
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [period, setPeriod] =
    useState<DateFilter>("all")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  // Consultar permisos antes de cargar reportes
  useEffect(() => {
    let active = true

    async function loadReports() {
      try {
        const profile = await getMyProfile()

        if (!active) return

        if (
          profile.role !== "admin" &&
          profile.role !== "technician"
        ) {
          throw new Error(
            "No tienes permisos para acceder a los reportes"
          )
        }

        const data = await getTickets()

        if (active) {
          setTickets(data)
          setError("")
        }
      } catch (err) {
        if (active) {
          setTickets([])
          setError(getErrorMessage(err))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadReports()

    return () => {
      active = false
    }
  }, [refreshKey])

  function handleRefresh() {
    setLoading(true)
    setRefreshKey((previous) => previous + 1)
  }

  // Filtrar tickets por fecha
  const filteredTickets = useMemo(() => {
    if (period === "all") {
      return tickets
    }

    const cutoff =
      Date.now() -
      Number(period) * 24 * 60 * 60 * 1000

    return tickets.filter((ticket) => {
      const timestamp = new Date(
        ticket.createdAt
      ).getTime()

      return (
        Number.isFinite(timestamp) &&
        timestamp >= cutoff
      )
    })
  }, [tickets, period])

  // Estadísticas
  const stats = useMemo(
    () => getTicketStats(filteredTickets),
    [filteredTickets]
  )

  const statusData = useMemo(
    () => countBy(filteredTickets, "status", statuses),
    [filteredTickets]
  )

  const priorityData = useMemo(
    () => countBy(filteredTickets, "priority", priorities),
    [filteredTickets]
  )

  const categoryData = useMemo(
    () => countBy(filteredTickets, "category", categories),
    [filteredTickets]
  )

  // Espaciados adaptables
  const pagePadding = compactMode
    ? "p-3 sm:p-4 lg:p-5"
    : "p-4 sm:p-6 lg:p-8"

  const sectionSpacing = compactMode
    ? "mt-4"
    : "mt-6 sm:mt-8"

  const gridGap = compactMode
    ? "gap-3"
    : "gap-3 sm:gap-4 xl:gap-5"

  return (
    <main
      className={`min-w-0 flex-1 overflow-x-hidden ${pagePadding}`}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        {/* ENCABEZADO */}
        <header>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 shrink-0 text-purple-400" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400 sm:text-xs">
              NEXDESK / Reportes
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Reportes y estadísticas
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Analiza las solicitudes de soporte TI y su
                estado actual.
              </p>
            </div>

            {/* CONTROLES RESPONSIVE */}
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              {/* PERÍODO */}
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <label
                  htmlFor="report-period"
                  className="sr-only"
                >
                  Período
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                  <select
                    id="report-period"
                    value={period}
                    onChange={(event) =>
                      setPeriod(
                        event.target.value as DateFilter
                      )
                    }
                    className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none focus:border-purple-500 sm:w-auto"
                  >
                    <option value="all">
                      Todo el período
                    </option>

                    <option value="7">
                      Últimos 7 días
                    </option>

                    <option value="30">
                      Últimos 30 días
                    </option>

                    <option value="90">
                      Últimos 90 días
                    </option>
                  </select>
                </div>
              </div>

              {/* ACTUALIZAR */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-400 disabled:opacity-50 sm:text-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 shrink-0 ${
                    loading ? "animate-spin" : ""
                  }`}
                />

                Actualizar
              </button>

              {/* EXPORTAR */}
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    filteredTickets,
                    dateFormat
                  )
                }
                disabled={
                  loading ||
                  !!error ||
                  !filteredTickets.length
                }
                className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                <Download className="h-4 w-4 shrink-0" />

                Exportar CSV
              </button>
            </div>
          </div>
        </header>

        {/* CARGANDO */}
        {loading && (
          <div
            role="status"
            className="mt-6 flex items-center gap-3 text-sm text-purple-400"
          >
            <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />

            Cargando reportes desde Supabase...
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />

            <span className="min-w-0 break-words">
              {error}
            </span>
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {!loading && !error && (
          <>
            <section
              aria-label="Estadísticas de tickets"
              className={`${sectionSpacing} grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 ${gridGap}`}
            >
              <StatCard
                title="Total de tickets"
                value={stats.total}
                description="Tickets creados en el período"
                icon={TicketIcon}
              />

              <StatCard
                title="Pendientes"
                value={stats.pending}
                description="Solicitudes esperando atención"
                icon={Clock3}
              />

              <StatCard
                title="En progreso"
                value={stats.inProgress}
                description="Solicitudes en atención"
                icon={LoaderCircle}
              />

              <StatCard
                title="Resueltos"
                value={stats.resolved}
                description="Solicitudes solucionadas"
                icon={CheckCircle2}
              />
            </section>

            {/* GRÁFICOS */}
            <div
              className={`${
                compactMode ? "mt-4" : "mt-5 sm:mt-6"
              } grid min-w-0 grid-cols-1 xl:grid-cols-2 ${gridGap}`}
            >
              <DistributionCard
                title="Tickets por estado"
                data={statusData}
                total={stats.total}
                compactMode={compactMode}
              />

              <DistributionCard
                title="Tickets por prioridad"
                data={priorityData}
                total={stats.total}
                compactMode={compactMode}
              />

              <DistributionCard
                title="Tickets por categoría"
                data={categoryData}
                total={stats.total}
                compactMode={compactMode}
              />

              {/* TASA DE RESOLUCIÓN */}
              <section
                className={`flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 ${
                  compactMode
                    ? "p-3 sm:p-4"
                    : "p-4 sm:p-6"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>

                    <h2 className="text-sm font-semibold text-white sm:text-base">
                      Tasa de resolución
                    </h2>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    Porcentaje de tickets actualmente
                    resueltos dentro del período
                    seleccionado.
                  </p>
                </div>

                <div
                  className={
                    compactMode
                      ? "my-5 text-center"
                      : "my-6 text-center sm:my-8"
                  }
                >
                  <p className="break-words text-4xl font-bold text-purple-400 tabular-nums sm:text-5xl">
                    {stats.resolutionRate}%
                  </p>

                  <p className="mt-2 text-xs text-zinc-500 sm:text-sm">
                    {stats.resolved} de {stats.total} tickets
                  </p>

                  {/* BARRA DE PROGRESO */}
                  <div className="mx-auto mt-5 h-2.5 max-w-sm overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-300"
                      style={{
                        width: `${stats.resolutionRate}%`,
                      }}
                      role="progressbar"
                      aria-label="Tasa de resolución"
                      aria-valuenow={stats.resolutionRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-zinc-500">
                  Los resultados corresponden a los
                  tickets que tu cuenta tiene permiso
                  para consultar.
                </p>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
