alter table public.resort_expenses
  add column expense_date date,
  add column category text not null default 'uncategorized'
    check (category in ('transport', 'utilities', 'supplies', 'cleaning', 'advertising', 'other', 'uncategorized'));
