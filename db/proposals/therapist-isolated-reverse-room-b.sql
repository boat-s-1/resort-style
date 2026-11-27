-- Connection B. Opposite order; one transaction must abort with SQLSTATE 40P01.
\set ON_ERROR_STOP on
\set VERBOSITY verbose
begin;
set local statement_timeout = '15s';
update resort_private.room_blocks set end_slot=4,kind='closed'
where store_id=30000 and room_number=2 and work_date=date '2031-01-05' and start_slot=2;
select pg_sleep(2);
update resort_private.room_blocks set end_slot=2,kind='closed'
where store_id=30000 and room_number=1 and work_date=date '2031-01-05' and start_slot=0;
commit;
