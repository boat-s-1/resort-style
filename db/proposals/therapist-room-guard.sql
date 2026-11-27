-- Candidate phase B, after therapist-work-app.sql. Do not apply to production.
-- Every writer uses the same lock and conflict check; direct PostgREST writes
-- cannot bypass these triggers. Existing overlaps require preflight review.
begin;
create or replace function resort_private.assert_room_free(
  p_store smallint, p_room smallint, p_begin timestamp, p_end timestamp,
  p_therapist uuid, p_source text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (p_begin - interval '10 hours')::date;
begin
  if p_store is null or p_room not between 1 and 2 or p_begin is null or p_end is null
    or p_begin < v_day + interval '10 hours'
    or p_end > v_day + interval '1 day 5 hours' or p_end <= p_begin then
    raise exception '営業時間内のルーム時刻を指定してください' using errcode='22023';
  end if;
  -- A hash collision can cause additional serialization, not missed exclusion.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(
    'resort-room:' || p_store || ':' || p_room || ':' || v_day)::bigint);
  if exists (
    select 1 from public.resort_bookings b
    where b.store_id=p_store and b.room_number=p_room
      and b.status not in ('cancelled','no_show')
      and (p_source<>'booking' or b.id<>p_id)
      and (p_source='block' or b.therapist_id is distinct from p_therapist or p_source='booking')
      and b.booking_date+b.start_time < p_end
      and b.booking_date+b.start_time+b.duration_minutes*interval '1 minute' > p_begin
  ) or exists (
    select 1 from public.resort_schedules s
    join public.resort_schedule_rooms sr on sr.schedule_id=s.id
    where s.store_id=p_store and sr.room_number=p_room
      and (p_source<>'schedule' or s.id<>p_id)
      and (p_source='block' or s.therapist_id is distinct from p_therapist or p_source='schedule')
      and s.work_date+s.start_time+case when s.start_time<time '10:00' then interval '1 day' else interval '0 day' end < p_end
      and s.work_date+s.end_time+case when s.end_time<time '10:00' then interval '1 day' else interval '0 day' end
        +case when s.end_time<=s.start_time and s.end_time>=time '10:00' then interval '1 day' else interval '0 day' end > p_begin
  ) or exists (
    select 1 from resort_private.room_blocks rb
    where rb.store_id=p_store and rb.room_number=p_room
      and (p_source<>'block' or rb.id<>p_id)
      and rb.work_date+interval '10 hours'+rb.start_slot*interval '30 minutes' < p_end
      and rb.work_date+interval '10 hours'+rb.end_slot*interval '30 minutes' > p_begin
  ) then
    raise exception 'ルームの利用予定が重複しています' using errcode='23P01';
  end if;
end $$;
revoke all on function resort_private.assert_room_free(smallint,smallint,timestamp,timestamp,uuid,text,uuid)
  from public,anon,authenticated;

create or replace function resort_private.guard_booking_room()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('cancelled','no_show') or new.room_number is null then return new; end if;
  perform resort_private.assert_room_free(new.store_id,new.room_number,
    new.booking_date+new.start_time,
    new.booking_date+new.start_time+new.duration_minutes*interval '1 minute',
    new.therapist_id,'booking',new.id);
  return new;
end $$;
create trigger resort_guard_booking_room before insert or update of
  store_id,room_number,booking_date,start_time,duration_minutes,status,therapist_id
  on public.resort_bookings for each row execute function resort_private.guard_booking_room();

create or replace function resort_private.guard_assigned_room()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_schedule public.resort_schedules%rowtype;
begin
  select * into v_schedule from public.resort_schedules where id=new.schedule_id;
  if not found or v_schedule.start_time is null or v_schedule.end_time is null then return new; end if;
  perform resort_private.assert_room_free(v_schedule.store_id,new.room_number,
    v_schedule.work_date+v_schedule.start_time+case when v_schedule.start_time<time '10:00' then interval '1 day' else interval '0 day' end,
    v_schedule.work_date+v_schedule.end_time+case when v_schedule.end_time<time '10:00' then interval '1 day' else interval '0 day' end
      +case when v_schedule.end_time<=v_schedule.start_time and v_schedule.end_time>=time '10:00' then interval '1 day' else interval '0 day' end,
    v_schedule.therapist_id,'schedule',new.schedule_id);
  return new;
end $$;
create trigger resort_guard_assigned_room before insert or update of schedule_id,room_number
  on public.resort_schedule_rooms for each row execute function resort_private.guard_assigned_room();

create or replace function resort_private.guard_schedule_room()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_room smallint;
begin
  select room_number into v_room from public.resort_schedule_rooms where schedule_id=new.id;
  if v_room is null or new.start_time is null or new.end_time is null then return new; end if;
  perform resort_private.assert_room_free(new.store_id,v_room,
    new.work_date+new.start_time+case when new.start_time<time '10:00' then interval '1 day' else interval '0 day' end,
    new.work_date+new.end_time+case when new.end_time<time '10:00' then interval '1 day' else interval '0 day' end
      +case when new.end_time<=new.start_time and new.end_time>=time '10:00' then interval '1 day' else interval '0 day' end,
    new.therapist_id,'schedule',new.id);
  return new;
end $$;
create trigger resort_guard_schedule_room before update of
  store_id,work_date,start_time,end_time,therapist_id
  on public.resort_schedules for each row execute function resort_private.guard_schedule_room();

create or replace function resort_private.guard_room_block()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform resort_private.assert_room_free(new.store_id,new.room_number,
    new.work_date+interval '10 hours'+new.start_slot*interval '30 minutes',
    new.work_date+interval '10 hours'+new.end_slot*interval '30 minutes',
    null,'block',new.id);
  return new;
end $$;
create trigger resort_guard_room_block before insert or update of
  store_id,room_number,work_date,start_slot,end_slot
  on resort_private.room_blocks for each row execute function resort_private.guard_room_block();

-- All four triggers must be installed together. The existing admin schedule
-- form still uses two HTTP requests: if room assignment fails, schedule can
-- remain without a room. A single RPC must replace that flow before release.
commit;
