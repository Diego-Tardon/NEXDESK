
import { useState } from "react"
import type { FormEvent } from "react"

import { Link } from "react-router-dom"

import {
  Headset,
  Mail,
  LockKeyhole,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"

import { registerUser } from "../services/authService"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (loading) return

    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      )
      return
    }

    setLoading(true)

    try {
      const data = await registerUser(
        email.trim(),
        password
      )

      if (data.session) {
        setSuccess(
          "Cuenta creada correctamente. Ya puedes iniciar sesión."
        )
      } else {
        setSuccess(
          "Solicitud de registro recibida. Si se requiere confirmación, revisa tu correo electrónico."
        )
      }

      // Limpiar contraseñas tras el registro
      setPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la cuenta."
      )
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword

  const passwordIsValid = password.length >= 8

  return (
    <main className="relative flex min-h-screen min-h-dvh w-full min-w-0 items-center justify-center overflow-x-hidden bg-[#09090f] px-4 py-8 sm:px-6 sm:py-12">
      {/* DECORACIÓN DE FONDO */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl sm:h-[450px] sm:w-[450px]" />

        <div className="absolute -bottom-48 -right-40 h-80 w-80 rounded-full bg-purple-900/10 blur-3xl" />
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 w-full max-w-[440px] min-w-0">
        {/* MARCA */}
        <div className="mb-6 flex items-center justify-center gap-2 sm:mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600">
            <Headset className="h-5 w-5 text-white" />
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            NEX<span className="text-purple-400">DESK</span>
          </span>
        </div>

        {/* TARJETA DE REGISTRO */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#12121c] p-5 shadow-2xl shadow-black/20 sm:rounded-3xl sm:p-8">
          {/* ENCABEZADO */}
          <header className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-600/10 sm:h-16 sm:w-16">
              <UserPlus className="h-7 w-7 text-purple-400 sm:h-8 sm:w-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              Crear cuenta
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Regístrate para utilizar NEXDESK y gestionar
              tus solicitudes de soporte TI.
            </p>
          </header>

          {/* FORMULARIO */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* CORREO ELECTRÓNICO */}
            <div>
              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Correo electrónico
              </label>

              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-purple-500">
                <Mail className="h-[18px] w-[18px] shrink-0 text-zinc-500" />

                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError("")
                    setSuccess("")
                  }}
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 disabled:opacity-50 sm:text-sm"
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Contraseña
              </label>

              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-purple-500">
                <LockKeyhole className="h-[18px] w-[18px] shrink-0 text-zinc-500" />

                <input
                  id="register-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError("")
                    setSuccess("")
                  }}
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 disabled:opacity-50 sm:text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-purple-400 focus-visible:outline-2 focus-visible:outline-purple-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>

              <p
                className={`mt-2 text-xs ${
                  password.length === 0
                    ? "text-zinc-500"
                    : passwordIsValid
                      ? "text-green-400"
                      : "text-amber-400"
                }`}
              >
                {passwordIsValid
                  ? "La contraseña cumple el mínimo de caracteres."
                  : "Utiliza al menos 8 caracteres."}
              </p>
            </div>

            {/* CONFIRMAR CONTRASEÑA */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Confirmar contraseña
              </label>

              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-purple-500">
                <LockKeyhole className="h-[18px] w-[18px] shrink-0 text-zinc-500" />

                <input
                  id="register-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError("")
                    setSuccess("")
                  }}
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 disabled:opacity-50 sm:text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar confirmación de contraseña"
                      : "Mostrar confirmación de contraseña"
                  }
                  aria-pressed={showConfirmPassword}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-purple-400 focus-visible:outline-2 focus-visible:outline-purple-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-2 text-xs ${
                    passwordsMatch
                      ? "text-green-400"
                      : "text-amber-400"
                  }`}
                >
                  {passwordsMatch
                    ? "Las contraseñas coinciden."
                    : "Las contraseñas no coinciden."}
                </p>
              )}
            </div>

            {/* MENSAJE DE ERROR */}
            {error && (
              <div
                role="alert"
                className="flex min-w-0 items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
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
                className="flex min-w-0 items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3.5 text-sm text-green-400"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <span className="min-w-0 break-words">
                  {success}
                </span>
              </div>
            )}

            {/* BOTÓN DE REGISTRO */}
            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
                  Creando cuenta...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-[18px] w-[18px]" />
                  Registro enviado
                </>
              ) : (
                <>
                  <UserPlus className="h-[18px] w-[18px]" />
                  Crear cuenta
                  <ArrowRight className="h-[18px] w-[18px]" />
                </>
              )}
            </button>
          </form>

          {/* ENLACE A LOGIN */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-center text-sm leading-relaxed text-zinc-400">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="font-semibold text-purple-400 transition-colors hover:text-purple-300"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </section>

        {/* PIE DE PÁGINA */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-purple-400" />

          <span>
            Registro protegido mediante Supabase Auth
          </span>
        </div>

        <p className="mt-3 text-center text-xs text-zinc-600">
          NEXDESK · Plataforma de soporte TI
        </p>
      </div>
    </main>
  )
}
