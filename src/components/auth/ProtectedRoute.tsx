
import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "../../lib/supabase"

export default function ProtectedRoute() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Comprobar si existe una sesión al abrir NEXDESK
    async function checkSession() {
      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      if (error || !data.user) {
        setSession(null)
      } else {
        const { data: sessionData } =
          await supabase.auth.getSession()

        if (!active) return

        setSession(sessionData.session)
      }

      setLoading(false)
    }

    void checkSession()

    // Escuchar cambios al iniciar o cerrar sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return

      setSession(newSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500" />
          <p className="text-sm text-zinc-400">
            Verificando sesión...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
