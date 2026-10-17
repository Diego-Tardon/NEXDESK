import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan las variables de entorno de Supabase"
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

export async function testSupabaseConnection() {
  const { error } = await supabase
    .from("tickets")
    .select("id")
    .limit(1)

  if (error) {
    console.log("Respuesta de Supabase:", error.message)
    return
  }

  console.log("Conexión con Supabase correcta")
}