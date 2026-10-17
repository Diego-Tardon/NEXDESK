
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import {
  Settings,
  UserRound,
  Bell,
  CalendarDays,
  LayoutDashboard,
  ShieldCheck,
  Save,
  RotateCcw,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

import {
  getMyProfile,
  type UserProfile,
  type UserRole,
} from "@/services/profileService"

import {
  getSettings,
  saveSettings,
  resetSettings,
  formatAppDate,
  defaultSettings,
  type AppSettings,
  type DateFormat,
} from "@/services/settingsService"

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  technician: "Técnico TI",
  user: "Usuario",
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(
    null
  )

  const [settings, setSettings] = useState<AppSettings>({
    ...defaultSettings,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Cargar perfil y preferencias
  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const userProfile = await getMyProfile()

        if (!active) return

        setProfile(userProfile)
        setSettings(getSettings(userProfile.id))
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la configuración"
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      active = false
    }
  }, [])

  // Modificar preferencia local
  function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }))

    setMessage("")
    setError("")
  }

  // Guardar preferencias
  function handleSave() {
    if (!profile || saving) return

    setSaving(true)
    setMessage("")
    setError("")

    try {
      saveSettings(profile.id, settings)

      setMessage("Preferencias guardadas correctamente.")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar las preferencias"
      )
    } finally {
      setSaving(false)
    }
  }

  // Restablecer preferencias
  function handleReset() {
    if (!profile || saving) return

    setError("")
    setMessage("")

    try {
      resetSettings(profile.id)
      setSettings({ ...defaultSettings })

      setMessage(
        "Se restauraron las preferencias predeterminadas."
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo restaurar la configuración"
      )
    }
  }

  // Cargando
  if (loading) {
    return (
      <main className="flex min-h-[400px] min-w-0 flex-1 items-center justify-center px-4">
        <div
          role="status"
          className="flex items-center gap-3 text-sm text-purple-400"
        >
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
          Cargando configuración...
        </div>
      </main>
    )
  }

  // Error al cargar el perfil
  if (!profile) {
    return (
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400"
        >
          {error || "No se pudo cargar tu perfil"}
        </div>
      </main>
    )
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        {/* ENCABEZADO */}
        <header className="mb-6 sm:mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-purple-400" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400 sm:text-xs">
              NEXDESK / Configuración
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 sm:h-12 sm:w-12">
              <Settings className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Configuración
              </h1>

              <p className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Personaliza tus preferencias de NEXDESK.
              </p>
            </div>
          </div>
        </header>

        {/* MENSAJES */}
        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400 sm:mb-6"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="min-w-0 break-words">
              {message}
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 sm:mb-6"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="min-w-0 break-words">
              {error}
            </span>
          </div>
        )}

        {/* LAYOUT RESPONSIVE */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
          {/* COLUMNA PRINCIPAL */}
          <div className="min-w-0 space-y-4 sm:space-y-6 xl:col-span-2">
            {/* PREFERENCIAS GENERALES */}
            <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <CalendarDays className="h-5 w-5 text-purple-400" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white sm:text-lg">
                    Preferencias generales
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                    Personaliza los formatos de visualización.
                  </p>
                </div>
              </div>

              <label
                htmlFor="date-format"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Formato de fecha
              </label>

              <select
                id="date-format"
                value={settings.dateFormat}
                onChange={(event) =>
                  updateSetting(
                    "dateFormat",
                    event.target.value as DateFormat
                  )
                }
                className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none transition-colors focus:border-purple-500 sm:px-4"
              >
                <option value="CL">
                  Chile (DD-MM-AAAA)
                </option>

                <option value="ISO">
                  Internacional (AAAA-MM-DD)
                </option>

                <option value="US">
                  Estados Unidos (MM/DD/AAAA)
                </option>
              </select>

              {/* VISTA PREVIA */}
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs text-zinc-500">
                  Vista previa
                </p>

                <p className="mt-1 text-sm font-semibold text-purple-400">
                  {formatAppDate(
                    new Date(2026, 9, 17),
                    settings.dateFormat
                  )}
                </p>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                El formato seleccionado se guardará como
                preferencia y podrá utilizarse en las páginas
                que integran el formateador compartido.
              </p>
            </section>

            {/* APARIENCIA */}
            <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <LayoutDashboard className="h-5 w-5 text-purple-400" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white sm:text-lg">
                    Apariencia
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                    Preferencias visuales de la interfaz.
                  </p>
                </div>
              </div>

              {/* TEMA */}
              <div>
                <p className="text-sm font-medium text-zinc-300">
                  Tema actual
                </p>

                <div className="mt-3 flex min-w-0 items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 sm:p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950">
                    <div className="h-4 w-4 rounded-full bg-purple-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-white">
                      Oscuro NEXDESK
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Negro, zinc y morado
                    </p>
                  </div>

                  <CheckCircle2 className="h-5 w-5 shrink-0 text-purple-400" />
                </div>
              </div>

              {/* VISTA COMPACTA */}
              <div className="mt-5 flex min-w-0 items-center justify-between gap-3 border-t border-zinc-800 pt-5 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    Vista compacta
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Reduce los espacios en las secciones
                    compatibles de la aplicación.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.compactMode}
                  aria-label="Vista compacta"
                  onClick={() =>
                    updateSetting(
                      "compactMode",
                      !settings.compactMode
                    )
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 ${
                    settings.compactMode
                      ? "bg-purple-600"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      settings.compactMode
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                La vista compacta se aplica a los módulos
                que utilizan esta preferencia.
              </p>
            </section>

            {/* NOTIFICACIONES */}
            <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <Bell className="h-5 w-5 text-purple-400" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white sm:text-lg">
                    Notificaciones
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                    Preferencias para futuros avisos.
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    Avisos del sistema
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Guarda si deseas recibir avisos sobre
                    la actividad de tus tickets.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    settings.notificationsEnabled
                  }
                  aria-label="Avisos del sistema"
                  onClick={() =>
                    updateSetting(
                      "notificationsEnabled",
                      !settings.notificationsEnabled
                    )
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 ${
                    settings.notificationsEnabled
                      ? "bg-purple-600"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      settings.notificationsEnabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                Esta opción guarda tu preferencia, pero
                todavía no envía notificaciones ni controla
                la campana del encabezado.
              </p>
            </section>

            {/* ACCIONES */}
            <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-50 sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Restablecer
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50 sm:w-auto"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </div>

          {/* COLUMNA DE CUENTA */}
          <aside className="min-w-0 space-y-4 sm:space-y-6">
            {/* MI CUENTA */}
            <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <UserRound className="h-5 w-5 text-purple-400" />
                </div>

                <h2 className="text-base font-semibold text-white sm:text-lg">
                  Mi cuenta
                </h2>
              </div>

              <div className="mb-5 flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600/20">
                  <UserRound className="h-6 w-6 text-purple-400" />
                </div>

                <div className="min-w-0">
                  <p className="break-words font-semibold text-white">
                    {profile.full_name || "Usuario"}
                  </p>

                  <p className="mt-1 text-xs text-purple-400">
                    {roleLabels[profile.role]}
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-5">
                <div>
                  <p className="text-xs text-zinc-500">
                    Rol de la cuenta
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {roleLabels[profile.role]}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Fecha de registro
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {formatAppDate(
                      profile.created_at,
                      settings.dateFormat
                    )}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="mt-6 flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl border border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-400"
              >
                <span className="min-w-0">
                  Administrar mi perfil
                </span>

                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            </section>

            {/* SEGURIDAD */}
            <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                </div>

                <h2 className="text-base font-semibold text-white sm:text-lg">
                  Seguridad
                </h2>
              </div>

              <p className="text-sm leading-relaxed text-zinc-400">
                Los permisos de tu cuenta se administran
                mediante Supabase y las políticas RLS
                del sistema.
              </p>

              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">
                  Nivel de acceso
                </p>

                <p className="mt-1 text-sm font-medium text-purple-400">
                  {roleLabels[profile.role]}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
