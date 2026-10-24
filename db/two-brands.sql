-- Additive migration: existing locations and profiles remain Resort-style.
begin;
alter table public.resort_stores add column brand_code text not null default 'resort-style' check (brand_code in ('marron','resort-style'));
alter table public.resort_therapists add column brand_codes text[] not null default array['resort-style']::text[] check (cardinality(brand_codes)>0 and brand_codes <@ array['marron','resort-style']::text[]);
alter table public.resort_customers add column uses_marron boolean not null default false;
alter table public.resort_customers add column uses_resort_style boolean not null default true;
alter table public.resort_customers add constraint resort_customer_has_brand check (uses_marron or uses_resort_style);
-- Keep the new operational location off the Resort-style public website.
insert into public.resort_stores(id,code,name,brand_code,is_active,display_order)
select (select coalesce(max(id),0)+1 from public.resort_stores),'marron','MarroN','marron',false,10
where not exists(select 1 from public.resort_stores where code='marron');
-- Restrictive policies supplement the existing publication policies.
create policy "Resort public brand stores" on public.resort_stores as restrictive for select to anon using (brand_code='resort-style');
create policy "Resort public brand profiles" on public.resort_therapists as restrictive for select to anon using ('resort-style'=any(brand_codes));
create policy "Resort public brand schedules" on public.resort_schedules as restrictive for select to anon using (exists(select 1 from public.resort_stores s where s.id=store_id and s.brand_code='resort-style'));
create policy "Resort public brand memberships" on public.resort_therapist_stores as restrictive for select to anon using (exists(select 1 from public.resort_stores s where s.id=store_id and s.brand_code='resort-style'));
-- A booking also records that the customer uses that brand, atomically.
create function public.resort_mark_customer_brand() returns trigger language plpgsql security invoker set search_path='' as $$
declare brand text;
begin
 select brand_code into brand from public.resort_stores where id=new.store_id;
 if not exists(select 1 from public.resort_therapists where id=new.therapist_id and brand=any(brand_codes)) then
  raise exception 'The therapist does not belong to this brand';
 end if;
 update public.resort_customers set uses_marron=uses_marron or brand='marron',uses_resort_style=uses_resort_style or brand='resort-style' where id=new.customer_id;
 return new;
end $$;
revoke all on function public.resort_mark_customer_brand() from public;
create trigger resort_booking_customer_brand before insert or update of store_id,customer_id,therapist_id on public.resort_bookings for each row execute function public.resort_mark_customer_brand();
commit;
