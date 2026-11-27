import { japanTimeStamp } from './businessDay.mjs';

export const bookingEnd = booking => japanTimeStamp(booking.booking_date, booking.start_time) + Number(booking.duration_minutes || 0) * 60000;

export function upcomingBooking(bookings, now) {
  return bookings.filter(booking => booking.status === 'reserved' && booking.start_time && bookingEnd(booking) > now)
    .sort((a, b) => japanTimeStamp(a.booking_date, a.start_time) - japanTimeStamp(b.booking_date, b.start_time))[0];
}

export const completedCount = bookings => bookings.filter(booking => booking.status === 'completed').length;
