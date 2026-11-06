const japanClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function timeSeconds(time) {
  if (!time) return NaN;
  const [hour, minute, second = 0] = time.split(':').map(Number);
  return hour * 3600 + minute * 60 + second;
}

export function businessDate(date, time) {
  if (timeSeconds(time) > 18000 || !time) return date;
  return new Date(Date.parse(date + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
}

export function japanBusinessDate(now = new Date()) {
  const [date, time] = japanClock.format(now).split(' ');
  return businessDate(date, time);
}

export function bookingBusinessDate(booking) {
  return businessDate(booking.booking_date, booking.start_time);
}

export function inBusinessHours(time) {
  const seconds = timeSeconds(time);
  return seconds <= 18000 || seconds >= 36000;
}

export function japanTimeStamp(date, time) {
  return Date.parse(date + 'T00:00:00+09:00') + timeSeconds(time) * 1000;
}
