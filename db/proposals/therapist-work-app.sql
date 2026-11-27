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

-- The following functions are reviewed proposals, not authorized to execute.
-- The public wrappers intentionally expose only a JSON projection, never a
-- private table. The definer role and function privileges require isolated DB
-- review before this file can be applied.
create or replace function resort_private.work_action(p_token text, p_booking_id uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_therapist uuid;
  v_booking public.resort_bookings%rowtype;
  v_progress resort_private.work_progress%rowtype;
  v_stamp timestamptz := now();
begin
  if p_action not in ('start', 'finish') or p_booking_id is null or nullif(p_token, '') is null then
    raise exception '操作を確認してください' using errcode = '22023';
  end if;
  select s.therapist_id into v_therapist
    from public.resort_therapist_sessions s
    join public.resort_therapist_accounts a on a.therapist_id = s.therapist_id and a.is_active
    where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
      and s.expires_at > v_stamp;
  if v_therapist is null then
    raise exception '再ログインしてください' using errcode = '28000';
  end if;
  select * into v_booking from public.resort_bookings
    where id = p_booking_id and therapist_id = v_therapist
    for update;
  if not found or v_booking.status in ('cancelled', 'no_show') then
    raise exception '対象の予約を確認してください' using errcode = '42501';
  end if;
  select * into v_progress from resort_private.work_progress
    where booking_id = p_booking_id for update;
  if p_action = 'start' and v_progress.booking_id is null then
    insert into resort_private.work_progress(booking_id, therapist_id, store_id, started_at)
      values (p_booking_id, v_therapist, v_booking.store_id, v_stamp)
      returning * into v_progress;
    insert into resort_private.work_audit(booking_id, event_type, actor_therapist_id, new_state)
      values (p_booking_id, 'start', v_therapist, jsonb_build_object('started_at', v_stamp));
    insert into resort_private.work_notices(booking_id, store_id, kind)
      values (p_booking_id, v_booking.store_id, 'start') on conflict (booking_id, kind) do nothing;
  elsif p_action = 'finish' then
    if v_progress.booking_id is null then
      raise exception '開始報告が必要です' using errcode = '22023';
    end if;
    if v_progress.ended_at is null then
      update resort_private.work_progress set ended_at = v_stamp
        where booking_id = p_booking_id returning * into v_progress;
      insert into resort_private.work_audit(booking_id, event_type, actor_therapist_id, new_state)
        values (p_booking_id, 'finish', v_therapist, jsonb_build_object('ended_at', v_stamp));
      insert into resort_private.work_notices(booking_id, store_id, kind)
        values (p_booking_id, v_booking.store_id, 'finish') on conflict (booking_id, kind) do nothing;
    end if;
  end if;
  -- A repeated start/finish returns the original timestamps without producing
  -- another audit or notice. The booking status and financial columns are untouched.
  return jsonb_build_object('booking_id', p_booking_id,
    'started_at', v_progress.started_at, 'ended_at', v_progress.ended_at);
end $$;
revoke all on function resort_private.work_action(text, uuid, text) from public, anon, authenticated;
grant execute on function resort_private.work_action(text, uuid, text) to anon, authenticated;

create or replace function public.resort_work_action(p_token text, p_booking_id uuid, p_action text)
returns jsonb language sql security invoker set search_path = '' as $$
  select resort_private.work_action(p_token, p_booking_id, p_action)
$$;
revoke all on function public.resort_work_action(text, uuid, text) from public, anon, authenticated;
grant execute on function public.resort_work_action(text, uuid, text) to anon, authenticated;

create or replace function resort_private.room_availability(p_token text, p_day date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_therapist uuid;
  v_today date := (now() at time zone 'Asia/Tokyo')::date
    - case when (now() at time zone 'Asia/Tokyo')::time <= time '05:00' then 1 else 0 end;
  v_result jsonb;
begin
  select s.therapist_id into v_therapist
    from public.resort_therapist_sessions s
    join public.resort_therapist_accounts a on a.therapist_id = s.therapist_id and a.is_active
    where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
      and s.expires_at > now();
  if v_therapist is null then raise exception '再ログインしてください' using errcode = '28000'; end if;
  if p_day is null or p_day < v_today or p_day > v_today + 6 then
    raise exception '表示できる営業日を確認してください' using errcode = '22023';
  end if;

  with eligible as (
    select s.id, s.name, s.brand_code, r.room_number
      from public.resort_stores s
      cross join (values (1::smallint), (2::smallint)) r(room_number)
      join public.resort_therapists t on t.id = v_therapist
      where s.brand_code = any(t.brand_codes)
  ), slots as (
    select e.id, e.name, e.brand_code, e.room_number, g.n,
      (p_day::timestamp + interval '10 hours' + g.n * interval '30 minutes') as slot_start
      from eligible e cross join generate_series(0, 37) g(n)
  ), states as (
    select q.*,
      case
        when exists (
          select 1 from resort_private.room_blocks rb
          where rb.store_id = q.id and rb.room_number = q.room_number and rb.work_date = p_day
            and q.n >= rb.start_slot and q.n < rb.end_slot
        ) then 'blocked'
        when exists (
          select 1 from public.resort_bookings b
          where b.store_id = q.id and b.room_number = q.room_number
            and b.therapist_id = v_therapist
            and b.status not in ('cancelled', 'no_show')
            and (b.booking_date + b.start_time) < q.slot_start + interval '30 minutes'
            and (b.booking_date + b.start_time + b.duration_minutes * interval '1 minute') > q.slot_start
        ) or exists (
          select 1 from public.resort_schedules s
          join public.resort_schedule_rooms sr on sr.schedule_id = s.id
          where s.store_id = q.id and sr.room_number = q.room_number
            and s.therapist_id = v_therapist and s.is_published and s.work_date = p_day
            and (s.work_date + s.start_time + case when s.start_time < time '10:00' then interval '1 day' else interval '0 day' end) < q.slot_start + interval '30 minutes'
            and (s.work_date + s.end_time + case when s.end_time < time '10:00' then interval '1 day' else interval '0 day' end
              + case when s.end_time <= s.start_time and s.end_time >= time '10:00' then interval '1 day' else interval '0 day' end) > q.slot_start
        ) then 'mine'
        when exists (
          select 1 from public.resort_bookings b
          where b.store_id = q.id and b.room_number = q.room_number
            and b.status not in ('cancelled', 'no_show')
            and (b.booking_date + b.start_time) < q.slot_start + interval '30 minutes'
            and (b.booking_date + b.start_time + b.duration_minutes * interval '1 minute') > q.slot_start
        ) or exists (
          select 1 from public.resort_schedules s
          join public.resort_schedule_rooms sr on sr.schedule_id = s.id
          where s.store_id = q.id and sr.room_number = q.room_number
            and s.is_published and s.work_date = p_day
            and (s.work_date + s.start_time + case when s.start_time < time '10:00' then interval '1 day' else interval '0 day' end) < q.slot_start + interval '30 minutes'
            and (s.work_date + s.end_time + case when s.end_time < time '10:00' then interval '1 day' else interval '0 day' end
              + case when s.end_time <= s.start_time and s.end_time >= time '10:00' then interval '1 day' else interval '0 day' end) > q.slot_start
        ) then 'busy'
        else 'available'
      end as state
    from slots q
  )
  select coalesce(jsonb_agg(jsonb_build_object('business_date', p_day,
    'store_id', id, 'store_name', name, 'brand_code', brand_code,
    'room_number', room_number, 'slots', state_slots) order by id, room_number), '[]'::jsonb)
    into v_result from (
      select id, name, brand_code, room_number, jsonb_agg(state order by n) state_slots
      from states group by id, name, brand_code, room_number
    ) projected;
  return v_result;
end $$;
revoke all on function resort_private.room_availability(text, date) from public, anon, authenticated;
grant execute on function resort_private.room_availability(text, date) to anon, authenticated;
create or replace function public.resort_room_availability(p_token text, p_day date)
returns jsonb language sql security invoker set search_path = '' as $$
  select resort_private.room_availability(p_token, p_day)
$$;
revoke all on function public.resort_room_availability(text, date) from public, anon, authenticated;
grant execute on function public.resort_room_availability(text, date) to anon, authenticated;

-- An existing global admin must receive explicit grants for notifications and
-- corrections. No existing admin screens or legacy RLS policies are changed.
create table resort_private.staff_store_grants (
  admin_id uuid not null references auth.users(id),
  store_id smallint not null references public.resort_stores(id),
  can_correct boolean not null default false,
  can_receive boolean not null default true,
  primary key (admin_id, store_id)
);
alter table resort_private.staff_store_grants enable row level security;
revoke all on resort_private.staff_store_grants from public, anon, authenticated;

create table resort_private.notice_receipts (
  notice_id bigint not null references resort_private.work_notices(id),
  admin_id uuid not null references auth.users(id),
  read_at timestamptz,
  primary key (notice_id, admin_id)
);
alter table resort_private.notice_receipts enable row level security;
revoke all on resort_private.notice_receipts from public, anon, authenticated;

create table resort_private.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  therapist_id uuid references public.resort_therapists(id),
  endpoint_hash text not null unique,
  endpoint_ciphertext bytea not null,
  keys_ciphertext bytea not null,
  created_at timestamptz not null default now(),
  disabled_at timestamptz,
  check ((admin_id is null) <> (therapist_id is null))
);
alter table resort_private.push_subscriptions enable row level security;
revoke all on resort_private.push_subscriptions from public, anon, authenticated;

create table resort_private.push_attempts (
  id bigint generated always as identity primary key,
  notice_id bigint not null references resort_private.work_notices(id),
  subscription_id uuid not null references resort_private.push_subscriptions(id),
  attempted_at timestamptz not null default now(),
  status text not null check (status in ('queued', 'sent', 'failed', 'expired')),
  error_code text,
  unique (notice_id, subscription_id)
);
alter table resort_private.push_attempts enable row level security;
revoke all on resort_private.push_attempts from public, anon, authenticated;

-- The server-side dispatcher will resolve notice recipients by store grants,
-- never by brand alone. Subscription keys and VAPID private key must live in a
-- server-only secret store, not SQL response, browser bundle or Git history.
-- No trigger or dispatcher is installed by this proposal; no push can be sent.

create or replace function resort_private.correct_work(
  p_booking_id uuid, p_started_at timestamptz, p_ended_at timestamptz, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_store smallint;
  v_old resort_private.work_progress%rowtype;
  v_new resort_private.work_progress%rowtype;
begin
  if auth.uid() is null or p_booking_id is null or length(trim(coalesce(p_reason, ''))) not between 3 and 500
    or p_started_at is null or (p_ended_at is not null and p_ended_at < p_started_at) then
    raise exception '訂正内容を確認してください' using errcode = '22023';
  end if;
  select b.store_id into v_store from public.resort_bookings b where b.id = p_booking_id for update;
  if not found or not exists (
    select 1 from public.resort_admins a
    join resort_private.staff_store_grants g on g.admin_id = a.user_id
    where a.user_id = auth.uid() and g.store_id = v_store and g.can_correct
  ) then raise exception '訂正権限がありません' using errcode = '42501'; end if;
  select * into v_old from resort_private.work_progress where booking_id = p_booking_id for update;
  if not found then raise exception '業務報告がありません' using errcode = '22023'; end if;
  update resort_private.work_progress set started_at = p_started_at, ended_at = p_ended_at
    where booking_id = p_booking_id returning * into v_new;
  insert into resort_private.work_audit
    (booking_id, event_type, actor_admin_id, previous_state, new_state, reason)
    values (p_booking_id, 'staff_correction', auth.uid(),
      jsonb_build_object('started_at', v_old.started_at, 'ended_at', v_old.ended_at),
      jsonb_build_object('started_at', v_new.started_at, 'ended_at', v_new.ended_at), trim(p_reason));
  return jsonb_build_object('booking_id', p_booking_id,
    'started_at', v_new.started_at, 'ended_at', v_new.ended_at);
end $$;
revoke all on function resort_private.correct_work(uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function resort_private.correct_work(uuid, timestamptz, timestamptz, text) to authenticated;
create or replace function public.resort_correct_work(
  p_booking_id uuid, p_started_at timestamptz, p_ended_at timestamptz, p_reason text)
returns jsonb language sql security invoker set search_path = '' as $$
  select resort_private.correct_work(p_booking_id, p_started_at, p_ended_at, p_reason)
$$;
revoke all on function public.resort_correct_work(uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.resort_correct_work(uuid, timestamptz, timestamptz, text) to authenticated;
