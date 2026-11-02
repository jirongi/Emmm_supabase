import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

// 내가 참여한 방 전체. state로 진행중/완료를 나눠 쓴다.
export async function getMyRooms(userId) {
  const rows = unwrap(
    await supabase
      .from("room_members")
      .select("role, rooms(id, name, state, created_at)")
      .eq("user_id", userId),
  );
  return rows
    .filter((row) => row.rooms)
    .map((row) => ({ ...row.rooms, role: row.role }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createRoom(name, password) {
  return unwrap(
    await supabase.rpc("create_room", { p_name: name, p_password: password || null }),
  );
}

// { room_id, name, state, has_password }
export async function findRoom(code) {
  const rows = unwrap(await supabase.rpc("find_room", { p_code: code }));
  return rows[0];
}

export async function joinRoom(roomId, password) {
  unwrap(
    await supabase.rpc("join_room", { p_room_id: roomId, p_password: password || null }),
  );
}

export async function getRoom(roomId) {
  return unwrap(
    await supabase.from("rooms").select("*").eq("id", roomId).single(),
  );
}

export async function getMyRole(roomId, userId) {
  const row = unwrap(
    await supabase
      .from("room_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .single(),
  );
  return row.role;
}

export async function getMembers(roomId) {
  return unwrap(
    await supabase
      .from("room_members")
      .select("user_id, role, profiles(name, avatar_url)")
      .eq("room_id", roomId),
  );
}

export async function renameRoom(roomId, name) {
  unwrap(await supabase.from("rooms").update({ name }).eq("id", roomId));
}

export async function setRoomPassword(roomId, password) {
  unwrap(
    await supabase.rpc("set_room_password", { p_room_id: roomId, p_password: password || null }),
  );
}

export async function setRoomState(roomId, state) {
  unwrap(await supabase.from("rooms").update({ state }).eq("id", roomId));
}

export async function setCurrentAgenda(roomId, agendaId) {
  unwrap(
    await supabase.from("rooms").update({ current_agenda_id: agendaId }).eq("id", roomId),
  );
}

export async function deleteRoom(roomId) {
  unwrap(await supabase.from("rooms").delete().eq("id", roomId));
}
