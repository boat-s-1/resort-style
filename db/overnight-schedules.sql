-- A lower end time denotes the following calendar day. Equal times are invalid.
alter table public.resort_schedules drop constraint resort_schedules_check;
alter table public.resort_schedules add constraint resort_schedules_check
 check (start_time is null or end_time is null or start_time <> end_time);
