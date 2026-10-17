
import { useEffect, useState } from "react"

import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Headphones,
  X,
} from "lucide-react"

import { NavLink, useLocation } from "react-router-dom"

import {
  getMyProfile,
  type UserRole,
} from "@/services/profileService"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    name: "Tickets",
    icon: Ticket,
    path: "/tickets",
  },
]

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const [role, setRole] = useState<UserRole | null>(null)

  const location = useLocation()

  // Obtener rol del usuario
  useEffect(() => {
    let active = true

    async function loadRole() {
      try {
        const profile = await getMyProfile()

        if (active) {
          setRole(profile.role)
        }
      } catch (error) {
        console.error(
          "No se pudo cargar el rol:",
          error
        )

        if (active) {
          setRole(null)
        }
      }
    }

    void loadRole()

    return () => {
      active = false
    }
  }, [])

  // Cerrar menú al navegar
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Bloquear scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const canViewReports =
    role === "admin" || role === "technician"

  const linkClass = ({
    isActive,
  }: {
    isActive: boolean
  }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-purple-600/10 text-purple-400"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
    }`

  return (
    <>
      {/* Fondo oscuro en móviles */}
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="nexdesk-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-5 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="mb-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-600 p-2">
              <Headphones className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">
                NEXDESK
              </h1>

              <p className="text-xs text-zinc-500">
                IT Support System
              </p>
            </div>
          </div>

          {/* Cerrar en móvil */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav
          aria-label="Navegación principal"
          className="flex flex-1 flex-col gap-2 overflow-y-auto"
        >
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={linkClass}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}

          {/* Usuarios: solo administrador */}
          {role === "admin" && (
            <NavLink
              to="/users"
              onClick={onClose}
              className={linkClass}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span>Usuarios</span>
            </NavLink>
          )}

          {/* Reportes: administrador y técnico */}
          {canViewReports && (
            <NavLink
              to="/reports"
              onClick={onClose}
              className={linkClass}
            >
              <BarChart3 className="h-5 w-5 shrink-0" />
              <span>Reportes</span>
            </NavLink>
          )}

          {/* Configuración: todos los roles */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={linkClass}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Configuración</span>
          </NavLink>
        </nav>

        {/* Versión */}
        <div className="mt-5 border-t border-zinc-800 pt-5">
          <p className="text-xs text-zinc-500">
            NEXDESK v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
