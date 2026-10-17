
import { useEffect, useState } from "react"
import type { FormEvent } from "react"

import {
  UserRound,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ArrowLeft,
  LockKeyhole,
} from "lucide-react"

import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"

import {
  getMyProfile,
  updateMyProfile,
  type UserRole,
} from "@/services/profileService"

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  technician: "Técnico TI",
  user: "Usuario",
}

export default function ProfilePage() {
  const [fullName, setFullName] = useState("")
  const [originalName, setOriginalName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("user")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Cargar perfil desde Supabase
  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const [profile, authResult] = await Promise.all([
          getMyProfile(),
          supabase.auth.getUser(),
        ])

        if (authResult.error) {
          throw authResult.error
        }

        if (!authResult.data.user) {
          throw new Error("No hay una sesión activa")
        }

        if (!active) return

        setFullName(profile.full_name)
        setOriginalName(profile.full_name)
        setRole(profile.role)
        setEmail(authResult.data.user.email ?? "")
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar tu perfil"
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [])

  // Guardar cambios
  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (saving) return

    const trimmedName = fullName.trim()

    if (trimmedName.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const updatedProfile = await updateMyProfile(
        trimmedName
      )

      setFullName(updatedProfile.full_name)
      setOriginalName(updatedProfile.full_name)

      setSuccess("Tu nombre se actualizó correctamente.")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar tu perfil"
      )
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    fullName.trim() !== originalName

  // Pantalla de carga
  if (loading) {
    return (
      <main className="flex min-h-[400px] min-w-0 flex-1 items-center justify-center bg-zinc-900 px-4">
        <div
          role="status"
          className="flex items-center gap-3 text-sm text-zinc-400"
        >
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-purple-400" />

          Cargando perfil...
        </div>
      </main>
    )
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden bg-zinc-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        {/* ENCABEZADO */}
        <header className="mb-6 sm:mb-8">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-purple-400" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400 sm:text-xs">
              NEXDESK / Mi perfil
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Mi perfil
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Consulta y actualiza tu información personal.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-400 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
          </div>
        </header>

        {/* TARJETA PRINCIPAL */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          {/* INFORMACIÓN DE CUENTA */}
          <div className="flex min-w-0 items-center gap-3 border-b border-zinc-800 p-4 sm:gap-4 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 sm:h-14 sm:w-14">
              <UserRound className="h-6 w-6 text-purple-400 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold text-white sm:text-lg">
                Información de la cuenta
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                Tus datos registrados en NEXDESK.
              </p>
            </div>
          </div>

          {/* FORMULARIO */}
          <form
            onSubmit={handleSave}
            className="space-y-5 p-4 sm:space-y-6 sm:p-6"
          >
            {/* MENSAJE DE ERROR */}
            {error && (
              <div
                role="alert"
                className="flex min-w-0 items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <span className="min-w-0 break-words">
                  {error}
                </span>
              </div>
            )}

            {/* MENSAJE DE ÉXITO */}
            {success && (
              <div
                role="status"
                className="flex min-w-0 items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <span className="min-w-0 break-words">
                  {success}
                </span>
              </div>
            )}

            {/* NOMBRE COMPLETO */}
            <div className="min-w-0">
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Nombre completo
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  maxLength={100}
                  minLength={2}
                  required
                  disabled={saving}
                  onChange={(event) => {
                    setFullName(event.target.value)
                    setSuccess("")
                  }}
                  placeholder="Ingresa tu nombre completo"
                  className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Este nombre aparecerá en tu cuenta y en
                las asignaciones de tickets.
              </p>
            </div>

            {/* CORREO ELECTRÓNICO */}
            <div className="min-w-0">
              <label
                htmlFor="profile-email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Correo electrónico
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  className="min-h-11 w-full min-w-0 cursor-not-allowed rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-zinc-500 outline-none"
                />
              </div>

              <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
                <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                El correo electrónico no se puede modificar
                desde esta sección.
              </p>
            </div>

            {/* ROL DEL USUARIO */}
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-zinc-300">
                Rol de usuario
              </p>

              <div className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-purple-400" />

                <span className="min-w-0 break-words text-sm font-medium text-zinc-300">
                  {roleLabels[role]}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Por seguridad, no puedes modificar tu propio
                rol desde esta página.
              </p>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="border-t border-zinc-800 pt-5 sm:pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-zinc-500">
                  {hasChanges
                    ? "Tienes cambios pendientes por guardar."
                    : "Tu información está actualizada."}
                </p>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !hasChanges ||
                    fullName.trim().length < 2
                  }
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
          </form>
        </section>

        {/* INFORMACIÓN DE SEGURIDAD */}
        <section className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:mt-6 sm:p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">
              Seguridad de tu cuenta
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
              Tu información se administra mediante Supabase.
              Los permisos y el acceso a los datos dependen
              de las políticas de seguridad configuradas
              en NEXDESK.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
