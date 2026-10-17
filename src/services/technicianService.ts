
import { supabase } from "@/lib/supabase"

export type Technician = {
  id: string
  full_name: string
}

export async function getTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase.rpc("get_technicians")

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Technician[]
}
