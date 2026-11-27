-- ISOLATED DB ONLY. Apply phase A, then this seed, then phases B/C/D.
-- Never run on production or a branch configured to include production data.
-- These fixtures deliberately contain no real person, customer or credential.
begin;
do $$
declare v_store smallint:=30000; v_admin uuid:=gen_random_uuid(); v_cast uuid; v_other uuid; v_customer uuid;
        v_base uuid; v_index integer;
begin
  insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
  values(v_admin,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'pr64-fixture@example.invalid','!',now(),now());
  insert into public.resort_admins(user_id) values(v_admin);
  insert into public.resort_stores(id,code,name,brand_code,display_order)
    values(v_store,'pr64-fixture-store','匿名検証店舗','resort-style',99);
  insert into public.resort_therapists(name,slug,brand_codes)
    values('匿名セラピスト','pr64-fixture-therapist',array['resort-style']) returning id into v_cast;
  insert into public.resort_therapists(name,slug,brand_codes)
    values('匿名セラピストB','pr64-fixture-therapist-b',array['resort-style']) returning id into v_other;
  -- These are inert fixture credentials for SQL-only tests, not real login users.
  insert into public.resort_therapist_accounts(therapist_id,login_id,password_hash,is_active)
  values (v_cast,'pr64-fixture-a','not-a-login-hash',true),
    (v_other,'pr64-fixture-b','not-a-login-hash',true);
  insert into public.resort_therapist_sessions(token_hash,therapist_id,expires_at)
  values
    (encode(extensions.digest('pr64-fixture-token-a','sha256'),'hex'),v_cast,now()+interval '1 hour'),
    (encode(extensions.digest('pr64-fixture-token-b','sha256'),'hex'),v_other,now()+interval '1 hour'),
    (encode(extensions.digest('pr64-fixture-expired','sha256'),'hex'),v_cast,now()-interval '1 hour');
  insert into public.resort_customers(name,phone)
    values('匿名顧客','00000000000') returning id into v_customer;
  -- One long booking and twelve nonoverlapping 30-minute bookings yield exactly
  -- twelve preexisting overlap pairs. They are all completed accounting records.
  insert into public.resort_bookings(store_id,room_number,therapist_id,customer_id,
    booking_date,start_time,duration_minutes,course_name,status,payment_method,
    total_amount,therapist_payout,created_by)
  values(v_store,1,v_cast,v_customer,date '2030-12-31',time '10:00',420,
    '匿名長時間予約','completed','cash',10000,6000,v_admin) returning id into v_base;
  for v_index in 0..11 loop
    insert into public.resort_bookings(store_id,room_number,therapist_id,customer_id,
      booking_date,start_time,duration_minutes,course_name,status,payment_method,
      total_amount,therapist_payout,created_by)
    values(v_store,1,v_cast,v_customer,date '2030-12-31',
      time '10:00'+v_index*interval '30 minutes',30,'匿名短時間予約',
      'completed','cash',1000,600,v_admin);
  end loop;
  -- A distinct room and a month-boundary overnight booking.
  insert into public.resort_bookings(store_id,room_number,therapist_id,customer_id,
    booking_date,start_time,duration_minutes,course_name,status,created_by)
  values(v_store,2,v_cast,v_customer,date '2031-01-01',time '00:00',60,
    '匿名深夜予約','reserved',v_admin);
  raise notice 'Anonymous fixture inserted; never export row data to logs';
end $$;
commit;
