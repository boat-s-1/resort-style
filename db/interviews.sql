-- Shared interviews. Applicant documents are never served from a public bucket.
create table public.resort_interviews (
  id uuid primary key default gen_random_uuid(),
  interview_date date not null,
  interviewer text not null check (length(btrim(interviewer)) between 1 and 120),
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  age integer not null check (age between 1 and 120),
  residence text not null check (length(btrim(residence)) between 1 and 300),
  photo_path text,
  identity_path text,
  created_at timestamptz not null default now()
);
create index resort_interviews_by_date on public.resort_interviews (interview_date desc, created_at desc);
alter table public.resort_interviews enable row level security;
revoke all on public.resort_interviews from anon;
grant select, insert, update on public.resort_interviews to authenticated;
create policy "resort admins read interviews" on public.resort_interviews
  for select to authenticated using (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
create policy "resort admins add interviews" on public.resort_interviews
  for insert to authenticated with check (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
create policy "resort admins edit interviews" on public.resort_interviews
  for update to authenticated
  using (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resort-interview-documents', 'resort-interview-documents', false, 10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']);
create policy "resort admins read interview documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'resort-interview-documents' and exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
create policy "resort admins upload interview documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resort-interview-documents' and exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
create policy "resort admins remove interview documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resort-interview-documents' and exists (select 1 from public.resort_admins a where a.user_id = (select auth.uid())));
