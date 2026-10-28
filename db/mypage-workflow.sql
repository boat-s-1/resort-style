-- Requests and issued credentials are private; only validated RPCs may access them.
create schema if not exists resort_private;
create table resort_private.shift_requests (
 id uuid primary key default gen_random_uuid(), therapist_id uuid not null references public.resort_therapists(id),
 store_id smallint not null references public.resort_stores(id), work_date date not null,
 start_time time not null, end_time time not null, note text not null default '' check(length(note)<=500),
 status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references auth.users(id),
 check(start_time<>end_time)
);
create unique index shift_requests_pending_day on resort_private.shift_requests(therapist_id,work_date) where status='pending';
create index shift_requests_store_status on resort_private.shift_requests(store_id,status,created_at desc);
alter table resort_private.shift_requests enable row level security;
revoke all on resort_private.shift_requests from public,anon,authenticated;
create table resort_private.issued_accounts (
 id uuid primary key default gen_random_uuid(), therapist_id uuid not null references public.resort_therapists(id),
 brand_code text not null check(brand_code in ('marron','resort-style')),
 platform text not null check(platform in ('x','instagram','relaxxy')),
 login_id text not null check(length(login_id) between 1 and 200),
 secret_id uuid not null references vault.secrets(id), updated_at timestamptz not null default now(),
 unique(therapist_id,brand_code,platform)
);
alter table resort_private.issued_accounts enable row level security;
revoke all on resort_private.issued_accounts from public,anon,authenticated;
create or replace function resort_private.mypage_action(p_action text,p_token text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 tid uuid; brand text; sid smallint; day date; st time; en time; req resort_private.shift_requests%rowtype;
 acct resort_private.issued_accounts%rowtype; secret uuid; result jsonb; d date := (now() at time zone 'Asia/Tokyo')::date;
begin
 if p_action like 'admin_%' then
  if not exists(select 1 from public.resort_admins where user_id=auth.uid()) then raise exception '管理者権限が必要です' using errcode='42501'; end if;
  brand:=p_data->>'brand';
  if brand is null or brand not in ('marron','resort-style') then raise exception '店舗を確認してください'; end if;
 else
  select s.therapist_id into tid from public.resort_therapist_sessions s join public.resort_therapist_accounts a on a.therapist_id=s.therapist_id and a.is_active
   where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now();
  if tid is null then raise exception '再ログインしてください' using errcode='28000'; end if;
 end if;
 if p_action='overview' then
  result:=public.resort_therapist_mypage(p_token,p_data->>'month');
  return result || jsonb_build_object(
   'today_salary',(select jsonb_build_object('confirmed',coalesce(sum(therapist_payout) filter(where status='completed'),0),'expected',coalesce(sum(therapist_payout) filter(where status='reserved'),0)) from public.resort_bookings where therapist_id=tid and booking_date=d),
   'next_schedules',coalesce((select jsonb_agg(to_jsonb(x) order by work_date,start_time) from (select s.id,s.work_date,s.start_time,s.end_time,s.note,t.name store_name from public.resort_schedules s join public.resort_stores t on t.id=s.store_id where s.therapist_id=tid and s.is_published and (s.work_date>d or (s.work_date=d and (s.end_time is null or s.end_time<s.start_time or s.end_time>(now() at time zone 'Asia/Tokyo')::time))) order by work_date,start_time limit 12) x),'[]'::jsonb),
   'request_stores',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'brand_code',s.brand_code) order by s.display_order) from public.resort_stores s join public.resort_therapists t on t.id=tid where s.brand_code=any(t.brand_codes)),'[]'::jsonb),
   'requests',coalesce((select jsonb_agg(to_jsonb(x) order by created_at desc) from (select r.id,r.work_date,r.start_time,r.end_time,r.note,r.status,r.created_at,s.name store_name from resort_private.shift_requests r join public.resort_stores s on s.id=r.store_id where therapist_id=tid order by created_at desc limit 60) x),'[]'::jsonb),
   'issued_accounts',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'brand_code',a.brand_code,'platform',a.platform,'login_id',a.login_id)) from resort_private.issued_accounts a join public.resort_therapists t on t.id=tid where a.therapist_id=tid and a.brand_code=any(t.brand_codes)),'[]'::jsonb));
 elsif p_action='request_shift' then
  sid:=(p_data->>'store_id')::smallint; day:=(p_data->>'work_date')::date; st:=(p_data->>'start_time')::time; en:=(p_data->>'end_time')::time;
  if day is null or day<d or day>d+365 or st is null or en is null or st=en then raise exception '日付と開始・終了時間を確認してください（終了が開始より前の場合は翌日扱い）'; end if;
  if not exists(select 1 from public.resort_stores s join public.resort_therapists t on t.id=tid where s.id=sid and s.brand_code=any(t.brand_codes)) then raise exception '在籍店舗を選んでください' using errcode='42501'; end if;
  if exists(select 1 from public.resort_schedules where therapist_id=tid and work_date=day) then raise exception 'その日は確定済みの出勤があります。変更は店舗へご連絡ください'; end if;
  if exists(select 1 from resort_private.shift_requests where therapist_id=tid and status='pending' and work_date=day) then raise exception 'その日は申請済みです'; end if;
  insert into resort_private.shift_requests(therapist_id,store_id,work_date,start_time,end_time,note) values(tid,sid,day,st,en,coalesce(p_data->>'note',''));
  return jsonb_build_object('ok',true);
 elsif p_action='cancel_request' then
  update resort_private.shift_requests set status='cancelled' where id=(p_data->>'id')::uuid and therapist_id=tid and status='pending';
  if not found then raise exception '申請はすでに処理されています'; end if;
  return jsonb_build_object('ok',true);
 elsif p_action='logout' then
  delete from public.resort_therapist_sessions where token_hash=encode(extensions.digest(p_token,'sha256'),'hex'); return jsonb_build_object('ok',true);
 elsif p_action='reveal_account' then
  select a.* into acct from resort_private.issued_accounts a join public.resort_therapists t on t.id=tid where a.id=(p_data->>'id')::uuid and a.therapist_id=tid and a.brand_code=any(t.brand_codes);
  if not found then raise exception 'アカウントを確認できません' using errcode='42501'; end if;
  return jsonb_build_object('password',(select decrypted_secret from vault.decrypted_secrets where id=acct.secret_id));
 elsif p_action='admin_requests' then
  return coalesce((select jsonb_agg(to_jsonb(x) order by created_at desc) from (select r.id,r.work_date,r.start_time,r.end_time,r.note,r.status,r.created_at,t.name therapist_name,s.name store_name from resort_private.shift_requests r join public.resort_therapists t on t.id=r.therapist_id join public.resort_stores s on s.id=r.store_id where s.brand_code=brand and (r.status='pending' or r.created_at>now()-interval '60 days') order by created_at desc limit 300) x),'[]'::jsonb);
 elsif p_action in ('admin_approve','admin_reject') then
  select r.* into req from resort_private.shift_requests r join public.resort_stores s on s.id=r.store_id where r.id=(p_data->>'id')::uuid and s.brand_code=brand for update of r;
  if not found or req.status<>'pending' then raise exception '申請はすでに処理されているか、対象店舗が異なります'; end if;
  if p_action='admin_approve' then
   if req.work_date<d then raise exception '過去日の申請は承認できません'; end if;
   if not exists(select 1 from public.resort_therapists where id=req.therapist_id and brand=any(brand_codes)) then raise exception '現在の在籍店舗を確認してください'; end if;
   insert into public.resort_schedules(therapist_id,store_id,work_date,start_time,end_time,note,is_published) values(req.therapist_id,req.store_id,req.work_date,req.start_time,req.end_time,'',true) on conflict(therapist_id,work_date) do nothing;
   if not found then raise exception 'その日は出勤が登録済みです。既存の出勤を確認してください'; end if;
  end if;
  update resort_private.shift_requests set status=case when p_action='admin_approve' then 'approved' else 'rejected' end,reviewed_at=now(),reviewed_by=auth.uid() where id=req.id;
  return jsonb_build_object('ok',true);
 elsif p_action in ('admin_accounts','admin_save_account') then
  tid:=(p_data->>'therapist_id')::uuid;
  if not exists(select 1 from public.resort_therapists where id=tid and brand=any(brand_codes)) then raise exception '対象の女の子を確認してください' using errcode='42501'; end if;
  if p_action='admin_accounts' then
   return coalesce((select jsonb_agg(jsonb_build_object('id',id,'platform',platform,'login_id',login_id)) from resort_private.issued_accounts where therapist_id=tid and brand_code=brand),'[]'::jsonb);
  end if;
  if p_data->>'platform' is null or p_data->>'platform' not in ('x','instagram','relaxxy') or length(trim(coalesce(p_data->>'login_id',''))) not between 1 and 200 or length(coalesce(p_data->>'password',''))>1024 then raise exception '媒体・ID・パスワードを確認してください'; end if;
  -- Serialize saves for the same therapist to avoid duplicate secret creation.
  perform 1 from public.resort_therapists where id=tid for update;
  select * into acct from resort_private.issued_accounts where therapist_id=tid and brand_code=brand and platform=p_data->>'platform';
  if acct.id is null then
   if coalesce(p_data->>'password','')='' then raise exception '初回登録はパスワードが必要です'; end if;
   secret:=vault.create_secret(p_data->>'password');
   insert into resort_private.issued_accounts(therapist_id,brand_code,platform,login_id,secret_id) values(tid,brand,p_data->>'platform',trim(p_data->>'login_id'),secret);
  else
   if coalesce(p_data->>'password','')<>'' then perform vault.update_secret(acct.secret_id,p_data->>'password'); end if;
   update resort_private.issued_accounts set login_id=trim(p_data->>'login_id'),updated_at=now() where id=acct.id;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 raise exception '操作を確認してください';
end;
$$;
revoke all on function resort_private.mypage_action(text,text,jsonb) from public;
grant usage on schema resort_private to anon,authenticated;
grant execute on function resort_private.mypage_action(text,text,jsonb) to anon,authenticated;
create or replace function public.resort_mypage_action(p_action text,p_token text default '',p_data jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select resort_private.mypage_action(p_action,p_token,p_data); $$;
revoke all on function public.resort_mypage_action(text,text,jsonb) from public;
grant execute on function public.resort_mypage_action(text,text,jsonb) to anon,authenticated;
