-- After both separate connections finish, assert winner committed both rows, loser left no partial changes.
\set ON_ERROR_STOP on
begin transaction read only;
do $$
declare v_count int; v_changed int;
begin
  select count(*),count(*) filter(where kind='closed' and
    ((room_number=1 and start_slot=0 and end_slot=2) or
     (room_number=2 and start_slot=2 and end_slot=4)))
  into v_count,v_changed from resort_private.room_blocks
  where store_id=30000 and work_date=date '2031-01-05';
  if v_count<>2 or v_changed<>2 then
    raise exception 'reverse room transaction incomplete: rows %, changed %',v_count,v_changed;
  end if;
end $$;
rollback;
