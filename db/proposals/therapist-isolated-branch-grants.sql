-- ISOLATED BRANCH ONLY. Dashboard branches may lack production default grants.
-- These six tables have SELECT/INSERT/UPDATE/DELETE for authenticated in
-- production. This restores only those verified grants for comparable tests.
-- Never apply to the production project.
begin;
grant select,insert,update,delete on
  public.resort_admins,public.resort_bookings,public.resort_customers,
  public.resort_schedules,public.resort_stores,public.resort_therapists
  to authenticated;
commit;
