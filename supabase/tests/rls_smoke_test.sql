-- 권한(RLS)·RPC 스모크 테스트
-- 테스트 계정 2개(A = host, B = member)로 방 생성부터 투표·DM·나가기까지 실행하고,
-- 각 단계가 기대한 결과인지 마지막 표(pass 열)로 보여준다.
--
-- 준비 (한 번만):
--   Authentication → Users → Add user → Create new user 로 아래 두 계정을 만든다.
--   (Auto Confirm User 체크, 비밀번호는 아무거나)
--     test-a@emmm.test
--     test-b@emmm.test
--
-- 실행: SQL Editor에 이 파일 전체를 붙여 넣고 Run. 몇 번을 실행해도 된다.
-- 테스트로 만든 방은 마지막에 삭제한다 (테스트 계정은 남는다).

-- ---------------------------------------------------------------------------
-- 준비: 계정 id, 결과 표, 사용자 흉내 함수
-- ---------------------------------------------------------------------------
select set_config('test.a', coalesce((select id::text from auth.users where email = 'test-a@emmm.test'), ''), false),
       set_config('test.b', coalesce((select id::text from auth.users where email = 'test-b@emmm.test'), ''), false);

do $$
begin
  if current_setting('test.a') = '' or current_setting('test.b') = '' then
    raise exception '테스트 계정이 없습니다. test-a@emmm.test, test-b@emmm.test를 먼저 만드세요.';
  end if;
end $$;

drop table if exists pg_temp.r;
create temp table r (
  n        serial,
  step     text,
  expected text,
  actual   text
);

-- uid로 로그인한 사용자처럼(role authenticated, RLS 적용) 쿼리 한 개를 실행하고 결과 한 값을 돌려준다.
-- 에러가 나면 'ERROR: 메시지'를 돌려준다.
create or replace function pg_temp.as_user(uid text, q text)
returns text
language plpgsql
as $$
declare
  res text;
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  execute q into res;
  execute 'reset role';
  return coalesce(nullif(res, ''), 'ok');  -- void 함수는 ''를 돌려주므로 'ok'로
exception when others then
  return 'ERROR: ' || sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- 방 만들기 · 참여
-- ---------------------------------------------------------------------------
insert into r (step, expected, actual) values
  ('A가 비밀번호 방 생성', '숫자(방 id)',
   pg_temp.as_user(current_setting('test.a'),
     $q$ select (public.create_room('RLS 테스트 방', '1234')).id::text $q$));

select set_config('test.room', (select actual from r where n = 1), false),
       set_config('test.code', (select code from public.rooms where id::text = (select actual from r where n = 1)), false);

insert into r (step, expected, actual) values
  ('B는 참여 전 방을 못 봄', '0',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select count(*)::text from public.rooms where id = current_setting('test.room')::bigint $q$));

insert into r (step, expected, actual) values
  ('B가 코드로 방 찾기', 'true',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select has_password::text from public.find_room(lower(current_setting('test.code'))) $q$));

insert into r (step, expected, actual) values
  ('없는 코드', 'ERROR: room_not_found',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select room_id::text from public.find_room('NOPE000000') $q$));

insert into r (step, expected, actual) values
  ('B가 틀린 비밀번호로 참여', 'ERROR: wrong_password',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.join_room(current_setting('test.room')::bigint, '9999')::text $q$));

insert into r (step, expected, actual) values
  ('B가 맞는 비밀번호로 참여', 'ok',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.join_room(current_setting('test.room')::bigint, '1234')::text $q$));

insert into r (step, expected, actual) values
  ('B는 참여 후 방이 보임', '1',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select count(*)::text from public.rooms where id = current_setting('test.room')::bigint $q$));

insert into r (step, expected, actual) values
  ('B는 A의 프로필이 보임 (같은 방)', '1',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select count(*)::text from public.profiles where id = current_setting('test.a')::uuid $q$));

-- ---------------------------------------------------------------------------
-- 방 수정 권한
-- ---------------------------------------------------------------------------
insert into r (step, expected, actual) values
  ('B(member)가 방 이름 수정 → 0건', '0',
   pg_temp.as_user(current_setting('test.b'),
     $q$ with u as (update public.rooms set name = '해킹' where id = current_setting('test.room')::bigint returning 1)
         select count(*)::text from u $q$));

