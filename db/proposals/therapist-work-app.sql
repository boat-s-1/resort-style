-- DESIGN DRAFT ONLY. No database has been migrated with this file.
-- Review functions, store permissions, rollback and isolated integration tests
-- before approving application to any database.

create table resort_private.work_progress (
  booking_id uuid primary key references public.resort_bookings(id) on delete restrict,
  therapist_id uuid not null references public.resort_therapists(id),
  store_id smallint not null references public.resort_stores(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  check (ended_at is null or ended_at >= started_at)
);
alter table resort_private.work_progress enable row level security;
revoke all on resort_private.work_progress from public, anon, authenticated;

create table resort_private.work_audit (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.resort_bookings(id) on delete restrict,
  event_type text not null check (event_type in ('start','finish','staff_correction')),
  recorded_at timestamptz not null default now(),
  actor_therapist_id uuid references public.resort_therapists(id),
  actor_admin_id uuid references auth.users(id),
  previous_state jsonb,
  new_state jsonb not null,
  reason text,
  check (event_type <> 'staff_correction' or
    (actor_admin_id is not null and length(trim(reason)) between 3 and 500))
);
alter table resort_private.work_audit enable row level security;
revoke all on resort_private.work_audit from public, anon, authenticated;

create table resort_private.room_blocks (
  id uuid primary key default gen_random_uuid(),
  store_id smallint not null references public.resort_stores(id),
  room_number smallint not null check (room_number between 1 and 2),
  work_date date not null,
  start_slot smallint not null check (start_slot between 0 and 37),
  end_slot smallint not null check (end_slot between 1 and 38),
  kind text not null check (kind in ('cleaning','closed')),
  check (start_slot < end_slot)
);
alter table resort_private.room_blocks enable row level security;
revoke all on resort_private.room_blocks from public, anon, authenticated;

create table resort_private.work_notices (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.resort_bookings(id) on delete restrict,
  store_id smallint not null references public.resort_stores(id),
  kind text not null check (kind in ('start','finish')),
  created_at timestamptz not null default now(),
  unique (booking_id, kind)
);
alter table resort_private.work_notices enable row level security;
revoke all on resort_private.work_notices from public, anon, authenticated;

-- More tables and functions remain before this can become an executable migration:
-- staff-store grants, per-recipient read receipts, extension/shift/message events,
-- VAPID subscriptions and dispatch failure logs, secure status/room RPCs,
-- transactional room conflict checking and an immutable correction procedure.
