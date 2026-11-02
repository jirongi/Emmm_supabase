-- 3단계: 권한(RLS) 정책
-- 기본 규칙: 그 방의 멤버만 읽고, 방 구조(안건·투표·타이머)를 바꾸는 건 host만.
-- 방 생성·참여·투표 선택은 정책으로 열지 않고 4단계 RPC로만 한다.

-- ---------------------------------------------------------------------------
-- 도우미 함수
-- security definer라서 room_members 정책 안에서 room_members를 다시 읽어도 무한 재귀가 생기지 않는다.
-- ---------------------------------------------------------------------------
create function public.is_member(rid bigint)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members
    where room_id = rid and user_id = auth.uid()
  );
$$;

create function public.is_host(rid bigint)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members
    where room_id = rid and user_id = auth.uid() and role = 'host'
  );
$$;

create function public.agenda_room(aid bigint)
returns bigint
language sql stable security definer
set search_path = ''
as $$
  select room_id from public.agendas where id = aid;
$$;

create function public.vote_room(vid bigint)
returns bigint
language sql stable security definer
set search_path = ''
as $$
  select a.room_id
  from public.votes v join public.agendas a on a.id = v.agenda_id
  where v.id = vid;
$$;

-- 나와 같은 방에 있는 사용자인지 (프로필 공개 범위)
create function public.shares_room_with(uid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members me
    join public.room_members other on other.room_id = me.room_id
    where me.user_id = auth.uid() and other.user_id = uid
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles: 본인과 같은 방 사람만 조회, 본인만 수정
-- ---------------------------------------------------------------------------
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_room_with(id));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- rooms: 멤버 조회, host 수정·삭제, 생성은 RPC(create_room)
-- ---------------------------------------------------------------------------
create policy "rooms_select_member" on public.rooms
  for select to authenticated
  using (public.is_member(id));

create policy "rooms_update_host" on public.rooms
  for update to authenticated
  using (public.is_host(id))
  with check (public.is_host(id));

create policy "rooms_delete_host" on public.rooms
  for delete to authenticated
  using (public.is_host(id));

-- RLS는 컬럼을 못 막으므로 트리거로 막는다:
-- code·created_by는 바꿀 수 없고, current_agenda_id는 이 방의 안건이어야 한다.
create function public.rooms_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.code is distinct from old.code or new.created_by is distinct from old.created_by then
    raise exception 'immutable_column';
  end if;
  if new.current_agenda_id is not null and not exists (
    select 1 from public.agendas where id = new.current_agenda_id and room_id = new.id
  ) then
    raise exception 'agenda_not_in_room';
  end if;
  return new;
end;
$$;

create trigger rooms_guard
  before update on public.rooms
  for each row execute function public.rooms_guard();

-- ---------------------------------------------------------------------------
-- room_members: 같은 방 멤버 조회, 참여는 RPC(join_room)
-- 나가기: member 본인 / 내보내기: host가 member를. host 행은 방 삭제로만 사라진다.
-- ---------------------------------------------------------------------------
create policy "room_members_select" on public.room_members
  for select to authenticated
  using (public.is_member(room_id));

create policy "room_members_delete" on public.room_members
  for delete to authenticated
  using (role = 'member' and (user_id = auth.uid() or public.is_host(room_id)));

-- room_passwords: 정책 없음 (RPC만 접근)

-- ---------------------------------------------------------------------------
-- agendas: 멤버 조회, host 생성·수정·삭제
-- ---------------------------------------------------------------------------
create policy "agendas_select_member" on public.agendas
  for select to authenticated
  using (public.is_member(room_id));

create policy "agendas_insert_host" on public.agendas
  for insert to authenticated
  with check (public.is_host(room_id));

create policy "agendas_update_host" on public.agendas
  for update to authenticated
  using (public.is_host(room_id))
  with check (public.is_host(room_id));

create policy "agendas_delete_host" on public.agendas
  for delete to authenticated
  using (public.is_host(room_id));

-- ---------------------------------------------------------------------------
-- comments: 멤버 조회·작성(본인 명의), 본인만 삭제
-- ---------------------------------------------------------------------------
create policy "comments_select_member" on public.comments
  for select to authenticated
  using (public.is_member(public.agenda_room(agenda_id)));

