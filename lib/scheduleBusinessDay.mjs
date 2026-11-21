export function scheduleTimeRange(start, end) {
  const a = start?.slice(0, 5) || '—';
  const b = end?.slice(0, 5) || '—';
  const nextStart = start && start < '10:00';
  const nextEnd = nextStart || (start && end && end <= start);
  return `${nextStart ? '翌' : ''}${a}〜${nextEnd ? '翌' : ''}${b}`;
}

export function scheduleEndTimeOnBusinessDate(date, start, end) {
  if (!date || !start || !end) return null;
  const day = Date.parse(date + 'T00:00:00+09:00');
  const endMinutes = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
  const daysAfter = (start < '10:00' ? 1 : 0) + (end <= start ? 1 : 0);
  return day + daysAfter * 86400000 + endMinutes * 60000;
}
