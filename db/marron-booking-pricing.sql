begin;
alter table public.resort_bookings
 add column pricing_version smallint check(pricing_version=1),
 add column nomination_code text check(nomination_code in ('なし','P500','P1000','R1000','R2000')),
 add column extension_minutes smallint not null default 0 check(extension_minutes in (0,20,40,60)),
 add column option_fee integer not null default 0 check(option_fee>=0),
 add column price_adjustment integer not null default 0,
 add column payout_adjustment integer not null default 0;
create function public.resort_calculate_marron_booking() returns trigger language plpgsql security invoker set search_path='' as $$
declare minutes integer; price integer; payout integer; nomination_price integer; nomination_payout integer;
begin
 if new.pricing_version is distinct from 1 or not exists(select 1 from public.resort_stores where id=new.store_id and brand_code='marron') then return new; end if;
 select c.duration,c.price,c.payout into minutes,price,payout from (values
 ('新規70分コース',70,11500,6000),('新規90分コース',90,14000,8000),
 ('60分コース',60,12000,6000),('80分コース',80,14500,8000),
 ('100分コース',100,17000,10000),('120分コース',120,19500,12000),
 ('150分コース',150,24500,15000),('180分コース',180,29500,18000)
 ) as c(name,duration,price,payout) where c.name=new.course_name;
 if not found then raise exception 'Select a MarroN course' using errcode='22023'; end if;
 select n.price,n.payout into nomination_price,nomination_payout from (values
 ('なし',0,0),('P500',500,0),('P1000',1000,0),('R1000',1000,1000),('R2000',2000,2000)
 ) as n(code,price,payout) where n.code=new.nomination_code;
 if not found then raise exception 'Select a nomination type' using errcode='22023'; end if;
 new.duration_minutes:=minutes+new.extension_minutes;
 new.base_price:=price;
 new.nomination_fee:=nomination_price;
 new.extension_fee:=new.extension_minutes/20*4000;
 new.discount:=greatest(0,-new.price_adjustment);
 new.total_amount:=price+new.extension_fee+nomination_price+new.option_fee+new.price_adjustment;
 new.therapist_payout:=payout+new.extension_minutes/20*3000+nomination_payout+new.payout_adjustment;
 if new.total_amount<0 or new.therapist_payout<0 then raise exception 'Payment and payout must be nonnegative' using errcode='22023'; end if;
 return new;
end $$;
revoke all on function public.resort_calculate_marron_booking() from public,anon,authenticated;
create trigger resort_marron_pricing before insert or update on public.resort_bookings for each row execute function public.resort_calculate_marron_booking();
commit;
