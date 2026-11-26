import { bookingBusinessDate, inBusinessHours } from './businessDay.mjs';
import attendanceMath from './attendance.cjs';

const { attendanceDetails } = attendanceMath;
export const toDate = value => new Date(`${value}T00:00:00Z`);
export const dateText = date => date.toISOString().slice(0, 10);
export const nextDate = value => dateText(new Date(toDate(value).getTime() + 86400000));
export const firstOfMonth = value => value.slice(0, 7) + '-01';
export const lastOfMonth = value => dateText(new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)), 0)));
export const emptyMetrics = () => ({ count: 0, sales: 0, payout: 0, unknownSales: 0, unknownPayout: 0 });
export const selectStores = (stores, scope) => stores.filter(s => scope === 'all' ||
  (scope.startsWith('brand:') && s.brand_code === scope.slice(6)) ||
  scope === `store:${s.id}`);

function addBooking(target, booking) {
  target.count += 1;
  if (booking.total_amount == null) target.unknownSales += 1;
  else target.sales += Number(booking.total_amount);
  if (booking.therapist_payout == null) target.unknownPayout += 1;
  else target.payout += Number(booking.therapist_payout);
}

export function summarizeReport({ bookings, expenses, inquiries, schedules, attendance, therapists, start, end }) {
  const completed = bookings.filter(b => b.status === 'completed' &&
    inBusinessHours(b.start_time) && bookingBusinessDate(b) >= start && bookingBusinessDate(b) <= end);
  const within = bookings.filter(b => inBusinessHours(b.start_time) &&
    bookingBusinessDate(b) >= start && bookingBusinessDate(b) <= end);
  const lost = inquiries.filter(i => i.inquiry_date >= start && i.inquiry_date <= end);
  const total = emptyMetrics();
  const daily = new Map();
  const byTherapist = new Map(therapists.map(t => [t.id, { id: t.id, name: t.name, ...emptyMetrics(), minutes: 0, workMinutes: 0, pending: 0, shifts: 0, nomination: 0, repeat: 0 }]));
  const courses = new Map();
  for (const b of completed) {
    addBooking(total, b);
    const day = bookingBusinessDate(b);
    if (!daily.has(day)) daily.set(day, emptyMetrics());
    addBooking(daily.get(day), b);
    if (!byTherapist.has(b.therapist_id)) byTherapist.set(b.therapist_id, { id: b.therapist_id, name: '登録済みセラピスト', ...emptyMetrics(), minutes: 0, workMinutes: 0, pending: 0, shifts: 0, nomination: 0, repeat: 0 });
    const t = byTherapist.get(b.therapist_id);
    addBooking(t, b);
    t.minutes += Number(b.duration_minutes || 0);
    t.nomination += Number(b.nomination_fee || 0) > 0 ? 1 : 0;
    t.repeat += b.is_first_visit === false ? 1 : 0;
    const name = b.course_name || 'コース未入力';
    courses.set(name, (courses.get(name) || 0) + 1);
  }
  for (const s of schedules) {
    const t = byTherapist.get(s.therapist_id);
    if (!t || s.work_date < start || s.work_date > end) continue;
    const details = attendanceDetails(s, attendance.get(s.id));
    t.workMinutes += details.minutes;
    t.pending += details.recorded ? 0 : 1;
    t.shifts += 1;
  }
  const includedExpenses = [];
  const undatedExpenses = [];
  for (const e of expenses) {
    if (e.is_archived) continue;
    if (e.expense_date) {
      if (e.expense_date >= start && e.expense_date <= end) includedExpenses.push(e);
    } else if (firstOfMonth(e.expense_month + '-01') >= start && lastOfMonth(e.expense_month + '-01') <= end) {
      includedExpenses.push(e);
    } else if (e.expense_month >= start.slice(0, 7) && e.expense_month <= end.slice(0, 7)) {
      undatedExpenses.push(e);
    }
  }
  const expenseTotal = includedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const unknown = total.unknownSales || total.unknownPayout || undatedExpenses.length;
  const missingPayment = completed.filter(b => b.payment_method === 'unpaid').length;
  return {
    completed, within, lost, total, daily, byTherapist, courses, expenseTotal,
    undatedExpenses, missingPayment, profit: unknown ? null : total.sales - total.payout - expenseTotal,
  };
}
