import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

const BUCKET = "agenda-files";

export async function getFiles(agendaId) {
  return unwrap(
    await supabase
      .from("files")
      .select("*")
      .eq("agenda_id", agendaId)
      .order("created_at"),
  );
}

// 경로 규칙 {roomId}/{agendaId}/{uuid}.{ext} 는 Storage 정책과 맞춰야 한다
export async function uploadFile(roomId, agendaId, file) {
  const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  const path = `${roomId}/${agendaId}/${crypto.randomUUID()}.${ext}`;

  unwrap(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }));

  const { error } = await supabase.from("files").insert({
    agenda_id: agendaId,
    file_name: file.name,
    storage_path: path,
    is_pdf: file.type === "application/pdf",
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

// 1시간짜리 주소. 버킷이 비공개라 이 주소로만 볼 수 있다.
export async function getFileUrls(paths) {
  if (paths.length === 0) return {};
  const rows = unwrap(await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600));
  return Object.fromEntries(rows.map((row) => [row.path, row.signedUrl]));
}

export async function deleteFile(file) {
  unwrap(await supabase.from("files").delete().eq("id", file.id));
  await supabase.storage.from(BUCKET).remove([file.storage_path]);
}
