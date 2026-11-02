-- 5단계: 실시간(Realtime) · 파일 저장(Storage)

-- ---------------------------------------------------------------------------
-- Realtime: 테이블 변경 이벤트(postgres_changes)를 보낼 테이블 등록
-- 기존 STOMP /topic/... 신호를 대체한다. 이벤트는 RLS select 정책을 통과한 사용자에게만 간다.
--
-- 삭제(DELETE) 이벤트 주의:
--   RLS가 켜진 테이블의 DELETE 이벤트에는 기본 키(id)만 담기고, room_id 같은 필터가 걸리지 않는다.
--   그래서 프론트는 DELETE 이벤트를 필터 없이 구독하고, 받으면 목록을 다시 불러오기만 한다.
--   (내용이 아니라 id만 오므로 다른 방 사용자에게 데이터가 새지 않는다)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.rooms,
  public.room_members,
  public.agendas,
  public.timers,
  public.dm_messages,
  public.comments,
  public.files,
  public.votes,
  public.vote_options,
  public.vote_selections,
  public.ai_summaries;

-- ---------------------------------------------------------------------------
-- Storage: 안건 첨부 파일용 비공개 버킷
-- 경로 규칙: {room_id}/{agenda_id}/{uuid}.{확장자}
-- 보기는 createSignedUrl()로 받은 만료 주소로만 한다 (기존 S3 PublicRead 대체).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agenda-files',
  'agenda-files',
  false,
  20971520,  -- 20MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 경로의 room_id가 내가 멤버인 방이고, agenda_id가 그 방의 안건인지 확인한다.
-- 경로 형식이 다르면 false (숫자 변환 에러가 나지 않도록 case로 먼저 검사).
create function public.can_access_agenda_path(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (storage.foldername(path))[1] ~ '^[0-9]+$'
     and (storage.foldername(path))[2] ~ '^[0-9]+$'
    then public.is_member(((storage.foldername(path))[1])::bigint)
     and public.agenda_room(((storage.foldername(path))[2])::bigint)
         = ((storage.foldername(path))[1])::bigint
    else false
  end;
$$;

create function public.is_host_of_path(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (storage.foldername(path))[1] ~ '^[0-9]+$'
    then public.is_host(((storage.foldername(path))[1])::bigint)
    else false
  end;
$$;

create policy "agenda_files_select_member" on storage.objects
  for select to authenticated
  using (bucket_id = 'agenda-files' and public.can_access_agenda_path(name));

create policy "agenda_files_insert_member" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'agenda-files' and public.can_access_agenda_path(name));

-- 올린 사람 또는 그 방 host만 삭제. 덮어쓰기(update)는 허용하지 않는다.
create policy "agenda_files_delete_owner_or_host" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'agenda-files'
    and (owner_id = (select auth.uid())::text or public.is_host_of_path(name))
  );
