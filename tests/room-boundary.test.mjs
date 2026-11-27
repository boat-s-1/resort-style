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

test('05:00 closes the prior business day and 10:00 opens the next',()=>{
  const overnight=span(booking('2026-12-01','04:30',30));
  const boundary=span(booking('2026-12-01','05:00',30));
  assert.equal(overlaps(overnight,boundary),false);
  assert.equal(overlaps(span(booking('2026-11-30','23:30',330)),overnight),true);
  assert.equal(bookingBusinessDate(booking('2026-12-01','05:00',30)),'2026-11-30');
  assert.equal(bookingBusinessDate(booking('2026-12-01','10:00',30)),'2026-12-01');
  assert.equal(scheduleEndTimeOnBusinessDate('2026-11-30','23:30','05:00'),japanTimeStamp('2026-12-01','05:00'));
});

test('anonymous legacy fixture has exactly 12 pairs, without changing records',()=>{
  const long=span(booking('2030-12-31','10:00',420));
  const short=Array.from({length:12},(_,n)=>span(booking('2030-12-31',`${String(10+Math.floor(n/2)).padStart(2,'0')}:${n%2?'30':'00'}`,30)));
  const pairs=[long,...short].flatMap((a,i,rows)=>rows.slice(i+1).filter(b=>overlaps(a,b)));
  assert.equal(pairs.length,12);
  assert.equal(overlaps(span(booking('2030-12-31','23:30',90)),span(booking('2031-01-01','00:00',60))),true);
});