create policy "comments_insert_member" on public.comments
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(public.agenda_room(agenda_id)));

create policy "comments_delete_own" on public.comments
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- files: 멤버 조회·등록(본인 명의), 올린 사람이나 host가 삭제
-- ---------------------------------------------------------------------------
create policy "files_select_member" on public.files
  for select to authenticated
  using (public.is_member(public.agenda_room(agenda_id)));

create policy "files_insert_member" on public.files
  for insert to authenticated
  with check (uploaded_by = auth.uid() and public.is_member(public.agenda_room(agenda_id)));

create policy "files_delete_owner_or_host" on public.files
  for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_host(public.agenda_room(agenda_id)));

-- ---------------------------------------------------------------------------
-- votes · vote_options: 멤버 조회, host 생성·수정·삭제
-- ---------------------------------------------------------------------------
create policy "votes_select_member" on public.votes
  for select to authenticated
  using (public.is_member(public.agenda_room(agenda_id)));

create policy "votes_insert_host" on public.votes
  for insert to authenticated
  with check (public.is_host(public.agenda_room(agenda_id)));

create policy "votes_update_host" on public.votes
  for update to authenticated
  using (public.is_host(public.agenda_room(agenda_id)))
  with check (public.is_host(public.agenda_room(agenda_id)));

create policy "votes_delete_host" on public.votes
  for delete to authenticated
  using (public.is_host(public.agenda_room(agenda_id)));

create policy "vote_options_select_member" on public.vote_options
  for select to authenticated
  using (public.is_member(public.vote_room(vote_id)));

create policy "vote_options_insert_host" on public.vote_options
  for insert to authenticated
  with check (public.is_host(public.vote_room(vote_id)));

create policy "vote_options_update_host" on public.vote_options
  for update to authenticated
  using (public.is_host(public.vote_room(vote_id)))
  with check (public.is_host(public.vote_room(vote_id)));

create policy "vote_options_delete_host" on public.vote_options
  for delete to authenticated
  using (public.is_host(public.vote_room(vote_id)));

-- ---------------------------------------------------------------------------
-- vote_selections: 멤버 조회(득표 집계용), 투표·변경은 RPC(cast_vote),
-- 진행 중인 투표에서 본인 표만 취소
-- ---------------------------------------------------------------------------
create policy "vote_selections_select_member" on public.vote_selections
  for select to authenticated
  using (public.is_member(public.vote_room(vote_id)));

create policy "vote_selections_delete_own" on public.vote_selections
  for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.votes v where v.id = vote_id and v.status = 'running')
  );

-- ---------------------------------------------------------------------------
-- ai_summaries: 멤버 조회, host 삭제, 생성·수정은 Edge Function(service role)만
-- ---------------------------------------------------------------------------
create policy "ai_summaries_select_member" on public.ai_summaries
  for select to authenticated
  using (public.is_member(public.agenda_room(agenda_id)));

create policy "ai_summaries_delete_host" on public.ai_summaries
  for delete to authenticated
  using (public.is_host(public.agenda_room(agenda_id)));

-- ---------------------------------------------------------------------------
-- timers: 멤버 조회, host 수정 (생성은 create_room, 삭제는 방과 함께)
-- ---------------------------------------------------------------------------
create policy "timers_select_member" on public.timers
  for select to authenticated
  using (public.is_member(room_id));

create policy "timers_update_host" on public.timers
  for update to authenticated
  using (public.is_host(room_id))
  with check (public.is_host(room_id));

-- ---------------------------------------------------------------------------
-- dm_messages: member → host 한 방향.
-- host는 방의 DM 전체, member는 본인이 보낸 것만 조회. 작성은 member만.
-- ---------------------------------------------------------------------------
create policy "dm_messages_select" on public.dm_messages
  for select to authenticated
  using (
    public.is_host(room_id)
    or (sender_id = auth.uid() and public.is_member(room_id))
  );

create policy "dm_messages_insert_member" on public.dm_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_member(room_id)
    and not public.is_host(room_id)
  );
