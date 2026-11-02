-- 7단계 보조: 타이머 시작 시각을 서버 시각으로 기록한다.
-- 클라이언트마다 시계가 달라도 남은 시간이 같게 보이도록, started_at은 클라이언트가 보내지 않고 트리거가 채운다.
--   play로 바뀌거나 play 중에 남은 시간이 바뀌면 started_at = now()
--   stop이면 started_at = null

create function public.timers_set_started_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'play' then
    if old.status is distinct from 'play' or new.remaining_sec is distinct from old.remaining_sec then
      new.started_at := now();
    else
      new.started_at := old.started_at;
    end if;
  else
    new.started_at := null;
  end if;
  return new;
end;
$$;

create trigger timers_set_started_at
  before update on public.timers
  for each row execute function public.timers_set_started_at();
