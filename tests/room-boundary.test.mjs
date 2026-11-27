import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingBusinessDate, japanTimeStamp } from '../lib/businessDay.mjs';
import { scheduleEndTimeOnBusinessDate } from '../lib/scheduleBusinessDay.mjs';

const booking=(date,time,minutes)=>({booking_date:date,start_time:time,duration_minutes:minutes});
const span=b=>[japanTimeStamp(b.booking_date,b.start_time),japanTimeStamp(b.booking_date,b.start_time)+b.duration_minutes*60000];
const overlaps=(a,b)=>a[0]<b[1]&&b[0]<a[1];

test('calendar date 00:00 to 05:00 belongs to prior business date, including month boundary',()=>{
  assert.equal(bookingBusinessDate(booking('2026-12-01','00:00',60)),'2026-11-30');
  assert.equal(bookingBusinessDate(booking('2026-12-01','05:00',60)),'2026-11-30');
  assert.equal(bookingBusinessDate(booking('2026-12-01','10:00',60)),'2026-12-01');
});

test('23:30 booking overlaps next-calendar-day 00:00 booking; adjacent endpoint does not',()=>{
  assert.equal(overlaps(span(booking('2026-11-30','23:30',90)),span(booking('2026-12-01','00:00',60))),true);
  assert.equal(overlaps(span(booking('2026-11-30','23:30',30)),span(booking('2026-12-01','00:00',60))),false);
  assert.equal(scheduleEndTimeOnBusinessDate('2026-11-30','23:00','05:00'),japanTimeStamp('2026-12-01','05:00'));
  assert.equal(scheduleEndTimeOnBusinessDate('2026-11-30','00:00','05:00'),japanTimeStamp('2026-12-01','05:00'));
});
