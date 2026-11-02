import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

// host는 방의 DM 전체, member는 본인이 보낸 것만 (RLS가 거른다)
export async function getDms(roomId) {
  return unwrap(
    await supabase
      .from("dm_messages")
      .select("id, content, created_at, sender_id")
      .eq("room_id", roomId)
      .order("created_at"),
  );
}

export async function sendDm(roomId, content) {
  unwrap(await supabase.from("dm_messages").insert({ room_id: roomId, content }));
}
