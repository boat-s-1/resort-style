import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeReport, selectStores } from '../lib/monthlyReport.mjs';

const stores = [
  { id: 1, brand_code: 'resort-style' },
  { id: 2, brand_code: 'resort-style' },
  { id: 4, brand_code: 'marron' },
];
const booking = (id, store_id, booking_date, start_time, status, total_amount, therapist_payout) => ({
  id, store_id, booking_date, start_time, status, total_amount, therapist_payout,
  therapist_id: store_id === 4 ? 'm' : 'r', duration_minutes: 60,
  nomination_fee: 500, is_first_visit: false, course_name: '60分', payment_method: 'cash',
});
const rows = [
  booking('a', 1, '2026-11-01', '10:00:00', 'completed', 10000, 6000),
  booking('b', 4, '2026-11-02', '04:59:00', 'completed', 12000, 6000),
  booking('c', 1, '2026-11-02', '05:00:00', 'completed', 14000, 8000),
  booking('d', 4, '2026-11-02', '09:59:00', 'completed', 9000, 5000),
  booking('e', 4, '2026-11-02', '10:00:00', 'reserved', 12000, 6000),
  { ...booking('f', 4, '2026-11-02', '10:00:00', 'completed', 16000, 8000), payment_method: 'unpaid' },
];
const expense = [
  { id: 'e1', store_id: 1, expense_date: '2026-11-01', expense_month: '2026-11', amount: 1000, is_archived: false },
  { id: 'e2', store_id: 4, expense_date: null, expense_month: '2026-11', amount: 500, is_archived: false },
  { id: 'e3', store_id: 4, expense_date: '2026-11-01', expense_month: '2026-11', amount: 9000, is_archived: true },
];
function report(scope, start, end, override = {}) {
  const ids = selectStores(stores, scope).map(s => s.id);
  return summarizeReport({
    bookings: rows.filter(b => ids.includes(b.store_id)),
    expenses: expense.filter(e => ids.includes(e.store_id)),
    inquiries: [{ id: 'i', store_id: 4, inquiry_date: '2026-11-01' }].filter(i => ids.includes(i.store_id)),
    schedules: [{ id: 's', therapist_id: 'm', store_id: 4, work_date: '2026-11-01', start_time: '17:00:00', end_time: '00:00:00' }].filter(s => ids.includes(s.store_id)),
    attendance: new Map(),
    therapists: [{ id: 'm', name: 'M' }, { id: 'r', name: 'R' }],
    start, end, ...override,
  });
}

test('all / brand / store scopes and 05:00 boundary', () => {
  const all = report('all', '2026-11-01', '2026-11-01');
  assert.equal(all.total.count, 3);
  assert.equal(all.total.sales, 36000);
  assert.equal(all.total.payout, 20000);
  assert.equal(all.daily.get('2026-11-01').count, 3);
  assert.equal(all.undatedExpenses.length, 1);
  assert.equal(all.profit, null);
  assert.equal(report('brand:resort-style', '2026-11-01', '2026-11-01').total.sales, 24000);
  assert.equal(report('store:4', '2026-11-01', '2026-11-01').total.sales, 12000);
  assert.equal(report('store:2', '2026-11-01', '2026-11-01').total.count, 0);
  assert.equal(report('store:2', '2026-11-01', '2026-11-01').total.sales, 0);
});

test('full month includes undated expense; partial range does not guess its date', () => {
  const month = report('all', '2026-11-01', '2026-11-30');
  assert.equal(month.total.sales, 52000);
  assert.equal(month.expenseTotal, 1500);
  assert.equal(month.profit, 52000 - 28000 - 1500);
  assert.equal(month.missingPayment, 1);
  assert.equal(month.lost.length, 1);
  const second = report('all', '2026-11-02', '2026-11-02');
  assert.equal(second.total.sales, 16000);
  assert.equal(second.undatedExpenses.length, 1);
});

test('unrecorded attendance is provisional and absent yields no hours', () => {
  const pending = report('store:4', '2026-11-01', '2026-11-01').byTherapist.get('m');
  assert.equal(pending.pending, 1);
  assert.equal(pending.workMinutes, 420);
  const absent = report('store:4', '2026-11-01', '2026-11-01', {
    attendance: new Map([['s', { status: 'absent' }]]),
  }).byTherapist.get('m');
  assert.equal(absent.pending, 0);
  assert.equal(absent.workMinutes, 0);
});

test('null amounts remain unknown rather than zero', () => {
  const missing = report('store:4', '2026-11-01', '2026-11-30', {
    bookings: [booking('missing', 4, '2026-11-01', '10:00:00', 'completed', null, null)],
  });
  assert.equal(missing.total.count, 1);
  assert.equal(missing.total.unknownSales, 1);
  assert.equal(missing.total.unknownPayout, 1);
  assert.equal(missing.profit, null);
});
