-- Candidate phase C after therapist-work-app.sql; no external notification send.
begin;
create or replace function resort_private.fanout_work_notice()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into resort_private.notice_receipts(notice_id,admin_id)
  select new.id,g.admin_id from resort_private.staff_store_grants g
  join public.resort_admins a on a.user_id=g.admin_id
  where g.store_id=new.store_id and g.can_receive
  on conflict do nothing;
  return new;
end $$;
create trigger resort_fanout_work_notice after insert on resort_private.work_notices
  for each row execute function resort_private.fanout_work_notice();

create or replace function resort_private.admin_work_notices(p_mark_read bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not exists(select 1 from public.resort_admins where user_id=auth.uid()) then
    raise exception '管理者権限が必要です' using errcode='42501';
  end if;
  if p_mark_read is not null then
    update resort_private.notice_receipts r set read_at=coalesce(r.read_at,now())
      from resort_private.work_notices n
      join resort_private.staff_store_grants g on g.store_id=n.store_id
      where r.notice_id=p_mark_read and r.notice_id=n.id and r.admin_id=auth.uid()
        and g.admin_id=auth.uid() and g.can_receive;
    if not found then raise exception '通知を確認できません' using errcode='42501'; end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'store_name',x.store_name,
    'kind',x.kind,'created_at',x.created_at,'read_at',x.read_at)
    order by x.created_at desc), '[]'::jsonb) into v_result
  from (select n.id,s.name store_name,n.kind,n.created_at,r.read_at
    from resort_private.notice_receipts r
    join resort_private.work_notices n on n.id=r.notice_id
    join resort_private.staff_store_grants g on g.store_id=n.store_id and g.admin_id=r.admin_id and g.can_receive
    join public.resort_stores s on s.id=n.store_id
    where r.admin_id=auth.uid() order by n.created_at desc limit 100) x;
  return v_result;
end $$;
revoke all on function resort_private.admin_work_notices(bigint) from public,anon,authenticated;
grant execute on function resort_private.admin_work_notices(bigint) to authenticated;
create or replace function public.resort_admin_work_notices(p_mark_read bigint default null)
returns jsonb language sql security invoker set search_path='' as $$
  select resort_private.admin_work_notices(p_mark_read)
$$;
revoke all on function public.resort_admin_work_notices(bigint) from public,anon,authenticated;
grant execute on function public.resort_admin_work_notices(bigint) to authenticated;
commit;
