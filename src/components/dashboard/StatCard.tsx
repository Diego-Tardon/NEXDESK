
import type { LucideIcon } from "lucide-react"

type StatCardProps = {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition-all duration-200 hover:border-purple-500/40 hover:bg-zinc-900/60 sm:p-5 lg:p-6">
      {/* DECORACIÓN */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-purple-500/5 blur-3xl transition-colors group-hover:bg-purple-500/10" />

      {/* ENCABEZADO */}
      <div className="relative flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 break-words pt-1 text-xs font-medium leading-relaxed text-zinc-400 sm:text-sm">
          {title}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/10 transition-colors group-hover:border-purple-500/20 group-hover:bg-purple-500/15 sm:h-11 sm:w-11">
          <Icon className="h-5 w-5 text-purple-400" />
        </div>
      </div>

      {/* ESTADÍSTICA */}
      <div className="relative mt-4 min-w-0">
        <p className="break-words text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
          {value}
        </p>

        <p className="mt-2 break-words text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  )
}
