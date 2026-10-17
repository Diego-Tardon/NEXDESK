
import { useEffect, useRef, useState } from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import {
  Bell,
  BellOff,
  Search,
  UserRound,
  LogOut,
  LoaderCircle,
  ChevronDown,
  Settings,
  Ticket,
  X,
  Menu,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { logoutUser } from "@/services/authService"
import { getTickets } from "@/services/ticketService"

import { useAppSettings } from "@/hooks/useAppSettings"

import {
  getMyProfile,
  type UserProfile,
  type UserRole,
} from "@/services/profileService"

import type { Ticket as TicketType } from "@/types/ticket"

// Propiedad recibida desde App.tsx
interface HeaderProps {
  onMenuClick: () => void
}

// Nombres visibles de los roles
const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  technician: "Técnico TI",
  user: "Usuario",
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const settings = useAppSettings()

  const menuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Menús
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] =
    useState(false)

  // Buscador móvil
  const [mobileSearchOpen, setMobileSearchOpen] =
    useState(false)

  // Sesión
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")

  // Perfil
  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [email, setEmail] = useState("")
  const [loadingProfile, setLoadingProfile] =
    useState(true)

  const [profileError, setProfileError] = useState("")

  // Notificaciones
  const [pendingTickets, setPendingTickets] =
    useState<TicketType[]>([])

  const [notificationsLoading, setNotificationsLoading] =
    useState(false)

  const [notificationsError, setNotificationsError] =
    useState("")

  // Buscador
  const [searchTerm, setSearchTerm] = useState("")

  // Cargar perfil del usuario
  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoadingProfile(true)

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!user) {
          throw new Error("No hay una sesión activa")
        }

        const userProfile = await getMyProfile()

        if (!active) return

        setEmail(user.email ?? "")
        setProfile(userProfile)
        setProfileError("")
      } catch (error) {
        if (!active) return

        setProfile(null)

        setProfileError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el perfil"
        )
      } finally {
        if (active) {
          setLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [location.pathname])

  // Consultar tickets pendientes
  useEffect(() => {
    let active = true

    if (!settings.notificationsEnabled) {
      return () => {
        active = false
      }
    }

    async function loadNotifications() {
      setNotificationsLoading(true)
      setNotificationsError("")

      try {
        const tickets = await getTickets()

        if (!active) return

        const pending = tickets.filter(
          (ticket) => ticket.status === "Pendiente"
        )

        setPendingTickets(pending)
      } catch (error) {
        if (!active) return

        setPendingTickets([])

        setNotificationsError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las notificaciones"
        )
      } finally {
        if (active) {
          setNotificationsLoading(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      active = false
    }
  }, [
    location.pathname,
    settings.notificationsEnabled,
  ])

  // Cerrar menús al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
        setNotificationsOpen(false)
        setMobileSearchOpen(false)
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    )

    document.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      )

      document.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [])

  // Cerrar menús al navegar
  useEffect(() => {
    setMenuOpen(false)
    setNotificationsOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname])

  // Cerrar sesión
  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)
    setLogoutError("")
    setMenuOpen(false)

    try {
      await logoutUser()

      navigate("/login", {
        replace: true,
      })
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar sesión"
      )

      setLoggingOut(false)
    }
  }

  // Abrir perfil
  function handleOpenProfile() {
    setMenuOpen(false)
    navigate("/profile")
  }

  // Buscar tickets
  function handleSearch() {
    const query = searchTerm.trim()

    navigate(
      query
        ? `/tickets?search=${encodeURIComponent(query)}`
        : "/tickets"
    )

    setMobileSearchOpen(false)
  }

  // Abrir o cerrar notificaciones
  function handleToggleNotifications() {
    setNotificationsOpen((previous) => !previous)
    setMenuOpen(false)
    setMobileSearchOpen(false)
  }

  // Abrir o cerrar perfil
  function handleToggleMenu() {
    setMenuOpen((previous) => !previous)
    setNotificationsOpen(false)
    setMobileSearchOpen(false)
  }

  // Abrir o cerrar búsqueda móvil
  function handleToggleMobileSearch() {
    setMobileSearchOpen((previous) => !previous)
    setMenuOpen(false)
    setNotificationsOpen(false)
  }

  const displayName =
    profile?.full_name?.trim() ||
    email.split("@")[0] ||
    "Usuario"

  const displayRole = profile
    ? roleLabels[profile.role]
    : "Sin rol"

  const notificationsEnabled =
    settings.notificationsEnabled

  const pendingCount = notificationsEnabled
    ? pendingTickets.length
    : 0

  return (
    <header className="relative z-30 flex min-h-16 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
      {/* IZQUIERDA */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* BOTÓN HAMBURGUESA */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
          aria-controls="nexdesk-sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-purple-400 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* BUSCADOR DE ESCRITORIO */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSearch()
          }}
          className="hidden min-w-0 w-full max-w-md items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 transition-colors focus-within:border-purple-500/50 sm:flex"
        >
          <Search className="h-5 w-5 shrink-0 text-zinc-500" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Buscar tickets..."
            aria-label="Buscar tickets"
            className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </form>

        {/* IDENTIDAD EN MÓVILES */}
        <div className="min-w-0 sm:hidden">
          <p className="truncate text-sm font-bold tracking-wide text-white">
            NEXDESK
          </p>

          <p className="text-[10px] text-purple-400">
            IT Support
          </p>
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-5">
        {/* BOTÓN BUSCADOR MÓVIL */}
        <button
          type="button"
          aria-label={
            mobileSearchOpen
              ? "Cerrar búsqueda"
              : "Buscar tickets"
          }
          aria-expanded={mobileSearchOpen}
          onClick={handleToggleMobileSearch}
          className={`rounded-lg p-2 transition-colors sm:hidden ${
            mobileSearchOpen
              ? "bg-purple-500/10 text-purple-400"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-purple-400"
          }`}
        >
          {mobileSearchOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>

        {/* CAMPANA */}
        <div
          ref={notificationsRef}
          className="relative"
        >
          <button
            type="button"
            aria-label="Notificaciones"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={handleToggleNotifications}
            className={`relative rounded-lg p-2 transition-colors ${
              notificationsOpen
                ? "bg-purple-500/10 text-purple-400"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-purple-400"
            }`}
          >
            {notificationsEnabled ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}

            {notificationsEnabled &&
              !notificationsLoading &&
              !notificationsError &&
              pendingCount > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-purple-500" />
              )}
          </button>

          {/* PANEL DE NOTIFICACIONES */}
          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Panel de notificaciones"
              className="fixed inset-x-3 top-[4.5rem] z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 sm:max-w-[calc(100vw-2rem)]"
            >
              {/* Encabezado */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Notificaciones
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Tickets pendientes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400">
                    {notificationsEnabled
                      ? notificationsLoading
                        ? "..."
                        : pendingCount
                      : "Off"}
                  </span>

                  <button
                    type="button"
                    aria-label="Cerrar notificaciones"
                    onClick={() =>
                      setNotificationsOpen(false)
                    }
                    className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              {!notificationsEnabled ? (
                <div className="px-5 py-8 text-center">
                  <BellOff className="mx-auto h-8 w-8 text-zinc-600" />

                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    Notificaciones desactivadas
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Activa los avisos desde Configuración.
                  </p>
                </div>
              ) : notificationsLoading ? (
                <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-purple-400">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Cargando avisos...
                </div>
              ) : notificationsError ? (
                <div
                  role="alert"
                  className="px-5 py-6 text-sm text-red-400"
                >
                  {notificationsError}
                </div>
              ) : pendingTickets.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-zinc-600" />

                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    Todo al día
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    No tienes tickets pendientes visibles.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {pendingTickets
                    .slice(0, 6)
                    .map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false)
                          navigate("/tickets")
                        }}
                        className="flex w-full items-start gap-3 border-b border-zinc-800/70 px-4 py-4 text-left transition-colors last:border-0 hover:bg-zinc-900 sm:px-5"
                      >
                        <div className="shrink-0 rounded-lg bg-purple-500/10 p-2">
                          <Ticket className="h-4 w-4 text-purple-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {ticket.title}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Pendiente · Prioridad{" "}
                            {ticket.priority}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Configuración */}
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false)
                  navigate("/settings")
                }}
                className="flex w-full items-center justify-between border-t border-zinc-800 px-5 py-3 text-left text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
              >
                Configurar notificaciones
                <Settings className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="hidden h-8 w-px bg-zinc-800 sm:block" />

        {/* MENÚ DE PERFIL */}
        <div
          ref={menuRef}
          className="relative"
        >
          <button
            type="button"
            aria-label="Abrir menú de usuario"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={handleToggleMenu}
            className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors sm:gap-3 sm:px-2 sm:py-2 ${
              menuOpen
                ? "bg-purple-500/10"
                : "hover:bg-zinc-900"
            }`}
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600/20 sm:h-10 sm:w-10">
              {loadingProfile ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-purple-400" />
              ) : (
                <UserRound className="h-5 w-5 text-purple-400" />
              )}
            </div>

            {/* Información de usuario */}
            <div className="hidden min-w-0 flex-col text-left sm:flex">
              <span className="max-w-44 truncate text-sm font-semibold text-white">
                {loadingProfile
                  ? "Cargando..."
                  : displayName}
              </span>

              <span className="max-w-44 truncate text-xs text-purple-400">
                {loadingProfile
                  ? "Consultando perfil"
                  : displayRole}
              </span>

              {!loadingProfile && email && (
                <span
                  title={email}
                  className="max-w-44 truncate text-xs text-zinc-500"
                >
                  {email}
                </span>
              )}
            </div>

            <ChevronDown
              className={`hidden h-4 w-4 text-zinc-500 transition-transform sm:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* OPCIONES DE PERFIL */}
          {menuOpen && (
            <div
              role="menu"
              aria-label="Opciones de usuario"
              className="absolute right-0 top-full z-50 mt-3 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/40"
            >
              {/* Datos del usuario */}
              <div className="border-b border-zinc-800 px-3 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-zinc-500">
                  {email}
                </p>

                <p className="mt-1 text-xs font-medium text-purple-400">
                  {displayRole}
                </p>
              </div>

              <div className="space-y-1 py-2">
                {/* Mi perfil */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleOpenProfile}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-purple-500/10 hover:text-purple-400"
                >
                  <Settings className="h-4 w-4" />
                  Mi perfil
                </button>

                {/* Cerrar sesión */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    void handleLogout()
                  }
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  {loggingOut ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  {loggingOut
                    ? "Saliendo..."
                    : "Cerrar sesión"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BUSCADOR DESPLEGABLE MÓVIL */}
      {mobileSearchOpen && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSearch()
          }}
          className="absolute inset-x-0 top-full z-40 border-b border-zinc-800 bg-zinc-950 p-3 shadow-xl sm:hidden"
        >
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 focus-within:border-purple-500">
            <Search className="h-5 w-5 shrink-0 text-zinc-500" />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Buscar tickets..."
              aria-label="Buscar tickets en móvil"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <button
              type="submit"
              className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500"
            >
              Buscar
            </button>
          </div>
        </form>
      )}

      {/* ERRORES */}
      {(logoutError || profileError) && (
        <p
          role="alert"
          className="absolute right-3 top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] rounded-lg border border-red-500/20 bg-zinc-900 p-3 text-sm text-red-400 shadow-lg"
        >
          {logoutError || profileError}
        </p>
      )}
    </header>
  )
}
