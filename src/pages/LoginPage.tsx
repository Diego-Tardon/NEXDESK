
import { useState } from "react"
import type { FormEvent } from "react"

import { Link, useNavigate } from "react-router-dom"

import {
  Headset,
  Mail,
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react"

import { loginUser } from "../services/authService"

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (loading) return

    setError("")
    setLoading(true)

    try {
      // Autenticación mediante Supabase
      const data = await loginUser(
        email.trim(),
        password
      )

      // Redirigir solo cuando existe una sesión
      if (data.session) {
        navigate("/", { replace: true })
      } else {
        setError(
          "No se pudo establecer la sesión. Verifica tu correo."
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión. Inténtalo nuevamente."
      )
    } finally {
      setLoading(false)
    }
  }

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

        {/* TARJETA DE LOGIN */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#12121c] p-5 shadow-2xl shadow-black/20 sm:rounded-3xl sm:p-8">
          {/* ENCABEZADO */}
          <header className="mb-7 text-center sm:mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-600/10 sm:h-16 sm:w-16">
              <Headset className="h-7 w-7 text-purple-400 sm:h-8 sm:w-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              Bienvenido a NEXDESK
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Inicia sesión para gestionar tus tickets
              de soporte TI.
            </p>
          </header>

          {/* FORMULARIO */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* CORREO */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Correo electrónico
              </label>

              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-purple-500">
                <Mail className="h-[18px] w-[18px] shrink-0 text-zinc-500" />

                <input
                  id="login-email"
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
                  }}
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 disabled:opacity-50 sm:text-sm"
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Contraseña
              </label>

              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-purple-500">
                <LockKeyhole className="h-[18px] w-[18px] shrink-0 text-zinc-500" />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError("")
                  }}
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 disabled:opacity-50 sm:text-sm"
                />

                {/* MOSTRAR / OCULTAR CONTRASEÑA */}
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
            </div>

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="flex min-w-0 items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span className="min-w-0 break-words">
                  {error}
                </span>
              </div>
            )}

            {/* BOTÓN DE LOGIN */}
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="h-[18px] w-[18px]" />
                </>
              )}
            </button>
          </form>

          {/* REGISTRO */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-center text-sm leading-relaxed text-zinc-400">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-semibold text-purple-400 transition-colors hover:text-purple-300"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </section>

        {/* PIE DE PÁGINA */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-purple-400" />

          <span>
            Acceso protegido mediante Supabase Auth
          </span>
        </div>
      </div>
    </main>
  )
}
