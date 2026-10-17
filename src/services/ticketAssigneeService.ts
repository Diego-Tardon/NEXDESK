
import { supabase } from "@/lib/supabase"

export interface TicketAssignee {
  ticket_id: string
  technician_name: string
}

export async function getTicketAssigneeNames(): Promise<TicketAssignee[]> {
  const { data, error } = await supabase.rpc(
    "get_ticket_assignee_names"
  )

  if (error) {
    throw error
  }

  return (data ?? []) as TicketAssignee[]
}
