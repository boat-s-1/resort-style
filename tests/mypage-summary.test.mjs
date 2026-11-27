import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingEnd, upcomingBooking, completedCount } from '../lib/mypageSummary.mjs';

test('next reservation crosses midnight without treating an early-hour booking as the following business day', () => {
  const bookings = [
    { booking_date: '2026-11-28', start_time: '01:00', duration_minutes: 90, status: 'reserved' },
    { booking_date: '2026-11-27', start_time: '23:30', duration_minutes: 90, status: 'reserved' },
    { booking_date: '2026-11-27', start_time: '21:00', duration_minutes: 60, status: 'completed' },
  ];
  const now = Date.parse('2026-11-27T23:45:00+09:00');
  assert.equal(upcomingBooking(bookings, now), bookings[1]);
  assert.equal(new Date(bookingEnd(bookings[1])).toISOString(), '2026-11-27T16:00:00.000Z');
  assert.equal(completedCount(bookings), 1);
  assert.equal(upcomingBooking(bookings, Date.parse('2026-11-28T03:00:00+09:00')), undefined);
});
