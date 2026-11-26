'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { bookingBusinessDate, inBusinessHours, japanBusinessDate } from '../../lib/businessDay.mjs';
import attendanceMath from '../../lib/attendance.cjs';

const { attendanceDetails } = attendanceMath;
const yen = value => value == null ? '—' : `¥${Number(value).toLocaleString('ja-JP')}`;
const sections = [
  ['summary', '売上・給与・経費・利益'],
  ['daily', '日別売上グラフ'],
  ['therapists', 'セラピスト別成績・稼働率'],
  ['breakdown', '新規・リピート・指名・コース別'],
  ['inquiries', '成約・不成約'],
];
const toDate = value => new Date(`${value}T00:00:00Z`);
const dateText = date => date.toISOString().slice(0, 10);
const nextDate = value => dateText(new Date(toDate(value).getTime() + 86400000));
const firstOfMonth = value => value.slice(0, 7) + '-01';
const lastOfMonth = value => dateText(new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)), 0)));
const emptyMetrics = () => ({ count: 0, sales: 0, payout: 0, unknownSales: 0, unknownPayout: 0 });
function addBooking(target, booking) {
  target.count += 1;
  if (booking.total_amount == null) target.unknownSales += 1;
  else target.sales += Number(booking.total_amount);
  if (booking.therapist_payout == null) target.unknownPayout += 1;
  else target.payout += Number(booking.therapist_payout);
}
async function loadAll(table, fields, apply) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    let query = supabase.from(table).select(fields).order('id').range(offset, offset + 999);
    query = apply(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}
