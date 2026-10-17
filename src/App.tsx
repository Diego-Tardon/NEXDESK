
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom"

import { LoaderCircle } from "lucide-react"

// Componentes principales
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

import ProtectedRoute from "@/components/auth/ProtectedRoute"

// Servicios
import {
  getMyProfile,
  type UserRole,
} from "@/services/profileService"

// Lazy Loading: cargar páginas bajo demanda
const DashboardPage = lazy(
  () => import("@/pages/DashboardPage")
)

const TicketsPage = lazy(
  () => import("@/pages/TicketsPage")
)

const ProfilePage = lazy(
  () => import("@/pages/ProfilePage")
)

const UsersPage = lazy(
  () => import("@/pages/UsersPage")
)

const ReportsPage = lazy(
  () => import("@/pages/ReportsPage")
)

const SettingsPage = lazy(
  () => import("@/pages/SettingsPage")
)

const LoginPage = lazy(
  () => import("@/pages/LoginPage")
)

const RegisterPage = lazy(
  () => import("@/pages/RegisterPage")
)

// Pantalla de carga reutilizable
function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Cargando página"
      className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3"
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-purple-400" />

      <p className="text-sm text-zinc-400">
        Cargando NEXDESK...
      </p>
    </div>
  )
}

// Suspense para páginas cargadas dinámicamente
function LazyPage({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  )
}

// Propiedades de rutas por rol
type RoleRouteProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

// Protección por roles
function RoleRoute({
  allowedRoles,
  children,
}: RoleRouteProps) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    async function checkRole() {
      try {
        const profile = await getMyProfile()

        if (active) {
          setRole(profile.role)
          setError(false)
        }
      } catch (err) {
        console.error(
          "Error al verificar el rol:",
          err
        )

        if (active) {
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void checkRole()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <PageLoader />
  }

  if (
    error ||
    !role ||
    !allowedRoles.includes(role)
  ) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Diseño principal responsive de NEXDESK
function DashboardLayout() {
  // Estado del menú lateral en móviles
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Cerrar Sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  // Abrir o cerrar Sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((previous) => !previous)
  }, [])

  return (
    <div className="flex min-h-screen bg-zinc-900">
      {/* Sidebar responsive */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header con control del menú móvil */}
        <Header onMenuClick={toggleSidebar} />

        <Routes>
          {/* Dashboard */}
          <Route
            path="/"
            element={
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            }
          />

          {/* Tickets */}
          <Route
            path="/tickets"
            element={
              <LazyPage>
                <TicketsPage />
              </LazyPage>
            }
          />

          {/* Perfil */}
          <Route
            path="/profile"
            element={
              <LazyPage>
                <ProfilePage />
              </LazyPage>
            }
          />

          {/* Usuarios: solo administrador */}
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <LazyPage>
                  <UsersPage />
                </LazyPage>
              </RoleRoute>
            }
          />

          {/* Reportes: administrador y técnico */}
          <Route
            path="/reports"
            element={
              <RoleRoute
                allowedRoles={["admin", "technician"]}
              >
                <LazyPage>
                  <ReportsPage />
                </LazyPage>
              </RoleRoute>
            }
          />

          {/* Configuración: todos los usuarios */}
          <Route
            path="/settings"
            element={
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            }
          />

          {/* Ruta no encontrada */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </div>
  )
}

// Aplicación principal
function App() {
  return (
    <Routes>
      {/* Inicio de sesión */}
      <Route
        path="/login"
        element={
          <LazyPage>
            <LoginPage />
          </LazyPage>
        }
      />

      {/* Registro */}
      <Route
        path="/register"
        element={
          <LazyPage>
            <RegisterPage />
          </LazyPage>
        }
      />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={<DashboardLayout />}
        />
      </Route>
    </Routes>
  )
}

export default App