insert into r (step, expected, actual) values
  ('B(member)가 방 삭제 → 0건', '0',
   pg_temp.as_user(current_setting('test.b'),
     $q$ with d as (delete from public.rooms where id = current_setting('test.room')::bigint returning 1)
         select count(*)::text from d $q$));

insert into r (step, expected, actual) values
  ('A(host)도 방 코드는 못 바꿈', 'ERROR: immutable_column',
   pg_temp.as_user(current_setting('test.a'),
     $q$ with u as (update public.rooms set code = 'ZZZZZZZZZZ' where id = current_setting('test.room')::bigint returning 1)
         select count(*)::text from u $q$));

insert into r (step, expected, actual) values
  ('B가 비밀번호 변경', 'ERROR: not_host',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.set_room_password(current_setting('test.room')::bigint, 'x')::text $q$));

insert into r (step, expected, actual) values
  ('누구도 비밀번호 해시를 못 읽음', 'ERROR: permission denied',
   pg_temp.as_user(current_setting('test.a'),
     $q$ select count(*)::text from public.room_passwords $q$));

-- ---------------------------------------------------------------------------
-- 안건 · 댓글 · 타이머
-- ---------------------------------------------------------------------------
insert into r (step, expected, actual) values
  ('B(member)가 안건 추가', 'ERROR: not_host',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select (public.add_agenda(current_setting('test.room')::bigint, '안건')).id::text $q$));

insert into r (step, expected, actual) values
  ('A(host)가 안건 추가', '숫자(안건 id)',
   pg_temp.as_user(current_setting('test.a'),
     $q$ select (public.add_agenda(current_setting('test.room')::bigint, '첫 안건')).id::text $q$));

select set_config('test.agenda', (select actual from r where step = 'A(host)가 안건 추가'), false);

insert into r (step, expected, actual) values
  ('두 번째 안건 순번은 2', '2',
   pg_temp.as_user(current_setting('test.a'),
     $q$ select (public.add_agenda(current_setting('test.room')::bigint, '둘째 안건')).sequence::text $q$));

insert into r (step, expected, actual) values
  ('B가 안건 목록 조회', '2',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select count(*)::text from public.agendas where room_id = current_setting('test.room')::bigint $q$));

insert into r (step, expected, actual) values
  ('B가 댓글 작성', '1',
   pg_temp.as_user(current_setting('test.b'),
     $q$ with i as (insert into public.comments (agenda_id, content) values (current_setting('test.agenda')::bigint, '좋아요') returning 1)
         select count(*)::text from i $q$));

insert into r (step, expected, actual) values
  ('B(member)가 타이머 수정 → 0건', '0',
   pg_temp.as_user(current_setting('test.b'),
     $q$ with u as (update public.timers set remaining_sec = 60 where room_id = current_setting('test.room')::bigint returning 1)
         select count(*)::text from u $q$));

insert into r (step, expected, actual) values
  ('A(host)가 타이머 수정 → 1건', '1',
   pg_temp.as_user(current_setting('test.a'),
     $q$ with u as (update public.timers set remaining_sec = 60 where room_id = current_setting('test.room')::bigint returning 1)
         select count(*)::text from u $q$));

-- ---------------------------------------------------------------------------
-- 투표
-- ---------------------------------------------------------------------------
insert into r (step, expected, actual) values
  ('A(host)가 투표 생성', '숫자(투표 id)',
   pg_temp.as_user(current_setting('test.a'),
     $q$ insert into public.votes (agenda_id, title) values (current_setting('test.agenda')::bigint, '점심 메뉴') returning id::text $q$));

select set_config('test.vote', (select actual from r where step = 'A(host)가 투표 생성'), false);

insert into r (step, expected, actual) values
  ('A(host)가 옵션 추가', '숫자(옵션 id)',
   pg_temp.as_user(current_setting('test.a'),
     $q$ insert into public.vote_options (vote_id, content) values (current_setting('test.vote')::bigint, '국밥') returning id::text $q$));

select set_config('test.option', (select actual from r where step = 'A(host)가 옵션 추가'), false);

