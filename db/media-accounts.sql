begin;
create schema if not exists resort_private;
revoke all on schema resort_private from public,anon,authenticated;
grant usage on schema resort_private to authenticated;
create table resort_private.media_accounts (
 id uuid primary key default gen_random_uuid(),
 brand_code text not null check(brand_code in ('marron','resort-style')),
 name text not null check(length(btrim(name)) between 1 and 200),
 url text not null default '' check(url='' or url ~ '^https?://'),
 login_id text not null default '' check(length(login_id)<=500),
 secret_id uuid references vault.secrets(id),
 updated_at timestamptz not null default now()
);
alter table resort_private.media_accounts enable row level security;
revoke all on resort_private.media_accounts from public,anon,authenticated;
create index on resort_private.media_accounts(brand_code,name);
create function resort_private.media_access(p_brand text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.resort_admins where user_id=auth.uid()) then raise exception 'Administrator required' using errcode='42501'; end if;
 if p_brand not in ('marron','resort-style') or p_brand is null then raise exception 'Invalid brand' using errcode='22023'; end if;
end $$;
create function resort_private.list_media(p_brand text) returns table(id uuid,name text,url text,login_id text,has_password boolean,updated_at timestamptz) language plpgsql security definer set search_path='' as $$
begin
 perform resort_private.media_access(p_brand);
 return query select m.id,m.name,m.url,m.login_id,m.secret_id is not null,m.updated_at from resort_private.media_accounts m where m.brand_code=p_brand order by m.name,m.id;
end $$;
create function resort_private.save_media(p_brand text,p_id uuid,p_name text,p_url text,p_login_id text,p_password text) returns uuid language plpgsql security definer set search_path='' as $$
declare row_id uuid; vault_id uuid;
begin
 perform resort_private.media_access(p_brand);
 if length(coalesce(p_password,''))>10000 then raise exception 'Password too long' using errcode='22023'; end if;
 if p_id is null then
  insert into resort_private.media_accounts(brand_code,name,url,login_id) values(p_brand,btrim(p_name),btrim(coalesce(p_url,'')),coalesce(p_login_id,'')) returning id into row_id;
 else
  select id,secret_id into row_id,vault_id from resort_private.media_accounts where id=p_id and brand_code=p_brand for update;
  if not found then raise exception 'Media account not found' using errcode='P0002'; end if;
  update resort_private.media_accounts set name=btrim(p_name),url=btrim(coalesce(p_url,'')),login_id=coalesce(p_login_id,''),updated_at=now() where id=row_id;
 end if;
 if p_password is not null and p_password<>'' then
  if vault_id is null then
   select vault.create_secret(p_password) into vault_id;
   update resort_private.media_accounts set secret_id=vault_id where id=row_id;
  else
   perform vault.update_secret(vault_id,p_password);
  end if;
 end if;
 return row_id;
end $$;
create function resort_private.reveal_media(p_brand text,p_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
 perform resort_private.media_access(p_brand);
 select v.decrypted_secret into result from resort_private.media_accounts m left join vault.decrypted_secrets v on v.id=m.secret_id where m.id=p_id and m.brand_code=p_brand;
 if not found then raise exception 'Media account not found' using errcode='P0002'; end if;
 return coalesce(result,'');
end $$;
-- Only these authenticated, checked functions are reachable by API wrappers.
revoke all on all functions in schema resort_private from public,anon,authenticated;
grant execute on function resort_private.list_media(text),resort_private.save_media(text,uuid,text,text,text,text),resort_private.reveal_media(text,uuid) to authenticated;
create function public.resort_media_list(p_brand text) returns table(id uuid,name text,url text,login_id text,has_password boolean,updated_at timestamptz) language sql security invoker set search_path='' as $$select * from resort_private.list_media(p_brand)$$;
create function public.resort_media_save(p_brand text,p_id uuid,p_name text,p_url text,p_login_id text,p_password text) returns uuid language sql security invoker set search_path='' as $$select resort_private.save_media(p_brand,p_id,p_name,p_url,p_login_id,p_password)$$;
create function public.resort_media_reveal(p_brand text,p_id uuid) returns text language sql security invoker set search_path='' as $$select resort_private.reveal_media(p_brand,p_id)$$;
revoke all on function public.resort_media_list(text),public.resort_media_save(text,uuid,text,text,text,text),public.resort_media_reveal(text,uuid) from public,anon,authenticated;
grant execute on function public.resort_media_list(text),public.resort_media_save(text,uuid,text,text,text,text),public.resort_media_reveal(text,uuid) to authenticated;
commit;
