-- ISOLATED BRANCH ONLY. Run on connection A concurrently with race-b.sql.
-- Never run this file against the production project. Stop if any setup fails.
\set ON_ERROR_STOP on
select id as admin_id from auth.users where email='pr64-fixture@example.invalid' \gset
select id as cast_id from public.resort_therapists where slug='pr64-fixture-therapist' \gset
select id as customer_id from public.resort_customers where phone='00000000000' \gset
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'admin_id', true);
select public.resort_admin_save_booking(null,jsonb_build_object(
  'store_id',30000,'room_number',2,'therapist_id',:'cast_id','customer_id',:'customer_id',
  'booking_date','2031-01-03','start_time','15:00','duration_minutes',60,
  'course_name','匿名並列A','base_price',1000,'nomination_fee',0,'extension_fee',0,
  'discount',0,'therapist_payout',0,'payment_method','unpaid','status','reserved',
  'is_first_visit',false,'notes','','nomination_code','なし','extension_minutes',0,
  'option_fee',0,'price_adjustment',0,'payout_adjustment',0,'total_amount',1000));
-- Keep the shared advisory transaction lock while connection B attempts save.
select pg_sleep(12);
commit;
