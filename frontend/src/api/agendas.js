import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";
import { removeStoredFiles } from "./files";

export async function getAgendas(roomId) {
  return unwrap(
    await supabase
      .from("agendas")
      .select("*")
      .eq("room_id", roomId)
      .order("sequence"),
  );
}

export async function getAgenda(agendaId) {
  return unwrap(
    await supabase.from("agendas").select("*").eq("id", agendaId).single(),
  );
}

// 오른쪽 기능 아이콘 색칠용: 안건에 파일·댓글·투표·AI 요약이 하나라도 있는지
export async function getAgendaUsage(agendaId) {
  const count = async (table) => {
    const { count: n, error } = await supabase
      .from(table)
      .select("agenda_id", { count: "exact", head: true })
      .eq("agenda_id", agendaId);
    if (error) throw error;
    return n > 0;
  };
  const [file, comment, vote, ai] = await Promise.all(
    ["files", "comments", "votes", "ai_summaries"].map(count),
  );
  return { file, comment, vote, ai };
}

export async function addAgenda(roomId, name) {
  return unwrap(
    await supabase.rpc("add_agenda", { p_room_id: roomId, p_name: name }),
  );
}

export async function updateAgenda(agendaId, fields) {
  unwrap(await supabase.from("agendas").update(fields).eq("id", agendaId));
}

export async function deleteAgenda(agendaId) {
  await removeStoredFiles([agendaId]);
  unwrap(await supabase.from("agendas").delete().eq("id", agendaId));
}
