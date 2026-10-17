
export type DateFormat = "CL" | "ISO" | "US"

export interface AppSettings {
  dateFormat: DateFormat
  notificationsEnabled: boolean
  compactMode: boolean
}

export const defaultSettings: AppSettings = {
  dateFormat: "CL",
  notificationsEnabled: true,
  compactMode: false,
}

export const SETTINGS_CHANGED_EVENT = "nexdesk:settings-changed"

// Clave única de configuración por usuario
function getStorageKey(userId: string): string {
  return `nexdesk-settings-${userId}`
}

// Obtener las preferencias guardadas
export function getSettings(userId: string): AppSettings {
  try {
    const saved = localStorage.getItem(
      getStorageKey(userId)
    )

    if (!saved) {
      return { ...defaultSettings }
    }

    const parsed: unknown = JSON.parse(saved)

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { ...defaultSettings }
    }

    const data = parsed as Partial<AppSettings>

    return {
      dateFormat:
        data.dateFormat === "CL" ||
        data.dateFormat === "ISO" ||
        data.dateFormat === "US"
          ? data.dateFormat
          : defaultSettings.dateFormat,

      notificationsEnabled:
        typeof data.notificationsEnabled === "boolean"
          ? data.notificationsEnabled
          : defaultSettings.notificationsEnabled,

      compactMode:
        typeof data.compactMode === "boolean"
          ? data.compactMode
          : defaultSettings.compactMode,
    }
  } catch {
    return { ...defaultSettings }
  }
}

// Avisar a los componentes cuando cambie la configuración
function notifySettingsChanged(): void {
  window.dispatchEvent(
    new Event(SETTINGS_CHANGED_EVENT)
  )
}

// Guardar configuración
export function saveSettings(
  userId: string,
  settings: AppSettings
): void {
  localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(settings)
  )

  notifySettingsChanged()
}

// Restablecer configuración predeterminada
export function resetSettings(userId: string): void {
  localStorage.removeItem(getStorageKey(userId))

  notifySettingsChanged()
}

// Formatear fechas según las preferencias
export function formatAppDate(
  date: string | Date,
  format: DateFormat
): string {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return "Fecha no disponible"
  }

  const year = value.getFullYear()
  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0")

  const day = String(
    value.getDate()
  ).padStart(2, "0")

  switch (format) {
    case "ISO":
      return `${year}-${month}-${day}`

    case "US":
      return `${month}/${day}/${year}`

    case "CL":
    default:
      return `${day}-${month}-${year}`
  }
}