insert into r (step, expected, actual) values
  ('B(member)가 옵션 추가', 'ERROR: new row violates row-level security',
   pg_temp.as_user(current_setting('test.b'),
     $q$ insert into public.vote_options (vote_id, content) values (current_setting('test.vote')::bigint, '피자') returning id::text $q$));

insert into r (step, expected, actual) values
  ('B가 투표', 'ok',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.cast_vote(current_setting('test.vote')::bigint, current_setting('test.option')::bigint)::text $q$));

insert into r (step, expected, actual) values
  ('B가 같은 투표를 한 번 더 (표 변경)', 'ok',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.cast_vote(current_setting('test.vote')::bigint, current_setting('test.option')::bigint)::text $q$));

insert into r (step, expected, actual) values
  ('득표 수는 여전히 1', '1',
   pg_temp.as_user(current_setting('test.a'),
     $q$ select votes::text from public.vote_results where option_id = current_setting('test.option')::bigint $q$));

insert into r (step, expected, actual) values
  ('다른 투표의 옵션 id로 투표', 'ERROR: invalid_option',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.cast_vote(current_setting('test.vote')::bigint, -1)::text $q$));

insert into r (step, expected, actual) values
  ('A(host)가 투표 마감', '1',
   pg_temp.as_user(current_setting('test.a'),
     $q$ with u as (update public.votes set status = 'complete' where id = current_setting('test.vote')::bigint returning 1)
         select count(*)::text from u $q$));

insert into r (step, expected, actual) values
  ('마감된 투표에 투표', 'ERROR: vote_closed',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select public.cast_vote(current_setting('test.vote')::bigint, current_setting('test.option')::bigint)::text $q$));

-- ---------------------------------------------------------------------------
-- DM (member → host)
-- ---------------------------------------------------------------------------
insert into r (step, expected, actual) values
  ('B(member)가 DM 전송', '1',
   pg_temp.as_user(current_setting('test.b'),
     $q$ with i as (insert into public.dm_messages (room_id, content) values (current_setting('test.room')::bigint, '질문 있어요') returning 1)
         select count(*)::text from i $q$));

insert into r (step, expected, actual) values
  ('A(host)가 DM 조회', '1',
   pg_temp.as_user(current_setting('test.a'),
     $q$ select count(*)::text from public.dm_messages where room_id = current_setting('test.room')::bigint $q$));

insert into r (step, expected, actual) values
  ('A(host)는 DM 전송 불가', 'ERROR: new row violates row-level security',
   pg_temp.as_user(current_setting('test.a'),
     $q$ with i as (insert into public.dm_messages (room_id, content) values (current_setting('test.room')::bigint, '답장') returning 1)
         select count(*)::text from i $q$));

-- ---------------------------------------------------------------------------
-- 나가기
-- ---------------------------------------------------------------------------
insert into r (step, expected, actual) values
  ('B가 방 나가기', '1',
   pg_temp.as_user(current_setting('test.b'),
     $q$ with d as (delete from public.room_members where room_id = current_setting('test.room')::bigint and user_id = auth.uid() returning 1)
         select count(*)::text from d $q$));

insert into r (step, expected, actual) values
  ('B는 나간 뒤 방·안건을 못 봄', '0',
   pg_temp.as_user(current_setting('test.b'),
     $q$ select ((select count(*) from public.rooms where id = current_setting('test.room')::bigint)
               + (select count(*) from public.agendas where room_id = current_setting('test.room')::bigint))::text $q$));

insert into r (step, expected, actual) values
  ('A(host)는 나가기로 못 빠짐 → 0건', '0',
   pg_temp.as_user(current_setting('test.a'),
     $q$ with d as (delete from public.room_members where room_id = current_setting('test.room')::bigint and user_id = auth.uid() returning 1)
         select count(*)::text from d $q$));

-- ---------------------------------------------------------------------------
-- 정리 후 결과
-- ---------------------------------------------------------------------------
delete from public.rooms where id::text = current_setting('test.room', true);

select n,
       step,
       expected,
       actual,
       case
         when expected like '숫자%' then actual ~ '^[0-9]+$'
         else actual like expected || '%'
       end as pass
from r
order by n;
