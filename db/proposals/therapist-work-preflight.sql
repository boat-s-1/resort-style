-- Read-only and aggregate-only preflight. No customer, therapist or booking
-- identifiers are returned. Run before any migration; investigate nonzero
-- counts without automatically modifying legacy rows.
begin transaction read only;

select table_name, count(*) filter (where column_name in
  ('id','store_id','therapist_id','room_number','booking_date','work_date',
   'start_time','end_time','duration_minutes','status','is_published')) as relevant_columns
from information_schema.columns
where table_schema = 'public' and table_name in
  ('resort_bookings','resort_schedules','resort_schedule_rooms',
   'resort_stores','resort_therapists','resort_therapist_sessions',
   'resort_therapist_accounts','resort_admins')
group by table_name order by table_name;

select 'booking_invalid_interval' as issue, count(*) as rows
from public.resort_bookings
where start_time is null or duration_minutes is null or duration_minutes <= 0
   or start_time > time '05:00' and start_time < time '10:00'
union all
select 'schedule_invalid_interval', count(*)
from public.resort_schedules
where start_time is null or end_time is null or start_time = end_time
   or (start_time > time '05:00' and start_time < time '10:00')
   or (end_time > time '05:00' and end_time < time '10:00')
union all
select 'schedule_room_orphan', count(*)
from public.resort_schedule_rooms sr
left join public.resort_schedules s on s.id = sr.schedule_id
where s.id is null;

with booked as (
  select id, store_id, room_number, therapist_id,
         booking_date + start_time as begins,
         booking_date + start_time + duration_minutes * interval '1 minute' as ends
  from public.resort_bookings
  where status not in ('cancelled', 'no_show') and room_number is not null
    and start_time is not null and duration_minutes > 0
), assigned as (
  select s.id, s.store_id, sr.room_number, s.therapist_id,
    s.work_date + s.start_time + case when s.start_time < time '10:00' then interval '1 day' else interval '0 day' end as begins,
    s.work_date + s.end_time + case when s.end_time < time '10:00' then interval '1 day' else interval '0 day' end
      + case when s.end_time <= s.start_time and s.end_time >= time '10:00' then interval '1 day' else interval '0 day' end as ends
  from public.resort_schedules s join public.resort_schedule_rooms sr on sr.schedule_id = s.id
  where s.start_time is not null and s.end_time is not null
)
select 'booking_booking_overlap' as issue, count(*) as pairs
from booked a join booked b on a.id < b.id and a.store_id = b.store_id and a.room_number = b.room_number
  and a.begins < b.ends and b.begins < a.ends
union all
select 'schedule_schedule_overlap', count(*)
from assigned a join assigned b on a.id < b.id and a.store_id = b.store_id and a.room_number = b.room_number
  and a.begins < b.ends and b.begins < a.ends
union all
select 'booking_other_shift_overlap', count(*)
from booked b join assigned s on b.store_id = s.store_id and b.room_number = s.room_number
  and b.therapist_id <> s.therapist_id and b.begins < s.ends and s.begins < b.ends;

-- Inspect table/column constraints and existing triggers before adding hooks.
select event_object_table as table_name, count(*) as trigger_count
from information_schema.triggers
where event_object_schema = 'public' and event_object_table in
 ('resort_bookings','resort_schedules','resort_schedule_rooms')
group by event_object_table order by event_object_table;

rollback;
