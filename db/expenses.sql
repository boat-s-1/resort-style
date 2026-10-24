begin;
create table public.resort_expenses (
 id uuid primary key default gen_random_uuid(),
 store_id smallint not null references public.resort_stores(id),
 expense_month text not null check(expense_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 purpose text not null check(length(btrim(purpose)) between 1 and 200),
 amount integer not null check(amount>=0),
 is_archived boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.resort_expenses enable row level security;
revoke all on public.resort_expenses from public,anon,authenticated;
grant select,insert,update on public.resort_expenses to authenticated;
create policy "Resort admins manage expenses" on public.resort_expenses for all to authenticated
 using(exists(select 1 from public.resort_admins where user_id=(select auth.uid())))
 with check(exists(select 1 from public.resort_admins where user_id=(select auth.uid())));
create index resort_expenses_store_month_idx on public.resort_expenses(store_id,expense_month) where not is_archived;
create trigger resort_expenses_set_updated_at before update on public.resort_expenses for each row execute function public.resort_set_updated_at();
commit;
