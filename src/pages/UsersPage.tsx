
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import {
  Users,
  UserRound,
  UserCog,
  ShieldCheck,
  Search,
  RefreshCw,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
  LockKeyhole,
  X,
  Check,
  Mail,
} from "lucide-react"

import {
  getAllUsers,
  getUserRoleLabel,
  updateUserRole,
  type SystemUser,
  type UserRole,
} from "@/services/userService"

import { getMyProfile } from "@/services/profileService"

// Estilos según rol
const roleStyles: Record<UserRole, string> = {
  admin: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  technician: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  user: "border-zinc-700 bg-zinc-800 text-zinc-300",
}

type EditableRole = "user" | "technician"

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

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

  return "Ocurrió un error inesperado"
}

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Modal de cambio de rol
  const [selectedUser, setSelectedUser] =
    useState<SystemUser | null>(null)

  const [newRole, setNewRole] =
    useState<EditableRole>("user")

  const [savingRole, setSavingRole] = useState(false)
  const [modalError, setModalError] = useState("")

  // Cargar usuarios y verificar permisos
  useEffect(() => {
    let active = true

    async function loadUsers() {
      try {
        const profile = await getMyProfile()

        if (!active) return

        if (profile.role !== "admin") {
          setAuthorized(false)
          return
        }

        setAuthorized(true)

        const data = await getAllUsers()

        if (active) {
          setUsers(data)
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      active = false
    }
  }, [])

  // Actualizar listado
  async function handleRefresh() {
    if (refreshing || !authorized) return

    setRefreshing(true)
    setError("")
    setSuccess("")

    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }

  // Abrir modal
  function openRoleModal(user: SystemUser) {
    if (user.role === "admin" || savingRole) return

    setSelectedUser(user)
    setNewRole(user.role)
    setModalError("")
    setSuccess("")
  }

  // Cerrar modal
  function closeRoleModal() {
    if (savingRole) return

    setSelectedUser(null)
    setModalError("")
  }

  // Guardar cambio de rol
  async function handleSaveRole() {
    if (!selectedUser || savingRole) return

    if (selectedUser.role === "admin") {
      setModalError(
        "No puedes modificar una cuenta administradora"
      )
      return
    }

    if (selectedUser.role === newRole) {
      closeRoleModal()
      return
    }

    setSavingRole(true)
    setModalError("")
    setError("")

    try {
      await updateUserRole(selectedUser.id, newRole)

      // Consultar nuevamente Supabase
      const updatedUsers = await getAllUsers()
      setUsers(updatedUsers)

      setSuccess(
        `El rol de ${
          selectedUser.full_name?.trim() ||
          selectedUser.email ||
          "este usuario"
        } se actualizó a ${getUserRoleLabel(newRole)}.`
      )

      setSelectedUser(null)
    } catch (err) {
      setModalError(getErrorMessage(err))
    } finally {
      setSavingRole(false)
    }
  }

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        (user.full_name ?? "")
          .toLowerCase()
          .includes(term) ||
        (user.email ?? "")
          .toLowerCase()
          .includes(term)

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(
        (user) => user.role === "admin"
      ).length,
      technicians: users.filter(
        (user) => user.role === "technician"
      ).length,
      regular: users.filter(
        (user) => user.role === "user"
      ).length,
    }
  }, [users])

  // Cargando
  if (loading) {
    return (
      <main className="flex min-h-[400px] min-w-0 flex-1 items-center justify-center bg-zinc-900 px-4">
        <div
          role="status"
          className="flex items-center gap-3 text-sm text-zinc-400"
        >
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-purple-400" />
          Cargando módulo de usuarios...
        </div>
      </main>
    )
  }

  // Acceso restringido
  if (!authorized) {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center bg-zinc-900 p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <LockKeyhole className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Acceso restringido
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Este módulo está disponible únicamente para
            administradores de NEXDESK.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 break-words text-sm text-red-400"
            >
              {error}
            </p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden bg-zinc-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        {/* ENCABEZADO */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-purple-400" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400 sm:text-xs">
                NEXDESK / Administración
              </span>
            </div>

            <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gestión de usuarios
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Administra las cuentas y los roles de NEXDESK.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-purple-500/50 hover:text-purple-400 disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </header>

        {/* ESTADÍSTICAS */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
          <StatCard
            title="Total de usuarios"
            value={stats.total}
            icon={<Users className="h-5 w-5" />}
            color="purple"
          />

          <StatCard
            title="Administradores"
            value={stats.admins}
            icon={<ShieldCheck className="h-5 w-5" />}
            color="purple"
          />

          <StatCard
            title="Técnicos TI"
            value={stats.technicians}
            icon={<UserCog className="h-5 w-5" />}
            color="blue"
          />

          <StatCard
            title="Usuarios"
            value={stats.regular}
            icon={<UserRound className="h-5 w-5" />}
            color="gray"
          />
        </section>

        {/* MENSAJES */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
          >
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{success}</span>
          </div>
        )}

        {/* BUSCADOR Y FILTROS */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:mt-8 sm:p-5">
          <h2 className="text-base font-semibold text-white">
            Buscar y filtrar
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Encuentra usuarios por nombre, correo o rol.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* BUSCADOR */}
            <div className="min-w-0 md:col-span-2">
              <label
                htmlFor="user-search"
                className="mb-2 block text-sm text-zinc-400"
              >
                Buscar usuario
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <input
                  id="user-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar por nombre o correo..."
                  className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* FILTRO DE ROL */}
            <div className="min-w-0">
              <label
                htmlFor="user-role-filter"
                className="mb-2 block text-sm text-zinc-400"
              >
                Rol
              </label>

              <select
                id="user-role-filter"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="technician">Técnico TI</option>
                <option value="user">Usuario</option>
              </select>
            </div>
          </div>
        </section>

        {/* LISTADO */}
        <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                Usuarios registrados
              </h2>

              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                Cuentas registradas en la plataforma.
              </p>
            </div>

            <span className="w-fit rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
              {filteredUsers.length} resultados
            </span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-14 text-center sm:px-6 sm:py-16">
              <Users className="h-10 w-10 text-zinc-600" />

              <h3 className="text-base font-semibold text-white sm:text-lg">
                No se encontraron usuarios
              </h3>

              <p className="text-sm text-zinc-500">
                Prueba con otra búsqueda o filtro.
              </p>
            </div>
          ) : (
            <>
              {/* VERSIÓN MÓVIL */}
              <div className="space-y-3 p-3 md:hidden sm:p-4">
                {filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    {/* NOMBRE Y ROL */}
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                        <UserRound className="h-5 w-5 text-purple-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-white">
                          {user.full_name?.trim() || "Sin nombre"}
                        </p>

                        <span
                          className={`mt-2 inline-flex max-w-full rounded-full border px-2.5 py-1 text-[11px] font-medium ${roleStyles[user.role]}`}
                        >
                          {getUserRoleLabel(user.role)}
                        </span>
                      </div>
                    </div>

                    {/* CORREO */}
                    <div className="mt-4 flex min-w-0 items-start gap-2 text-xs text-zinc-400">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />

                      <span className="min-w-0 break-all">
                        {user.email || "Sin correo"}
                      </span>
                    </div>

                    {/* FECHA */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                      <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />

                      <span>
                        {formatDate(user.created_at)}
                      </span>
                    </div>

                    {/* ACCIONES */}
                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      {user.role === "admin" ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <LockKeyhole className="h-3.5 w-3.5" />
                          Cuenta protegida
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRoleModal(user)}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-400"
                        >
                          <UserCog className="h-4 w-4" />
                          Cambiar rol
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* VERSIÓN ESCRITORIO */}
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b border-zinc-800 bg-zinc-900/30 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-6 py-4">
                        Usuario
                      </th>
                      <th className="px-6 py-4">
                        Correo electrónico
                      </th>
                      <th className="px-6 py-4">
                        Rol
                      </th>
                      <th className="px-6 py-4">
                        Fecha de registro
                      </th>
                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-zinc-800/70 transition-colors last:border-0 hover:bg-zinc-900/60"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                              <UserRound className="h-5 w-5 text-purple-400" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-white">
                                {user.full_name?.trim() || "Sin nombre"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                Cuenta registrada
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-zinc-400">
                          <span className="block max-w-[260px] truncate">
                            {user.email || "Sin correo"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${roleStyles[user.role]}`}
                          >
                            {getUserRoleLabel(user.role)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 whitespace-nowrap text-sm text-zinc-400">
                            <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {user.role === "admin" ? (
                            <span className="text-xs text-zinc-600">
                              Protegido
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openRoleModal(user)}
                              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-400"
                            >
                              <UserCog className="h-3.5 w-3.5" />
                              Cambiar rol
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {/* MODAL RESPONSIVE */}
      {selectedUser && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRoleModal()
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-role-title"
            className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:max-w-md sm:rounded-2xl"
          >
            {/* ENCABEZADO MODAL */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-xl bg-purple-500/10 p-3">
                  <UserCog className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="change-role-title"
                    className="text-base font-bold text-white sm:text-lg"
                  >
                    Cambiar rol
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Administración de permisos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRoleModal}
                disabled={savingRole}
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CONTENIDO MODAL */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="break-words font-semibold text-white">
                  {selectedUser.full_name?.trim() || "Sin nombre"}
                </p>

                <p className="mt-1 break-all text-sm text-zinc-400">
                  {selectedUser.email || "Sin correo"}
                </p>

                <p className="mt-3 text-xs text-zinc-500">
                  Rol actual:{" "}
                  <span className="font-medium text-zinc-200">
                    {getUserRoleLabel(selectedUser.role)}
                  </span>
                </p>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="new-user-role"
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Nuevo rol
                </label>

                <select
                  id="new-user-role"
                  value={newRole}
                  onChange={(event) =>
                    setNewRole(
                      event.target.value as EditableRole
                    )
                  }
                  disabled={savingRole}
                  className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                >
                  <option value="user">Usuario</option>
                  <option value="technician">Técnico TI</option>
                </select>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Este cambio modificará los permisos de la cuenta
                seleccionada en NEXDESK.
              </p>

              {modalError && (
                <div
                  role="alert"
                  className="mt-4 break-words rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                >
                  {modalError}
                </div>
              )}
            </div>

            {/* BOTONES MODAL */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={closeRoleModal}
                disabled={savingRole}
                className="min-h-11 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void handleSaveRole()}
                disabled={
                  savingRole ||
                  selectedUser.role === newRole
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingRole ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                {savingRole
                  ? "Guardando..."
                  : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// Tarjeta de estadísticas del módulo de usuarios
interface StatCardProps {
  title: string
  value: number
  icon: ReactNode
  color: "purple" | "blue" | "gray"
}

function StatCard({
  title,
  value,
  icon,
  color,
}: StatCardProps) {
  const colors = {
    purple: "bg-purple-500/10 text-purple-400",
    blue: "bg-blue-500/10 text-blue-400",
    gray: "bg-zinc-800 text-zinc-300",
  }

  return (
    <div className="group min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-purple-500/30 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-xs font-medium leading-relaxed text-zinc-400 sm:text-sm">
          {title}
        </p>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${colors[color]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 break-words text-2xl font-bold text-white tabular-nums sm:mt-5 sm:text-3xl">
        {value}
      </p>
    </div>
  )
}
