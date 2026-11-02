import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

export async function getComments(agendaId) {
  return unwrap(
    await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("agenda_id", agendaId)
      .order("created_at", { ascending: false }),
  );
}

export async function addComment(agendaId, content) {
  unwrap(await supabase.from("comments").insert({ agenda_id: agendaId, content }));
}
