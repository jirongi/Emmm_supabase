-- 2단계: DB 스키마
-- Spring 엔티티(Domuksa_Backend/src/main/java/org/example/emmm/domain)를 Postgres 테이블로 옮긴다.
-- 바뀐 점: AgendaConfig는 agendas에 합침, 비밀번호는 room_passwords에 해시로 저장,
--          selectCount 대신 vote_results 뷰, 소프트 삭제 대신 on delete cascade.
-- 모든 테이블에 RLS를 켠다. 정책은 3단계에서 추가하므로 그 전까지 클라이언트는 아무것도 읽고 쓸 수 없다.

-- ---------------------------------------------------------------------------
-- 사용자 프로필 (auth.users와 1:1, 가입 시 트리거로 생성)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name',
             split_part(new.email, '@', 1),
             '이름 없음'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 방
-- ---------------------------------------------------------------------------
create table public.rooms (
  id                bigint generated always as identity primary key,
  name              text not null check (char_length(name) between 1 and 50),
  code              text not null unique check (char_length(code) = 10),
  state             text not null default 'running' check (state in ('running', 'complete')),
  current_agenda_id bigint,  -- FK는 agendas 생성 후 추가
  created_by        uuid not null references public.profiles (id),
  created_at        timestamptz not null default now()
);

-- 비밀번호 해시. 정책을 만들지 않으므로 클라이언트는 접근할 수 없고 RPC(security definer)만 쓴다.
create table public.room_passwords (
  room_id       bigint primary key references public.rooms (id) on delete cascade,
  password_hash text not null
);

create table public.room_members (
  room_id   bigint not null references public.rooms (id) on delete cascade,
  user_id   uuid   not null references public.profiles (id) on delete cascade,
  role      text   not null check (role in ('host', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index room_members_user_id_idx on public.room_members (user_id);

-- ---------------------------------------------------------------------------
-- 안건 (기존 Agenda + AgendaConfig)
-- ---------------------------------------------------------------------------
create table public.agendas (
  id                 bigint generated always as identity primary key,
  room_id            bigint not null references public.rooms (id) on delete cascade,
  name               text   not null check (char_length(name) between 1 and 100),
  sequence           int    not null check (sequence > 0),
  vote_enabled       boolean not null default false,
  comment_enabled    boolean not null default false,
  file_enabled       boolean not null default false,
  ai_summary_enabled boolean not null default false,
  created_at         timestamptz not null default now(),
  -- 순서를 바꿀 때 잠깐 겹칠 수 있으므로 커밋 시점에 검사
  constraint agendas_room_sequence_key unique (room_id, sequence) deferrable initially deferred
);

alter table public.rooms
  add constraint rooms_current_agenda_id_fkey
  foreign key (current_agenda_id) references public.agendas (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 댓글 · 파일
-- ---------------------------------------------------------------------------
create table public.comments (
  id         bigint generated always as identity primary key,
  agenda_id  bigint not null references public.agendas (id) on delete cascade,
  user_id    uuid   not null default auth.uid() references public.profiles (id) on delete cascade,
  content    text   not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_agenda_id_idx on public.comments (agenda_id);

create table public.files (
  id           bigint generated always as identity primary key,
  agenda_id    bigint not null references public.agendas (id) on delete cascade,
  uploaded_by  uuid   not null default auth.uid() references public.profiles (id) on delete cascade,
  file_name    text   not null,
  storage_path text   not null unique,  -- '{room_id}/{agenda_id}/{uuid}.{ext}'
  is_pdf       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index files_agenda_id_idx on public.files (agenda_id);

-- ---------------------------------------------------------------------------
-- 투표
-- ---------------------------------------------------------------------------
create table public.votes (
  id         bigint generated always as identity primary key,
  agenda_id  bigint not null references public.agendas (id) on delete cascade,
  title      text   not null check (char_length(title) between 1 and 100),
  status     text   not null default 'running' check (status in ('running', 'complete')),
  created_at timestamptz not null default now()
);
create index votes_agenda_id_idx on public.votes (agenda_id);

create table public.vote_options (
  id      bigint generated always as identity primary key,
  vote_id bigint not null references public.votes (id) on delete cascade,
  content text   not null check (char_length(content) between 1 and 100),
  unique (id, vote_id)  -- vote_selections의 복합 FK용
);
create index vote_options_vote_id_idx on public.vote_options (vote_id);

-- 한 사람이 투표당 한 표. 선택한 옵션이 그 투표의 옵션인지는 복합 FK가 보장한다.
create table public.vote_selections (
  vote_id    bigint not null references public.votes (id) on delete cascade,
  user_id    uuid   not null references public.profiles (id) on delete cascade,
  option_id  bigint not null,
  created_at timestamptz not null default now(),
  primary key (vote_id, user_id),
  foreign key (option_id, vote_id) references public.vote_options (id, vote_id) on delete cascade
);
create index vote_selections_option_id_idx on public.vote_selections (option_id);

-- 옵션별 득표 수 (기존 selectCount 대체). security_invoker라 조회하는 사람의 RLS가 적용된다.
create view public.vote_results
with (security_invoker = on) as
select o.vote_id,
       o.id      as option_id,
       o.content,
       count(s.user_id)::int as votes
from public.vote_options o
left join public.vote_selections s on s.option_id = o.id
group by o.id;

-- ---------------------------------------------------------------------------
-- AI 요약 · 타이머 · DM
-- ---------------------------------------------------------------------------
create table public.ai_summaries (
  agenda_id    bigint primary key references public.agendas (id) on delete cascade,
  title        text not null,
  summary_text text not null,  -- markdown
  updated_at   timestamptz not null default now()
);

-- 남은 시간 = play일 때 remaining_sec - (now - started_at), stop일 때 remaining_sec
create table public.timers (
  room_id       bigint primary key references public.rooms (id) on delete cascade,
  status        text not null default 'stop' check (status in ('stop', 'play')),
  remaining_sec int  not null default 0 check (remaining_sec >= 0),
  started_at    timestamptz,
  check (status = 'stop' or started_at is not null)
);

create table public.dm_messages (
  id         bigint generated always as identity primary key,
  room_id    bigint not null references public.rooms (id) on delete cascade,
  sender_id  uuid   not null default auth.uid() references public.profiles (id) on delete cascade,
  content    text   not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index dm_messages_room_id_idx on public.dm_messages (room_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS: 전부 켜고, 정책은 3단계에서 추가
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.rooms           enable row level security;
alter table public.room_passwords  enable row level security;
alter table public.room_members    enable row level security;
alter table public.agendas         enable row level security;
alter table public.comments        enable row level security;
alter table public.files           enable row level security;
alter table public.votes           enable row level security;
alter table public.vote_options    enable row level security;
alter table public.vote_selections enable row level security;
alter table public.ai_summaries    enable row level security;
alter table public.timers          enable row level security;
alter table public.dm_messages     enable row level security;

-- 비밀번호 해시 테이블은 API 역할에서 권한 자체를 뺀다
revoke all on public.room_passwords from anon, authenticated;
