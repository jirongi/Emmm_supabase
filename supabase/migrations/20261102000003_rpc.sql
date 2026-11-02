-- 4단계: RPC 함수
-- 테이블 정책만으로는 안 되는 동작(트랜잭션, 비밀번호 검사, 1인 1표)을 함수로 만든다.
-- 프론트에서는 supabase.rpc('함수이름', { 인자 })로 부른다.
-- 에러는 error.message에 아래 코드 문자열로 전달된다:
--   login_required, room_not_found, room_closed, wrong_password, not_host,
--   vote_not_found, vote_closed, invalid_option

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- create_room: 방 + host 멤버 + 타이머 + (선택) 비밀번호를 한 번에 만든다
-- ---------------------------------------------------------------------------
create function public.create_room(p_name text, p_password text default null)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room  public.rooms;
  v_code  text;
  -- 헷갈리는 문자(0, O, 1, I) 제외
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then
    raise exception 'login_required';
  end if;

  loop
    v_code := '';
    for i in 1..10 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    begin
      insert into public.rooms (name, code, created_by)
      values (p_name, v_code, auth.uid())
      returning * into v_room;
      exit;
    exception when unique_violation then
      -- 코드가 겹치면 다시 생성 (서브 트랜잭션이라 재시도가 실제로 동작함)
    end;
  end loop;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, auth.uid(), 'host');

  insert into public.timers (room_id) values (v_room.id);

  if nullif(p_password, '') is not null then
    insert into public.room_passwords (room_id, password_hash)
    values (v_room.id, extensions.crypt(p_password, extensions.gen_salt('bf')));
  end if;

  return v_room;
end;
$$;

-- ---------------------------------------------------------------------------
-- find_room: 참여 코드로 방 찾기. 멤버가 아니어도 이 네 값만 알 수 있다.
-- ---------------------------------------------------------------------------
create function public.find_room(p_code text)
returns table (room_id bigint, name text, state text, has_password boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'login_required';
  end if;

  return query
    select r.id, r.name, r.state,
           exists (select 1 from public.room_passwords p where p.room_id = r.id)
    from public.rooms r
    where r.code = upper(trim(p_code));

  if not found then
    raise exception 'room_not_found';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- join_room: member로 참여. 이미 멤버면 아무 것도 하지 않는다.
-- ---------------------------------------------------------------------------
create function public.join_room(p_room_id bigint, p_password text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state text;
  v_hash  text;
begin
  if auth.uid() is null then
    raise exception 'login_required';
  end if;

  select state into v_state from public.rooms where id = p_room_id;
  if not found then
    raise exception 'room_not_found';
  end if;

  if exists (select 1 from public.room_members where room_id = p_room_id and user_id = auth.uid()) then
    return;
  end if;

  if v_state = 'complete' then
    raise exception 'room_closed';
  end if;

  select password_hash into v_hash from public.room_passwords where room_id = p_room_id;
  if v_hash is not null
     and (p_password is null or extensions.crypt(p_password, v_hash) <> v_hash) then
    raise exception 'wrong_password';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (p_room_id, auth.uid(), 'member');
end;
$$;

-- ---------------------------------------------------------------------------
-- set_room_password: host만. null 또는 빈 문자열이면 비밀번호 해제.
-- ---------------------------------------------------------------------------
create function public.set_room_password(p_room_id bigint, p_password text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_host(p_room_id) then
    raise exception 'not_host';
  end if;

  if nullif(p_password, '') is null then
    delete from public.room_passwords where room_id = p_room_id;
  else
    insert into public.room_passwords (room_id, password_hash)
    values (p_room_id, extensions.crypt(p_password, extensions.gen_salt('bf')))
    on conflict (room_id) do update set password_hash = excluded.password_hash;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- add_agenda: host만. 순번은 방 행을 잠근 뒤 max + 1로 매긴다 (동시 추가 시 중복 방지).
-- ---------------------------------------------------------------------------
create function public.add_agenda(p_room_id bigint, p_name text)
returns public.agendas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agenda public.agendas;
begin
  if not public.is_host(p_room_id) then
    raise exception 'not_host';
  end if;

  perform 1 from public.rooms where id = p_room_id for update;

  insert into public.agendas (room_id, name, sequence)
  values (
    p_room_id,
    p_name,
    coalesce((select max(sequence) from public.agendas where room_id = p_room_id), 0) + 1
  )
  returning * into v_agenda;

  return v_agenda;
end;
$$;

-- ---------------------------------------------------------------------------
-- cast_vote: 투표하거나 고른 옵션을 바꾼다 (1인 1표).
-- ---------------------------------------------------------------------------
create function public.cast_vote(p_vote_id bigint, p_option_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'login_required';
  end if;

  select v.status into v_status
  from public.votes v
  where v.id = p_vote_id and public.is_member(public.vote_room(v.id));
  if not found then
    raise exception 'vote_not_found';
  end if;

  if v_status <> 'running' then
    raise exception 'vote_closed';
  end if;

  if not exists (select 1 from public.vote_options where id = p_option_id and vote_id = p_vote_id) then
    raise exception 'invalid_option';
  end if;

  insert into public.vote_selections (vote_id, user_id, option_id)
  values (p_vote_id, auth.uid(), p_option_id)
  on conflict (vote_id, user_id) do update
    set option_id = excluded.option_id, created_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- 실행 권한: 로그인한 사용자만
-- ---------------------------------------------------------------------------
revoke execute on function
  public.create_room(text, text),
  public.find_room(text),
  public.join_room(bigint, text),
  public.set_room_password(bigint, text),
  public.add_agenda(bigint, text),
  public.cast_vote(bigint, bigint)
from public, anon;

grant execute on function
  public.create_room(text, text),
  public.find_room(text),
  public.join_room(bigint, text),
  public.set_room_password(bigint, text),
  public.add_agenda(bigint, text),
  public.cast_vote(bigint, bigint)
to authenticated;
