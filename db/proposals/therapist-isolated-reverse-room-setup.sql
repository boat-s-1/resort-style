-- NEW ANONYMOUS ISOLATED BRANCH ONLY; never production. Run after phases A/B and fixture seed.
\set ON_ERROR_STOP on
insert into resort_private.room_blocks(store_id,room_number,work_date,start_slot,end_slot,kind)
values (30000,1,date '2031-01-05',0,1,'cleaning'),
       (30000,2,date '2031-01-05',2,3,'cleaning');
