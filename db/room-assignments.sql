create table if not exists public.resort_schedule_rooms (
  schedule_id uuid primary key references public.resort_schedules(id) on delete cascade,
  room_number smallint not null check (room_number between 1 and 2)
);
alter table public.resort_schedule_rooms enable row level security;
revoke all on public.resort_schedule_rooms from anon;
grant select, insert, update, delete on public.resort_schedule_rooms to authenticated;
create policy "resort admins manage schedule rooms"
on public.resort_schedule_rooms for all to authenticated
using (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));