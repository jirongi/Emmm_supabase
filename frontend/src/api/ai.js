import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

export async function getSummary(agendaId) {
  const rows = unwrap(
    await supabase.from("ai_summaries").select("*").eq("agenda_id", agendaId),
  );
  return rows[0] ?? null;
}

// Edge Function ai-summary가 요약을 만들어 ai_summaries에 저장한다 (생성·재생성 공통)
export async function generateSummary(agendaId) {
  const { data, error } = await supabase.functions.invoke("ai-summary", {
    body: { agendaId },
  });
  if (error) throw error;
  return data;
}
