create table public.resort_interview_questionnaires (
  interview_id uuid primary key references public.resort_interviews(id) on delete cascade,
  desired_stage_name text not null default '' check (length(desired_stage_name) <= 500),
  age integer check (age between 1 and 120),
  height_cm numeric(5,1) check (height_cm > 0 and height_cm <= 300),
  bust_cm integer check (bust_cm > 0 and bust_cm <= 300),
  waist_cm integer check (waist_cm > 0 and waist_cm <= 300),
  hip_cm integer check (hip_cm > 0 and hip_cm <= 300),
  cup_size text not null default '' check (length(cup_size) <= 30),
  face_visibility text check (face_visibility in ('可能', '不可')),
  profile_preferences text not null default '' check (length(profile_preferences) <= 3000),
  micro text check (micro in ('可能', '不可')),
  video text check (video in ('可能', '不可')),
  panel_image_path text,
  updated_at timestamptz not null default now()
);
alter table public.resort_interview_questionnaires enable row level security;
revoke all on public.resort_interview_questionnaires from anon;
grant select, insert, update on public.resort_interview_questionnaires to authenticated;
create policy "resort admins read interview questionnaires" on public.resort_interview_questionnaires
  for select to authenticated using (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
create policy "resort admins add interview questionnaires" on public.resort_interview_questionnaires
  for insert to authenticated with check (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
create policy "resort admins edit interview questionnaires" on public.resort_interview_questionnaires
  for update to authenticated
  using (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
