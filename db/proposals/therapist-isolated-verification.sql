-- ISOLATED DB ONLY, after phases A/B/C/D and anonymous seed.
-- All changes in this script are rolled back; the seeded branch is deleted
-- after verification. Raise exceptions on failed assertions.
begin;
do $$
declare v_store smallint:=30000; v_admin uuid; v_cast uuid; v_other uuid; v_customer uuid;
        v_base uuid; v_overnight uuid; v_n int; v_payload jsonb; v_schedule uuid;
        v_rejected boolean; v_first jsonb; v_second jsonb; v_rooms jsonb; v_row jsonb;
        v_allowed text[]:=array['store_id','room_number','therapist_id','customer_id',
          'booking_date','start_time','duration_minutes','course_name','base_price',
          'nomination_fee','extension_fee','discount','therapist_payout','payment_method',
          'status','is_first_visit','notes','nomination_code','extension_minutes',
          'option_fee','price_adjustment','payout_adjustment','pricing_version','total_amount'];
begin
  select id into v_admin from auth.users where email='pr64-fixture@example.invalid';
  select id into v_cast from public.resort_therapists where slug='pr64-fixture-therapist';
  select id into v_other from public.resort_therapists where slug='pr64-fixture-therapist-b';
  select id into v_customer from public.resort_customers where name='匿名顧客' and phone='00000000000';
  if v_admin is null or v_cast is null or v_other is null or v_customer is null then raise exception 'fixture absent'; end if;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  select id into v_base from public.resort_bookings
    where store_id=v_store and course_name='匿名長時間予約';
  select id into v_overnight from public.resort_bookings
    where store_id=v_store and course_name='匿名深夜予約';
  select count(*) into v_n from public.resort_bookings a join public.resort_bookings b
    on a.id<b.id and a.store_id=v_store and b.store_id=v_store
    and a.room_number=b.room_number and a.booking_date+a.start_time
      < b.booking_date+b.start_time+b.duration_minutes*interval '1 minute'
    and b.booking_date+b.start_time
      < a.booking_date+a.start_time+a.duration_minutes*interval '1 minute';
  if v_n<>12 then raise exception 'expected exactly twelve anonymous overlaps, got %',v_n; end if;

  -- A fabricated admin identity and an invalid therapist token must fail.
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  v_rejected:=false;
  begin
    perform public.resort_admin_delete_booking(v_base);
  exception when insufficient_privilege then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'foreign admin deleted a booking'; end if;
  v_rejected:=false;
  begin
    perform public.resort_work_action('invalid-fixture-token',v_base,'start');
  exception when invalid_authorization_specification then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'invalid therapist token was accepted'; end if;
  v_rejected:=false;
  begin
    perform public.resort_work_action('pr64-fixture-expired',v_overnight,'start');
  exception when invalid_authorization_specification then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'expired therapist token was accepted'; end if;
  v_rejected:=false;
  begin
    perform public.resort_work_action('pr64-fixture-token-b',v_overnight,'start');
  exception when insufficient_privilege then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'other therapist operated a booking'; end if;
  v_rejected:=false;
  begin
    perform public.resort_room_availability('invalid-fixture-token',date '2030-12-31');
  exception when invalid_authorization_specification then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'invalid room token was accepted'; end if;
  v_rooms:=public.resort_room_availability('pr64-fixture-token-a',
    (now() at time zone 'Asia/Tokyo')::date
      - case when (now() at time zone 'Asia/Tokyo')::time <= time '05:00' then 1 else 0 end);
  if jsonb_typeof(v_rooms)<>'array' or
    (select count(*) from jsonb_array_elements(v_rooms) x where (x->>'store_id')::smallint=v_store)<>2 then
    raise exception 'room projection must contain the fixture store and two rooms';
  end if;
  for v_row in select value from jsonb_array_elements(v_rooms) loop
    if (select array_agg(key order by key) from jsonb_object_keys(v_row) k(key))
      is distinct from array['brand_code','business_date','room_number','slots','store_id','store_name']
      or jsonb_array_length(v_row->'slots')<>38 then
      raise exception 'room RPC leaked or dropped fields';
    end if;
  end loop;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);

  -- Starting and finishing must be idempotent and leave accounting untouched.
  v_first:=public.resort_work_action('pr64-fixture-token-a',v_overnight,'start');
  v_second:=public.resort_work_action('pr64-fixture-token-a',v_overnight,'start');
  if v_first is distinct from v_second then raise exception 'second start changed work progress'; end if;
  v_first:=public.resort_work_action('pr64-fixture-token-a',v_overnight,'finish');
  v_second:=public.resort_work_action('pr64-fixture-token-a',v_overnight,'finish');
  if v_first is distinct from v_second then raise exception 'second finish changed work progress'; end if;
  select count(*) into v_n from resort_private.work_audit where booking_id=v_overnight;
  if v_n<>2 or not exists(select 1 from public.resort_bookings
      where id=v_overnight and status='reserved' and payment_method='unpaid') then
    raise exception 'start/finish audit or accounting separation failed';
  end if;

  -- Booking timestamps are calendar dates; shifts use the selected business day.
  perform resort_private.assert_room_free(v_store,2::smallint,timestamp '2030-12-31 23:30',
    timestamp '2031-01-01 00:00',v_other,'booking',gen_random_uuid());
  perform resort_private.assert_room_free(v_store,2::smallint,timestamp '2031-01-01 04:30',
    timestamp '2031-01-01 05:00',v_other,'booking',gen_random_uuid());
  perform resort_private.assert_room_free(v_store,2::smallint,timestamp '2031-01-01 10:00',
    timestamp '2031-01-01 10:30',v_other,'booking',gen_random_uuid());
  v_rejected:=false;
  begin
    perform resort_private.assert_room_free(v_store,2::smallint,timestamp '2031-01-01 00:00',
      timestamp '2031-01-01 00:30',v_other,'booking',gen_random_uuid());
  exception when exclusion_violation then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'month-boundary overlap not detected'; end if;
  v_rejected:=false;
  begin
    perform resort_private.assert_room_free(v_store,2::smallint,timestamp '2031-01-01 05:00',
      timestamp '2031-01-01 05:30',v_other,'booking',gen_random_uuid());
  exception when invalid_parameter_value then v_rejected:=true;
  end;
  if not v_rejected then raise exception '05:00 boundary was accepted'; end if;

  -- Existing accounting-only updates and unchanged occupied interval survive.
  select jsonb_object_agg(k,value) into v_payload from public.resort_bookings b,
    lateral jsonb_each(to_jsonb(b)) e(k,value)
    where b.id=v_base and k=any(v_allowed);
  v_payload:=jsonb_set(v_payload,'{payment_method}','"card"'::jsonb);
  update public.resort_customers set uses_marron=true, uses_resort_style=false where id=v_customer;
  perform public.resort_admin_save_booking(v_base,v_payload);
  if not exists(select 1 from public.resort_bookings where id=v_base and payment_method='card')
    then raise exception 'accounting update was not saved'; end if;
  if not exists(select 1 from public.resort_customers where id=v_customer and uses_resort_style)
    then raise exception 'customer brand update was not in the save transaction'; end if;
  update public.resort_bookings set status='reserved' where id=v_base;
  update public.resort_bookings set status='completed' where id=v_base;

  v_rejected:=false;
  begin
    perform public.resort_admin_save_booking(v_base,
      jsonb_set(v_payload,'{start_time}','"10:15:00"'::jsonb));
  exception when exclusion_violation then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'overlapping time edit incorrectly succeeded'; end if;
  if not exists(select 1 from public.resort_bookings where id=v_base and start_time=time '10:00')
    then raise exception 'rejected edit did not roll back'; end if;

  update public.resort_bookings set status='cancelled' where id=v_base;
  v_rejected:=false;
  begin
    update public.resort_bookings set status='completed' where id=v_base;
  exception when exclusion_violation then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'reactivation incorrectly succeeded'; end if;
  if not exists(select 1 from public.resort_bookings where id=v_base and status='cancelled')
    then raise exception 'reactivation failure did not roll back'; end if;

  -- A successful schedule save includes its room in the same call.
  v_schedule:=public.resort_admin_save_schedule(null,
    jsonb_build_object('therapist_id',v_cast,'store_id',v_store,
      'work_date','2031-01-02','start_time','10:00','end_time','12:00',
      'note','','is_published',true),2::smallint);
  if not exists(select 1 from public.resort_schedule_rooms where schedule_id=v_schedule and room_number=2)
    then raise exception 'room was not saved with schedule'; end if;
  v_rejected:=false;
  begin
    perform public.resort_admin_save_schedule(v_schedule,
      jsonb_build_object('therapist_id',v_other,'store_id',v_store,
        'work_date','2030-12-31','start_time','10:00','end_time','12:00',
        'note','','is_published',true),1::smallint);
  exception when exclusion_violation then v_rejected:=true;
  end;
  if not v_rejected then raise exception 'conflicting schedule incorrectly succeeded'; end if;
  if not exists(select 1 from public.resort_schedules where id=v_schedule and work_date=date '2031-01-02')
    or not exists(select 1 from public.resort_schedule_rooms where schedule_id=v_schedule and room_number=2)
    then raise exception 'schedule and room were not rolled back together'; end if;
end $$;
rollback;

-- Additional approved isolated sessions: two clients race for the same room;
-- expired/foreign therapist tokens and unauthenticated admin calls must fail;
-- room RPC JSON keys must be limited to the six projected fields and 38 slots.
-- These require real separate connections and cannot be proved by one DO block.