function summarize({ bookings, expenses, inquiries, schedules, attendance, therapists, start, end }) {
  const completed = bookings.filter(b => b.status === 'completed' &&
    inBusinessHours(b.start_time) && bookingBusinessDate(b) >= start && bookingBusinessDate(b) <= end);
  const within = bookings.filter(b => inBusinessHours(b.start_time) &&
    bookingBusinessDate(b) >= start && bookingBusinessDate(b) <= end);
  const lost = inquiries.filter(i => i.inquiry_date >= start && i.inquiry_date <= end);
  const total = emptyMetrics();
  const daily = new Map();
  const byTherapist = new Map(therapists.map(t => [t.id, { name: t.name, ...emptyMetrics(), minutes: 0, workMinutes: 0, pending: 0, shifts: 0, nomination: 0, repeat: 0 }]));
  const courses = new Map();
  for (const b of completed) {
    addBooking(total, b);
    const day = bookingBusinessDate(b);
    if (!daily.has(day)) daily.set(day, emptyMetrics());
    addBooking(daily.get(day), b);
    if (!byTherapist.has(b.therapist_id)) byTherapist.set(b.therapist_id, { name: '登録済みセラピスト', ...emptyMetrics(), minutes: 0, workMinutes: 0, pending: 0, shifts: 0, nomination: 0, repeat: 0 });
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

export default function MonthlyReport({ stores }) {
  const today = japanBusinessDate();
  const [scope, setScope] = useState('all');
  const [start, setStart] = useState(firstOfMonth(today));
  const [end, setEnd] = useState(today);
  const [included, setIncluded] = useState(sections.map(([key]) => key));
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const options = useMemo(() => [
    ['all', '全店舗'],
    ['brand:marron', 'MarroN全店'],
    ['brand:resort-style', 'Resort-style全店'],
    ...stores.map(store => [`store:${store.id}`, store.name === 'MarroN' ? 'MarroN' : `Resort-style ${store.name}`]),
  ], [stores]);
  const selectedStores = useMemo(() => stores.filter(s => scope === 'all' ||
    (scope.startsWith('brand:') && s.brand_code === scope.slice(6)) ||
    scope === `store:${s.id}`), [scope, stores]);
  const scopeLabel = options.find(([value]) => value === scope)?.[1] || '全店舗';

  function preset(mode) {
    const monthStart = firstOfMonth(today);
    if (mode === 'this') { setStart(monthStart); setEnd(today); }
    if (mode === 'last') {
      const last = dateText(new Date(toDate(monthStart).getTime() - 86400000));
      setStart(firstOfMonth(last)); setEnd(last);
    }
    if (mode === 'year') { setStart(today.slice(0, 4) + '-01-01'); setEnd(today); }
    setReport(null);
  }
  async function run(event) {
    event.preventDefault();
    if (!start || !end || start > end || !selectedStores.length || busy) return;
    setBusy(true); setError(''); setReport(null);
    try {
      const ids = selectedStores.map(s => s.id);
      const [bookings, expenses, inquiries, schedules, therapistRows] = await Promise.all([
        loadAll('resort_bookings', 'id,store_id,therapist_id,booking_date,start_time,status,total_amount,therapist_payout,duration_minutes,nomination_fee,is_first_visit,course_name,payment_method',
          q => q.in('store_id', ids).gte('booking_date', start).lte('booking_date', nextDate(end))),
        loadAll('resort_expenses', 'id,store_id,expense_month,expense_date,amount,is_archived',
          q => q.in('store_id', ids)),
        loadAll('resort_booking_inquiries', 'id,store_id,inquiry_date',
          q => q.in('store_id', ids).gte('inquiry_date', start).lte('inquiry_date', end)),
        loadAll('resort_schedules', 'id,store_id,therapist_id,work_date,start_time,end_time',
          q => q.in('store_id', ids).gte('work_date', start).lte('work_date', end)),
        loadAll('resort_therapists', 'id,name', q => q),
      ]);
      const scheduleIds = schedules.map(s => s.id);
      const attendance = new Map();
      for (let offset = 0; offset < scheduleIds.length; offset += 200) {
        const { data, error: attendanceError } = await supabase.from('resort_schedule_attendance')
          .select('schedule_id,status,actual_start_time,actual_end_time').in('schedule_id', scheduleIds.slice(offset, offset + 200));
        if (attendanceError) throw attendanceError;
        for (const row of data || []) attendance.set(row.schedule_id, row);
      }
      setReport({ start, end, scopeLabel, ...summarize({
        bookings, expenses, inquiries, schedules, attendance, therapists: therapistRows,
        start, end,
      }) });
    } catch (reason) {
      setError('集計できませんでした。再ログインまたは通信状態を確認してください：' + reason.message);
    } finally { setBusy(false); }
  }
  const selected = key => included.includes(key);
  const dailyRows = [];
  if (report) for (let day = report.start; day <= report.end; day = nextDate(day)) dailyRows.push([day, report.daily.get(day) || emptyMetrics()]);
  const maxSales = Math.max(1, ...dailyRows.map(([, row]) => row.sales));
  return <section className="monthly-report">
    <form className="admin-panel admin-form monthly-report-controls" onSubmit={run}>
      <h2>集計・月報</h2>
      <div className="admin-grid">
        <label>対象店舗<select value={scope} onChange={e => { setScope(e.target.value); setReport(null); }}>
          {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <div className="admin-row-actions monthly-report-presets">
          <button type="button" onClick={() => preset('this')}>今月</button>
          <button type="button" onClick={() => preset('last')}>先月</button>
          <button type="button" onClick={() => preset('year')}>今年</button>
        </div>
        <label>集計開始日<input type="date" required value={start} onChange={e => { setStart(e.target.value); setReport(null); }} /></label>
        <label>集計終了日<input type="date" required min={start} value={end} onChange={e => { setEnd(e.target.value); setReport(null); }} /></label>
      </div>
      <fieldset><legend>PDFに出力する項目</legend><div className="admin-checks">
        {sections.map(([key, label]) => <label key={key}><input type="checkbox" checked={selected(key)}
          onChange={e => setIncluded(current => e.target.checked ? [...current, key] : current.filter(x => x !== key))} />{label}</label>)}
      </div></fieldset>
      <button className="admin-primary" disabled={busy || start > end || !selectedStores.length}>{busy ? '集計中…' : '集計してプレビュー'}</button>
      {error && <p role="alert" className="admin-message">{error}</p>}
    </form>
    {report && <>
      <div className="admin-row-actions monthly-report-actions">
        <button type="button" disabled={!included.length} onClick={() => window.print()}>印刷プレビュー・PDF保存</button>
        <span>印刷画面で「PDFに保存」を選択してください。</span>
      </div>
      <article className="monthly-report-preview" aria-label="A4月報プレビュー">
        <header><h2>店舗集計・月報</h2><p>{report.scopeLabel}　{report.start} 〜 {report.end}（営業日基準）</p></header>
        <p className="monthly-report-note">営業日：10:00〜翌05:00。会計済み予約だけを売上・給与に算入。給与は予約ごとのキャストバック合計です。</p>
        {selected('summary') && <section><h3>売上と利益</h3><div className="monthly-report-metrics">
          <div>売上<strong>{report.total.unknownSales ? '—' : yen(report.total.sales)}</strong></div>
          <div>給与（予約バック）<strong>{report.total.unknownPayout ? '—' : yen(report.total.payout)}</strong></div>
          <div>経費<strong>{report.undatedExpenses.length ? '—' : yen(report.expenseTotal)}</strong></div>
          <div>利益<strong>{yen(report.profit)}</strong></div>
        </div>
          <p>会計済み {report.total.count}件 ／ 経費は集計対象期間に日付がある記録、または月全体が含まれる日付未入力の記録を算入。</p>
          {(report.total.unknownSales || report.total.unknownPayout || report.undatedExpenses.length || report.missingPayment) &&
            <p className="monthly-report-warning">要確認：売上未入力 {report.total.unknownSales}件、給与未入力 {report.total.unknownPayout}件、期間内に日付を配分できない経費 {report.undatedExpenses.length}件（{yen(report.undatedExpenses.reduce((a, e) => a + Number(e.amount), 0))}）、会計済みで支払方法が未会計 {report.missingPayment}件。</p>}
        </section>}
        {selected('daily') && <section><h3>営業日別売上</h3>
          {dailyRows.length ? dailyRows.map(([day, value]) => <div key={day} className="monthly-report-bar">
            <span>{day}</span><div><i style={{ width: `${Math.max(2, value.sales / maxSales * 100)}%` }} /></div>
            <strong>{value.unknownSales ? '—' : yen(value.sales)}</strong><small>{value.count}件</small>
          </div>) : <p>会計済みの予約は0件です。</p>}
        </section>}
        {selected('therapists') && <section><h3>セラピスト別成績・稼働</h3>
          <table><thead><tr><th>セラピスト</th><th>接客</th><th>売上</th><th>給与</th><th>施術</th><th>出勤</th><th>稼働率</th></tr></thead>
            <tbody>{Array.from(report.byTherapist.values()).filter(t => t.count || t.shifts).sort((a, b) => b.sales - a.sales).map(t =>
              <tr key={t.name}><td>{t.name}</td><td>{t.count}件</td><td>{t.unknownSales ? '—' : yen(t.sales)}</td><td>{t.unknownPayout ? '—' : yen(t.payout)}</td><td>{t.minutes}分</td><td>{t.workMinutes}分{t.pending ? `（予定ベース${t.pending}件）` : ''}</td><td>{t.workMinutes ? `${Math.round(t.minutes / t.workMinutes * 100)}%${t.pending ? '（暫定）' : ''}` : '—'}</td></tr>)}</tbody>
          </table><p>稼働率＝会計済み施術時間÷出勤実働時間。実績未入力の出勤は予定時間で暫定計算。出勤0分は「—」です。</p>
        </section>}
        {selected('breakdown') && <section><h3>来店とコース</h3>
          <p>新規 {report.completed.filter(b => b.is_first_visit === true).length}件 ／ リピーター {report.completed.filter(b => b.is_first_visit === false).length}件 ／ 指名 {report.completed.filter(b => Number(b.nomination_fee) > 0).length}件</p>
          <table><thead><tr><th>コース</th><th>件数</th></tr></thead><tbody>{Array.from(report.courses).sort((a, b) => b[1] - a[1]).map(([name, count]) => <tr key={name}><td>{name}</td><td>{count}件</td></tr>)}</tbody></table>
        </section>}
        {selected('inquiries') && <section><h3>成約・不成約</h3>
          <p>成約（会計済み） {report.completed.length}件 ／ 不成約（問い合わせ記録） {report.lost.length}件 ／ 予約・その他 {report.within.length - report.completed.length}件</p>
          <p>不成約日は記録された日付を使用します。予約と問い合わせの重複登録がある場合、件数は重複します。</p>
        </section>}
        <footer>本レポートは登録済みデータから作成した管理用資料です。未記録の取引・経費は含みません。</footer>
      </article>
    </>}
  </section>;
}
