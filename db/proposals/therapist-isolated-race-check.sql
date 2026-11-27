-- ISOLATED BRANCH ONLY. Run after both race sessions exit.
-- A must commit; B must fail with SQLSTATE 23P01. Never auto-delete data.
begin transaction read only;
do $$
declare v_a int; v_b int;
begin
  select count(*) into v_a from public.resort_bookings
  where store_id=30000 and course_name='匿名並列A';
  select count(*) into v_b from public.resort_bookings
  where store_id=30000 and course_name='匿名並列B';
  if v_a<>1 or v_b<>0 then
    raise exception 'parallel transaction invariant failed: A %, B %',v_a,v_b;
  end if;
end $$;
rollback;
