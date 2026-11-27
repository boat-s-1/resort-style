-- Candidate phase D after room guard. Every function call is one DB transaction.
-- The existing direct-table grants remain for other legacy callers; guard
-- triggers still protect those writes. No production application is authorized.
begin;
create or replace function resort_private.admin_save_booking(p_id uuid, p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.resort_bookings%rowtype; v_id uuid; v_brand text;
begin
  if not exists(select 1 from public.resort_admins where user_id=auth.uid()) then
    raise exception '管理者権限が必要です' using errcode='42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or exists(
    select 1 from jsonb_object_keys(p_payload) k
    where k not in ('store_id','room_number','therapist_id','customer_id','booking_date','start_time',
      'duration_minutes','course_name','base_price','nomination_fee','extension_fee','discount',
      'therapist_payout','payment_method','status','is_first_visit','notes','nomination_code',
      'extension_minutes','option_fee','price_adjustment','payout_adjustment','pricing_version','total_amount'))
  then raise exception '予約項目を確認してください' using errcode='22023'; end if;
  v:=jsonb_populate_record(null::public.resort_bookings,p_payload);
  select s.brand_code into v_brand from public.resort_stores s where s.id=v.store_id;
  if v_brand is null or v.customer_id is null or v.therapist_id is null
    or not exists(select 1 from public.resort_therapists t where t.id=v.therapist_id and v_brand=any(t.brand_codes)) then
    raise exception '店舗・女の子・顧客を確認してください' using errcode='22023';
  end if;
  if p_id is null then
    insert into public.resort_bookings(store_id,room_number,therapist_id,customer_id,
      booking_date,start_time,duration_minutes,course_name,base_price,nomination_fee,
      extension_fee,discount,therapist_payout,payment_method,status,is_first_visit,notes,
      nomination_code,extension_minutes,option_fee,price_adjustment,payout_adjustment,
      pricing_version,total_amount)
    values(v.store_id,v.room_number,v.therapist_id,v.customer_id,
      v.booking_date,v.start_time,v.duration_minutes,v.course_name,v.base_price,v.nomination_fee,
      v.extension_fee,v.discount,v.therapist_payout,v.payment_method,v.status,v.is_first_visit,v.notes,
      v.nomination_code,v.extension_minutes,v.option_fee,v.price_adjustment,v.payout_adjustment,
      v.pricing_version,v.total_amount) returning id into v_id;
  else
    update public.resort_bookings set store_id=v.store_id,room_number=v.room_number,
      therapist_id=v.therapist_id,customer_id=v.customer_id,booking_date=v.booking_date,
      start_time=v.start_time,duration_minutes=v.duration_minutes,course_name=v.course_name,
      base_price=v.base_price,nomination_fee=v.nomination_fee,extension_fee=v.extension_fee,
      discount=v.discount,therapist_payout=v.therapist_payout,payment_method=v.payment_method,
      status=v.status,is_first_visit=v.is_first_visit,notes=v.notes,nomination_code=v.nomination_code,
      extension_minutes=v.extension_minutes,option_fee=v.option_fee,price_adjustment=v.price_adjustment,
      payout_adjustment=v.payout_adjustment,pricing_version=v.pricing_version,total_amount=v.total_amount
      where id=p_id returning id into v_id;
    if v_id is null then raise exception '予約が見つかりません' using errcode='22023'; end if;
  end if;
  if v_brand='marron' then
    update public.resort_customers set uses_marron=true where id=v.customer_id;
  else
    update public.resort_customers set uses_resort_style=true where id=v.customer_id;
  end if;
  return v_id;
end $$;
revoke all on function resort_private.admin_save_booking(uuid,jsonb) from public,anon,authenticated;
grant execute on function resort_private.admin_save_booking(uuid,jsonb) to authenticated;
create or replace function public.resort_admin_save_booking(p_id uuid,p_payload jsonb)
returns uuid language sql security invoker set search_path='' as $$
  select resort_private.admin_save_booking(p_id,p_payload)
