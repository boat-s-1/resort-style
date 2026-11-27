-- ISOLATED BRANCH ONLY. Run after both race sessions exit.
-- Exactly one must commit; the other must fail with SQLSTATE 23P01.
-- Connection scheduling can reverse which transaction acquires the lock first.
begin transaction read only;
do $$
declare v_a int; v_b int;
begin
  select count(*) into v_a from public.resort_bookings
  where store_id=30000 and course_name='匿名並列A';
  select count(*) into v_b from public.resort_bookings
  where store_id=30000 and course_name='匿名並列B';
  if v_a+v_b<>1 then
    raise exception 'parallel transaction invariant failed: A %, B %',v_a,v_b;
  end if;
end $$;
rollback;
