alter table public.resort_interviews
  add column store text check (store in ('MarroN', 'RS豊橋', 'RS名古屋', 'RS安城')),
  add column desired_monthly_income integer check (desired_monthly_income >= 0),
  add column work_days text not null default '' check (length(work_days) <= 300),
  add column training_at timestamp without time zone,
  add column first_work_date date,
  add column notes text not null default '' check (length(notes) <= 5000);
