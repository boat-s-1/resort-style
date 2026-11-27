-- Candidate rollback. Do not run without approving the rollback and verifying
-- an encrypted backup of audit/notification data. Refuses to discard records.
begin;
do $$ begin
  if exists(select 1 from resort_private.work_progress limit 1)
    or exists(select 1 from resort_private.work_audit limit 1)
    or exists(select 1 from resort_private.work_notices limit 1)
    or exists(select 1 from resort_private.room_blocks limit 1)
    or exists(select 1 from resort_private.staff_store_grants limit 1)
    or exists(select 1 from resort_private.notice_receipts limit 1)
    or exists(select 1 from resort_private.push_subscriptions limit 1)
    or exists(select 1 from resort_private.push_attempts limit 1) then
    raise exception '業務・監査・通知記録があります。データ保全を先に承認してください';
  end if;
end $$;

drop trigger if exists resort_guard_booking_room on public.resort_bookings;
drop trigger if exists resort_guard_schedule_room on public.resort_schedules;
drop trigger if exists resort_guard_assigned_room on public.resort_schedule_rooms;
drop trigger if exists resort_guard_room_block on resort_private.room_blocks;
drop trigger if exists resort_fanout_work_notice on resort_private.work_notices;
drop function if exists resort_private.guard_booking_room();
drop function if exists resort_private.guard_schedule_room();
drop function if exists resort_private.guard_assigned_room();
drop function if exists resort_private.guard_room_block();
drop function if exists resort_private.assert_room_free(smallint,smallint,timestamp,timestamp,uuid,text,uuid);
drop function if exists resort_private.fanout_work_notice();
drop function if exists public.resort_admin_save_booking(uuid,jsonb);
drop function if exists resort_private.admin_save_booking(uuid,jsonb);
drop function if exists public.resort_admin_delete_booking(uuid);
drop function if exists resort_private.admin_delete_booking(uuid);
drop function if exists public.resort_admin_save_schedule(uuid,jsonb,smallint);
drop function if exists resort_private.admin_save_schedule(uuid,jsonb,smallint);
drop function if exists public.resort_admin_work_notices(bigint);
drop function if exists resort_private.admin_work_notices(bigint);
drop function if exists public.resort_work_action(text,uuid,text);
drop function if exists resort_private.work_action(text,uuid,text);
drop function if exists public.resort_room_availability(text,date);
drop function if exists resort_private.room_availability(text,date);
drop function if exists public.resort_correct_work(uuid,timestamptz,timestamptz,text);
drop function if exists resort_private.correct_work(uuid,timestamptz,timestamptz,text);
drop function if exists public.resort_work_state(text);
drop function if exists resort_private.work_state(text);

drop table if exists resort_private.push_attempts;
drop table if exists resort_private.push_subscriptions;
drop table if exists resort_private.notice_receipts;
drop table if exists resort_private.staff_store_grants;
drop table if exists resort_private.work_notices;
drop table if exists resort_private.work_audit;
drop table if exists resort_private.work_progress;
drop table if exists resort_private.room_blocks;
commit;
