import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

export async function getVotes(agendaId) {
  return unwrap(
    await supabase
      .from("votes")
      .select("*")
      .eq("agenda_id", agendaId)
      .order("created_at"),
  );
}

export async function getVote(voteId) {
  return unwrap(await supabase.from("votes").select("*").eq("id", voteId).single());
}

// 투표와 옵션을 저장 버튼에서 한 번에 만든다 (모달을 열기만 해서는 생성되지 않음)
export async function createVote(agendaId, title, optionContents) {
  const vote = unwrap(
    await supabase.from("votes").insert({ agenda_id: agendaId, title }).select().single(),
  );
  const { error } = await supabase
    .from("vote_options")
    .insert(optionContents.map((content) => ({ vote_id: vote.id, content })));
  if (error) {
    await supabase.from("votes").delete().eq("id", vote.id);
    throw error;
  }
  return vote;
}

export async function updateVote(voteId, fields) {
  unwrap(await supabase.from("votes").update(fields).eq("id", voteId));
}

export async function deleteVote(voteId) {
  unwrap(await supabase.from("votes").delete().eq("id", voteId));
}

export async function getOptions(voteId) {
  return unwrap(
    await supabase.from("vote_options").select("*").eq("vote_id", voteId).order("id"),
  );
}

export async function getMySelection(voteId, userId) {
  const rows = unwrap(
    await supabase
      .from("vote_selections")
      .select("option_id")
      .eq("vote_id", voteId)
      .eq("user_id", userId),
  );
  return rows[0]?.option_id ?? null;
}

export async function castVote(voteId, optionId) {
  unwrap(await supabase.rpc("cast_vote", { p_vote_id: voteId, p_option_id: optionId }));
}

export async function cancelVote(voteId, userId) {
  unwrap(
    await supabase.from("vote_selections").delete().eq("vote_id", voteId).eq("user_id", userId),
  );
}

export async function getResults(voteId) {
  return unwrap(
    await supabase.from("vote_results").select("*").eq("vote_id", voteId).order("option_id"),
  );
}
