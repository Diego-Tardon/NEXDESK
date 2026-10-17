
import { useEffect, useState } from "react"

import { getMyProfile } from "@/services/profileService"

import {
  defaultSettings,
  getSettings,
  SETTINGS_CHANGED_EVENT,
  type AppSettings,
} from "@/services/settingsService"

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>({
    ...defaultSettings,
  })

  const [userId, setUserId] = useState<string | null>(null)

  // Cargar configuración del usuario autenticado
  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const profile = await getMyProfile()

        if (!active) return

        setUserId(profile.id)
        setSettings(getSettings(profile.id))
      } catch (error) {
        if (!active) return

        console.error(
          "No se pudieron cargar las preferencias:",
          error
        )
      }
    }

    void loadSettings()

    return () => {
      active = false
    }
  }, [])

  // Escuchar cambios en la configuración
  useEffect(() => {
    if (userId === null) return

    // Guardar el ID validado como string
    const currentUserId: string = userId

    function refreshSettings() {
      setSettings(getSettings(currentUserId))
    }

    window.addEventListener(
      SETTINGS_CHANGED_EVENT,
      refreshSettings
    )

    window.addEventListener(
      "storage",
      refreshSettings
    )

    return () => {
      window.removeEventListener(
        SETTINGS_CHANGED_EVENT,
        refreshSettings
      )

      window.removeEventListener(
        "storage",
        refreshSettings
      )
    }
  }, [userId])

  return settings
}
