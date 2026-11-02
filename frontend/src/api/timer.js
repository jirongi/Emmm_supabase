import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

// started_at은 DB 트리거가 서버 시각으로 채운다 (클라이언트 시계 차이 방지)
export async function getTimer(roomId) {
  return unwrap(
    await supabase.from("timers").select("*").eq("room_id", roomId).single(),
  );
}

export async function updateTimer(roomId, { status, remainingSec }) {
  const fields = {};
  if (status !== undefined) fields.status = status;
  if (remainingSec !== undefined) fields.remaining_sec = Math.max(0, Math.round(remainingSec));
  unwrap(await supabase.from("timers").update(fields).eq("room_id", roomId));
}

// 지금 남은 초. play면 서버가 기록한 시작 시각부터 흐른 시간을 뺀다.
export function remainingSeconds(timer, now = Date.now()) {
  if (!timer) return 0;
  if (timer.status !== "play" || !timer.started_at) return timer.remaining_sec;
  const elapsed = Math.floor((now - new Date(timer.started_at).getTime()) / 1000);
  return Math.max(0, timer.remaining_sec - elapsed);
}
