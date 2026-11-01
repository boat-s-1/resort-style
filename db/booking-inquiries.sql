-- Unconverted inquiries are separate from reservations so they do not occupy rooms or generate payouts.
create table public.resort_booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  store_id smallint not null references public.resort_stores(id) on delete restrict,
  customer_id uuid references public.resort_customers(id) on delete set null,
  therapist_id uuid references public.resort_therapists(id) on delete set null,
  inquiry_date date not null,
  reason text not null check (length(btrim(reason)) between 1 and 500),
  notes text not null default '' check (length(notes) <= 2000),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resort_booking_inquiries_store_date_idx on public.resort_booking_inquiries (store_id,inquiry_date desc);
alter table public.resort_booking_inquiries enable row level security;
revoke all on public.resort_booking_inquiries from public,anon;
grant select,insert,update,delete on public.resort_booking_inquiries to authenticated;
create policy "Resort admins manage inquiries" on public.resort_booking_inquiries
 for all to authenticated
 using (exists(select 1 from public.resort_admins where user_id=(select auth.uid())))
 with check (exists(select 1 from public.resort_admins where user_id=(select auth.uid())));