$$;
revoke all on function public.resort_admin_save_booking(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.resort_admin_save_booking(uuid,jsonb) to authenticated;

create or replace function resort_private.admin_delete_booking(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.resort_admins where user_id=auth.uid()) then
    raise exception '管理者権限が必要です' using errcode='42501';
  end if;
  delete from public.resort_bookings where id=p_id;
  if not found then raise exception '予約が見つかりません' using errcode='22023'; end if;
  return true;
end $$;
revoke all on function resort_private.admin_delete_booking(uuid) from public,anon,authenticated;
grant execute on function resort_private.admin_delete_booking(uuid) to authenticated;
create or replace function public.resort_admin_delete_booking(p_id uuid)
returns boolean language sql security invoker set search_path='' as $$
  select resort_private.admin_delete_booking(p_id)
$$;
revoke all on function public.resort_admin_delete_booking(uuid) from public,anon,authenticated;
grant execute on function public.resort_admin_delete_booking(uuid) to authenticated;

create or replace function resort_private.admin_save_schedule(p_id uuid,p_payload jsonb,p_room smallint)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.resort_schedules%rowtype; v_id uuid; v_existing uuid; v_brand text;
begin
  if not exists(select 1 from public.resort_admins where user_id=auth.uid()) then
    raise exception '管理者権限が必要です' using errcode='42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or exists(
    select 1 from jsonb_object_keys(p_payload) k
    where k not in ('therapist_id','store_id','work_date','start_time','end_time','note','is_published'))
    or (p_room is not null and p_room not between 1 and 2) then
    raise exception '出勤項目を確認してください' using errcode='22023';
  end if;
  v:=jsonb_populate_record(null::public.resort_schedules,p_payload);
  select brand_code into v_brand from public.resort_stores where id=v.store_id;
  if v_brand is null or v.therapist_id is null or v.work_date is null
    or not exists(select 1 from public.resort_therapists t where t.id=v.therapist_id and v_brand=any(t.brand_codes)) then
    raise exception '店舗と女の子を確認してください' using errcode='22023';
  end if;
  -- Detach the old room within this transaction before moving store/time.
  -- A failed new assignment rolls the entire schedule and room back.
  if p_id is not null then
    select id into v_existing from public.resort_schedules where id=p_id for update;
  else
    select id into v_existing from public.resort_schedules
      where therapist_id=v.therapist_id and work_date=v.work_date for update;
  end if;
  if v_existing is not null then
    delete from public.resort_schedule_rooms where schedule_id=v_existing;
  end if;
  if p_id is null then
    insert into public.resort_schedules(therapist_id,store_id,work_date,start_time,end_time,note,is_published)
      values(v.therapist_id,v.store_id,v.work_date,v.start_time,v.end_time,v.note,v.is_published)
      on conflict(therapist_id,work_date) do update set
        store_id=excluded.store_id,start_time=excluded.start_time,end_time=excluded.end_time,
        note=excluded.note,is_published=excluded.is_published returning id into v_id;
  else
    update public.resort_schedules set therapist_id=v.therapist_id,store_id=v.store_id,
      work_date=v.work_date,start_time=v.start_time,end_time=v.end_time,note=v.note,
      is_published=v.is_published where id=p_id returning id into v_id;
    if v_id is null then raise exception '出勤予定が見つかりません' using errcode='22023'; end if;
  end if;
  if p_room is not null then
    insert into public.resort_schedule_rooms(schedule_id,room_number) values(v_id,p_room)
      on conflict(schedule_id) do update set room_number=excluded.room_number;
  end if;
  return v_id;
end $$;
revoke all on function resort_private.admin_save_schedule(uuid,jsonb,smallint) from public,anon,authenticated;
grant execute on function resort_private.admin_save_schedule(uuid,jsonb,smallint) to authenticated;
create or replace function public.resort_admin_save_schedule(p_id uuid,p_payload jsonb,p_room smallint)
returns uuid language sql security invoker set search_path='' as $$
  select resort_private.admin_save_schedule(p_id,p_payload,p_room)
$$;
revoke all on function public.resort_admin_save_schedule(uuid,jsonb,smallint) from public,anon,authenticated;
grant execute on function public.resort_admin_save_schedule(uuid,jsonb,smallint) to authenticated;
commit;
