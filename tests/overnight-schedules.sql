begin;
do $$
declare tid uuid; sid smallint; b text; dt date := (now() at time zone 'Asia/Tokyo')::date+20;
begin
 perform set_config('request.jwt.claim.sub',(select user_id::text from public.resort_admins limit 1),true);
 foreach b in array array['marron','resort-style'] loop
  select id into sid from public.resort_stores where brand_code=b order by id limit 1;
  insert into public.resort_therapists(name,slug,brand_codes,is_published) values('Synthetic overnight test','test-overnight-'||gen_random_uuid(),array[b],false) returning id into tid;
  execute 'set local role authenticated';
  insert into public.resort_schedules(therapist_id,store_id,work_date,start_time,end_time,is_published) values(tid,sid,dt,'23:00','03:00',false);
  update public.resort_schedules set start_time='10:00',end_time='18:00' where therapist_id=tid and work_date=dt;
  update public.resort_schedules set start_time='23:00',end_time='00:00' where therapist_id=tid and work_date=dt;
  begin
   update public.resort_schedules set start_time='10:00',end_time='10:00' where therapist_id=tid and work_date=dt;
   raise exception 'Equal times accepted';
  exception when check_violation then null;
  end;
  update public.resort_schedules set start_time=null,end_time=null where therapist_id=tid and work_date=dt;
  execute 'reset role';
 end loop;
end $$;
rollback;
select 'both brands: overnight, daytime, midnight, unspecified and equal-time rejection passed' as result;
