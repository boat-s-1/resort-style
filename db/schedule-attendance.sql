create table public.resort_schedule_attendance (
  schedule_id uuid primary key references public.resort_schedules(id) on delete cascade,
  status text not null check (status in ('worked','absent')),
  actual_start_time time,
  actual_end_time time,
  note text not null default '' check (char_length(note)<=500),
  updated_at timestamptz not null default now(),
  constraint resort_schedule_attendance_times_check check (
    (status='absent' and actual_start_time is null and actual_end_time is null)
    or (status='worked' and actual_start_time is not null and actual_end_time is not null and actual_start_time<>actual_end_time)
  )
);
alter table public.resort_schedule_attendance enable row level security;
create policy "resort admins manage attendance" on public.resort_schedule_attendance
  for all to authenticated
  using (exists (select 1 from public.resort_admins a where a.user_id=(select auth.uid())))
  with check (exists (select 1 from public.resort_admins a where a.user_id=(select auth.uid())));
revoke all on public.resort_schedule_attendance from public, anon;
grant select, insert, update, delete on public.resort_schedule_attendance to authenticated;
