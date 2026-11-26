'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { japanBusinessDate } from '../../lib/businessDay.mjs';
import { dateText, nextDate, firstOfMonth, emptyMetrics, selectStores, summarizeReport, toDate, expenseCategories } from '../../lib/monthlyReport.mjs';
const yen = value => value == null ? '—' : `¥${Number(value).toLocaleString('ja-JP')}`;
const sections = [
  ['summary', '売上・給与・経費・利益'],
  ['daily', '日別売上グラフ'],
  ['therapists', 'セラピスト別成績・稼働率'],
  ['breakdown', '新規・リピート・指名・コース別'],
  ['inquiries', '成約・不成約'],
  ['nominations', '女の子別F・P・R集計'],
  ['expenseBreakdown', '経費内訳'],
  ['expenseDetails', '経費明細'],
];
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
export default function MonthlyReport({ stores, initialReport = null }) {
  const today = japanBusinessDate();
  const [scope, setScope] = useState('all');
  const [start, setStart] = useState(firstOfMonth(today));
  const [end, setEnd] = useState(today);
  const [included, setIncluded] = useState(sections.map(([key]) => key));
  const [report, setReport] = useState(initialReport);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const options = useMemo(() => [
    ['all', '全店舗'],
    ['brand:marron', 'MarroN全店'],
    ['brand:resort-style', 'Resort-style全店'],
    ...stores.map(store => [`store:${store.id}`, store.name === 'MarroN' ? 'MarroN' : `Resort-style ${store.name}`]),
  ], [stores]);
  const selectedStores = useMemo(() => selectStores(stores, scope), [scope, stores]);
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
    const form = new FormData(event.currentTarget);
    const rangeStart = String(form.get('start') || '');
    const rangeEnd = String(form.get('end') || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rangeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(rangeEnd) || rangeStart > rangeEnd || !selectedStores.length || busy) return;
    setStart(rangeStart); setEnd(rangeEnd);
    setBusy(true); setError(''); setReport(null);
    try {
      const ids = selectedStores.map(s => s.id);
      const [bookings, expenses, inquiries, schedules, therapistRows] = await Promise.all([
        loadAll('resort_bookings', 'id,store_id,therapist_id,booking_date,start_time,status,total_amount,therapist_payout,duration_minutes,nomination_fee,nomination_code,is_first_visit,course_name,payment_method',
          q => q.in('store_id', ids).gte('booking_date', rangeStart).lte('booking_date', nextDate(rangeEnd))),
        loadAll('resort_expenses', 'id,store_id,expense_month,expense_date,category,purpose,amount,is_archived',
          q => q.in('store_id', ids)),
        loadAll('resort_booking_inquiries', 'id,store_id,inquiry_date',
          q => q.in('store_id', ids).gte('inquiry_date', rangeStart).lte('inquiry_date', rangeEnd)),
        loadAll('resort_schedules', 'id,store_id,therapist_id,work_date,start_time,end_time',
          q => q.in('store_id', ids).gte('work_date', rangeStart).lte('work_date', rangeEnd)),
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
      setReport({ start: rangeStart, end: rangeEnd, scopeLabel, ...summarizeReport({
        bookings, expenses, inquiries, schedules, attendance, therapists: therapistRows,
        start: rangeStart, end: rangeEnd,
      }) });
    } catch (reason) {
      setError('集計できませんでした。再ログインまたは通信状態を確認してください：' + reason.message);
    } finally { setBusy(false); }
  }
  const selected = key => included.includes(key);
  const dailyRows = [];
  if (report) for (let day = report.start; day <= report.end; day = nextDate(day)) dailyRows.push([day, report.daily.get(day) || emptyMetrics()]);
  const maxSales = Math.max(1, ...dailyRows.map(([, row]) => row.sales));
  const storeNames = new Map(stores.map(store => [store.id, store.name]));
  const expenseCategoryRows = report ? Array.from(report.expenseByCategory).sort((a, b) => b[1] - a[1]) : [];
  const maxExpense = Math.max(1, ...expenseCategoryRows.map(([, amount]) => amount));
  const nominationTotals = report ? Array.from(report.byTherapist.values()).reduce((sum, t) => {
    for (const key of ['F', 'P', 'R', 'unknown']) sum[key] += t.nominationCounts[key];
    return sum;
  }, { F: 0, P: 0, R: 0, unknown: 0 }) : null;
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
        <label>集計開始日<input name="start" type="date" required value={start} onInput={e => { setStart(e.currentTarget.value); setReport(null); }} onChange={e => { setStart(e.target.value); setReport(null); }} /></label>
        <label>集計終了日<input name="end" type="date" required value={end} onInput={e => { setEnd(e.currentTarget.value); setReport(null); }} onChange={e => { setEnd(e.target.value); setReport(null); }} /></label>
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
          {Boolean(report.total.unknownSales || report.total.unknownPayout || report.undatedExpenses.length || report.missingPayment) &&
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
              <tr key={t.id}><td>{t.name}</td><td>{t.count}件</td><td>{t.unknownSales ? '—' : yen(t.sales)}</td><td>{t.unknownPayout ? '—' : yen(t.payout)}</td><td>{t.minutes}分</td><td>{t.workMinutes}分{t.pending ? `（予定ベース${t.pending}件）` : ''}</td><td>{t.workMinutes ? `${Math.round(t.minutes / t.workMinutes * 100)}%${t.pending ? '（暫定）' : ''}` : '—'}</td></tr>)}</tbody>
          </table><p>稼働率＝会計済み施術時間÷出勤実働時間。実績未入力の出勤は予定時間で暫定計算。出勤0分は「—」です。</p>
        </section>}
        {selected('nominations') && <section><h3>女の子別F・P・R集計</h3>
          <p>会計済みの接客を指名コードで分類。F＝「なし」またはF、P＝P500・P1000、R＝R1000・R2000。R率＝R件数÷区分判明件数（F＋P＋R）。区分不明は分母から除外します。</p>
          <div className="monthly-report-table-wrap"><table><thead><tr><th>女の子</th><th>F</th><th>P</th><th>R</th><th>分類計</th><th>不明</th><th>R率</th></tr></thead>
            <tbody>{Array.from(report.byTherapist.values()).filter(t => t.count || t.shifts).sort((a, b) => b.sales - a.sales).map(t => {
              const n = t.nominationCounts, known = n.F + n.P + n.R;
              return <tr key={t.id}><td>{t.name}</td><td>{n.F}件</td><td>{n.P}件</td><td>{n.R}件</td><td>{known}件</td><td>{n.unknown}件</td><td>{known ? `${Math.round(n.R / known * 100)}%` : '—'}</td></tr>;
            })}</tbody><tfoot><tr><th>合計</th><th>{nominationTotals.F}件</th><th>{nominationTotals.P}件</th><th>{nominationTotals.R}件</th><th>{nominationTotals.F + nominationTotals.P + nominationTotals.R}件</th><th>{nominationTotals.unknown}件</th><th>{nominationTotals.F + nominationTotals.P + nominationTotals.R ? `${Math.round(nominationTotals.R / (nominationTotals.F + nominationTotals.P + nominationTotals.R) * 100)}%` : '—'}</th></tr></tfoot></table></div>
          <h4>売上・稼働</h4><div className="monthly-report-table-wrap"><table><thead><tr><th>女の子</th><th>売上</th><th>バック</th><th>店舗利益（経費前）</th><th>出勤日数</th><th>稼働率</th></tr></thead><tbody>
            {Array.from(report.byTherapist.values()).filter(t => t.count || t.shifts).sort((a,b)=>b.sales-a.sales).map(t=><tr key={t.id}><td>{t.name}</td><td>{t.unknownSales ? '—' : yen(t.sales)}</td><td>{t.unknownPayout ? '—' : yen(t.payout)}</td><td>{t.unknownSales || t.unknownPayout ? '—' : yen(t.sales - t.payout)}</td><td>{t.workDates.size}日</td><td>{t.workMinutes ? `${Math.round(t.minutes / t.workMinutes * 100)}%${t.pending ? '（暫定）' : ''}` : '—'}</td></tr>)}
          </tbody></table></div>
          <p>分類計と不明の合計が会計済み接客件数です。店舗利益は売上−キャストバックで、共通経費は女の子へ配賦していません。出勤日数は実働がある出勤日の重複を除いた日数です。実績未入力の出勤時間・稼働率は予定ベースの暫定値です。</p>
        </section>}
        {selected('expenseBreakdown') && <section><h3>経費内訳</h3>
          <p>対象期間の経費合計：{report.undatedExpenses.length ? '—（日付未入力の経費が期間内に配分できません）' : yen(report.expenseTotal)}</p>
          <h4>カテゴリ別・内訳グラフ</h4>
          {expenseCategoryRows.length ? expenseCategoryRows.map(([category, amount]) => <div className="monthly-report-bar" key={category}><span>{expenseCategories[category] || '区分不明'}</span><div><i style={{width:`${amount / maxExpense * 100}%`}}/></div><strong>{yen(amount)}</strong><small></small></div>) : <p>対象期間の経費は0件です。</p>}
          <h4>用途別</h4><div className="monthly-report-table-wrap"><table><thead><tr><th>用途</th><th>金額</th></tr></thead><tbody>{Array.from(report.expenseByPurpose).sort((a,b)=>b[1]-a[1]).map(([purpose, amount])=><tr key={purpose}><td>{purpose}</td><td>{yen(amount)}</td></tr>)}</tbody></table></div>
          <h4>店舗別</h4><div className="monthly-report-table-wrap"><table><thead><tr><th>店舗</th><th>金額</th></tr></thead><tbody>{Array.from(report.expenseByStore).sort((a,b)=>b[1]-a[1]).map(([id, amount])=><tr key={id}><td>{storeNames.get(id) || '店舗不明'}</td><td>{yen(amount)}</td></tr>)}</tbody></table></div>
          {report.undatedExpenses.length > 0 && <p className="monthly-report-warning">日付未入力 {report.undatedExpenses.length}件は対象の月全体を含まないため、合計・内訳・明細に算入していません。</p>}
        </section>}
        {selected('expenseDetails') && <section><h3>経費明細</h3>
          <p>日付のない経費は計上月を表示します。月全体を含む期間のみ明細へ算入します。</p>
          <div className="monthly-report-table-wrap"><table><thead><tr><th>日付・計上月</th><th>店舗</th><th>用途</th><th>カテゴリ</th><th>金額</th></tr></thead><tbody>{[...report.includedExpenses].sort((a,b)=>(a.expense_date || a.expense_month).localeCompare(b.expense_date || b.expense_month)).map(e=><tr key={e.id}><td>{e.expense_date || `${e.expense_month}（日付未入力）`}</td><td>{storeNames.get(e.store_id) || '店舗不明'}</td><td>{e.purpose || '用途未入力'}</td><td>{expenseCategories[e.category] || '区分不明'}</td><td>{yen(e.amount)}</td></tr>)}</tbody></table></div>
          {!report.includedExpenses.length && <p>対象期間の経費は0件です。</p>}
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
