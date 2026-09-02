'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const jpDate = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`;
const blankCustomer = { id: '', name: '', phone: '', line_name: '', notes: '', caution: '', is_blocked: false };
const blankBooking = { id: '', store_id: '', room_number: '1', therapist_id: '', customer_id: '', booking_date: jpDate(), start_time: '', duration_minutes: 90, course_name: '90分コース', base_price: 0, nomination_fee: 0, extension_fee: 0, discount: 0, therapist_payout: 0, payment_method: 'unpaid', status: 'reserved', is_first_visit: true, notes: '' };
const labels = { reserved: '予約', completed: '会計済み', cancelled: 'キャンセル', no_show: '無断キャンセル' };
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
function currentJpMinutes() {
  const parts = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === 'hour')?.value || 0) * 60 + Number(parts.find((p) => p.type === 'minute')?.value || 0);
}
function bookingStart(row) {
  const [hour, minute] = (row.start_time || '00:00').split(':').map(Number);
  return hour * 60 + minute;
}

export default function Operations({ stores, therapists, schedules, notify }) {
  const [view, setView] = useState('dashboard');
  const [month, setMonth] = useState(jpDate().slice(0, 7));
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customer, setCustomer] = useState(blankCustomer);
  const [booking, setBooking] = useState(blankBooking);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([
      supabase.from('resort_customers').select('*').order('created_at', { ascending: false }),
      supabase.from('resort_bookings').select('*, resort_stores(name), resort_therapists(name), resort_customers(name, phone)').order('booking_date', { ascending: false }).order('start_time', { ascending: false }),
    ]);
    if (c.error || b.error) return notify(`データを読み込めませんでした：${(c.error || b.error).message}`);
    setCustomers(c.data || []); setBookings(b.data || []);
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const monthRows = useMemo(() => bookings.filter((b) => b.booking_date.startsWith(month)), [bookings, month]);
  const completed = monthRows.filter((b) => b.status === 'completed');
  const monthSales = completed.reduce((s, b) => s + b.total_amount, 0);
  const monthPayout = completed.reduce((s, b) => s + b.therapist_payout, 0);
  const metrics = {
    today: bookings.filter((b) => b.booking_date === jpDate() && b.status === 'completed').reduce((s, b) => s + b.total_amount, 0),
    unpaid: monthRows.filter((b) => b.payment_method === 'unpaid' && !['cancelled', 'no_show'].includes(b.status)).length,
    workers: new Set(schedules.filter((s) => s.work_date === jpDate()).map((s) => s.therapist_id)).size,
  };
  const storeRows = stores.map((s) => {
    const rows = completed.filter((b) => b.store_id === s.id);
    const sales = rows.reduce((n, b) => n + b.total_amount, 0);
    const payout = rows.reduce((n, b) => n + b.therapist_payout, 0);
    return { ...s, count: rows.length, sales, payout };
  });
  const activity = therapists.map((t) => {
    const rows = completed.filter((b) => b.therapist_id === t.id);
    const minutes = rows.reduce((n, b) => n + b.duration_minutes, 0);
    const workMinutes = schedules.filter((s) => s.therapist_id === t.id && s.work_date.startsWith(month)).reduce((n, s) => {
      if (!s.start_time || !s.end_time) return n;
      const a = s.start_time.split(':').map(Number), z = s.end_time.split(':').map(Number);
      return n + Math.max(0, z[0] * 60 + z[1] - a[0] * 60 - a[1]);
    }, 0);
    return { ...t, count: rows.length, minutes, utilization: workMinutes ? Math.min(100, Math.round(minutes / workMinutes * 100)) : null, sales: rows.reduce((n, b) => n + b.total_amount, 0), payout: rows.reduce((n, b) => n + b.therapist_payout, 0), nomination: rows.filter((b) => b.nomination_fee > 0).length, repeat: rows.filter((b) => !b.is_first_visit).length };
  }).sort((a, b) => b.sales - a.sales);
  const customerRows = customers.filter((c) => `${c.name}${c.phone}${c.line_name || ''}`.toLowerCase().includes(search.toLowerCase())).map((c) => {
    const rows = bookings.filter((b) => b.customer_id === c.id && b.status === 'completed');
    return { ...c, visits: rows.length, last: rows.map((b) => b.booking_date).sort().at(-1) || '—', total: rows.reduce((n, b) => n + b.total_amount, 0) };
  });
  const total = Math.max(0, Number(booking.base_price || 0) + Number(booking.nomination_fee || 0) + Number(booking.extension_fee || 0) - Number(booking.discount || 0));
  const nowMinutes = currentJpMinutes();
  const roomRows = stores.flatMap((store) => [1, 2].map((roomNumber) => {
    const rows = bookings.filter((b) => b.store_id === store.id && b.room_number === roomNumber && b.booking_date === jpDate() && !['cancelled', 'no_show'].includes(b.status)).sort((a, b) => bookingStart(a) - bookingStart(b));
    const active = rows.find((b) => bookingStart(b) <= nowMinutes && nowMinutes < bookingStart(b) + b.duration_minutes);
    const next = rows.find((b) => bookingStart(b) > nowMinutes);
    return { store, roomNumber, rows, active, next };
  }));

  async function saveCustomer(e) {
    e.preventDefault(); setSaving(true);
    const payload = { name: customer.name.trim(), phone: customer.phone.trim(), line_name: customer.line_name || null, notes: customer.notes, caution: customer.caution, is_blocked: customer.is_blocked };
    const q = customer.id ? supabase.from('resort_customers').update(payload).eq('id', customer.id) : supabase.from('resort_customers').insert(payload);
    const { error } = await q;
    notify(error ? (error.code === '23505' ? '同じ電話番号の顧客が登録済みです。' : `保存できませんでした：${error.message}`) : '顧客情報を保存しました。');
    if (!error) { setCustomer(blankCustomer); await load(); } setSaving(false);
  }
  async function saveBooking(e) {
    e.preventDefault(); setSaving(true);
    const payload = { store_id: Number(booking.store_id), room_number: Number(booking.room_number), therapist_id: booking.therapist_id, customer_id: booking.customer_id, booking_date: booking.booking_date, start_time: booking.start_time, duration_minutes: Number(booking.duration_minutes), course_name: booking.course_name, base_price: Number(booking.base_price || 0), nomination_fee: Number(booking.nomination_fee || 0), extension_fee: Number(booking.extension_fee || 0), discount: Number(booking.discount || 0), therapist_payout: Number(booking.therapist_payout || 0), payment_method: booking.payment_method, status: booking.status, is_first_visit: booking.is_first_visit, notes: booking.notes };
    const q = booking.id ? supabase.from('resort_bookings').update(payload).eq('id', booking.id) : supabase.from('resort_bookings').insert(payload);
    const { error } = await q; notify(error ? `保存できませんでした：${error.message}` : '予約・会計情報を保存しました。');
    if (!error) { setBooking(blankBooking); await load(); } setSaving(false);
  }
  async function removeBooking(id) {
    if (!confirm('この予約を削除しますか？')) return;
    const { error } = await supabase.from('resort_bookings').delete().eq('id', id);
    notify(error ? `削除できませんでした：${error.message}` : '予約を削除しました。'); if (!error) await load();
  }
  function exportCsv() {
    const head = ['日付','開始','店舗','ルーム','女の子','顧客','電話','コース','分','売上','バック','実質売上','支払','状態'];
    const rows = monthRows.map((b) => [b.booking_date,b.start_time?.slice(0,5),b.resort_stores?.name,`ルーム${b.room_number}`,b.resort_therapists?.name,b.resort_customers?.name,b.resort_customers?.phone,b.course_name,b.duration_minutes,b.total_amount,b.therapist_payout,b.total_amount-b.therapist_payout,b.payment_method,labels[b.status]]);
    const blob = new Blob(['\ufeff' + [head, ...rows].map((r) => r.map(csv).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `resort-style-${month}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return <section>
    <nav className="admin-subtabs">{[['dashboard','売上状況'],['bookings','予約・会計'],['customers','顧客管理'],['activity','稼働状況']].map(([k,l]) => <button key={k} className={view === k ? 'active' : ''} onClick={() => setView(k)}>{l}</button>)}</nav>
    {view !== 'customers' && <div className="admin-toolbar"><label>対象月<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>{view === 'bookings' && <button onClick={exportCsv}>CSV出力</button>}</div>}
    {view === 'dashboard' && <><div className="admin-metrics"><Metric label="本日の売上" value={yen(metrics.today)} /><Metric label={`${month} 売上`} value={yen(monthSales)} /><Metric label="店舗実質売上" value={yen(monthSales-monthPayout)} /><Metric label="予約件数" value={`${monthRows.length}件`} /><Metric label="本日の出勤" value={`${metrics.workers}人`} /><Metric label="未会計" value={`${metrics.unpaid}件`} warn={metrics.unpaid > 0} /></div><Table head={['店舗','会計件数','売上','バック','店舗実質売上']} rows={storeRows.map((s) => [s.name,`${s.count}件`,yen(s.sales),yen(s.payout),yen(s.sales-s.payout)])} /></>}
    {view === 'bookings' && <><form className="admin-panel admin-form" onSubmit={saveBooking}><div className="admin-panel-title"><h2>{booking.id ? '予約・会計を編集' : '予約を登録'}</h2>{booking.id && <button type="button" onClick={() => setBooking(blankBooking)}>新規登録に戻る</button>}</div><div className="admin-grid admin-grid-3">
      <Select label="顧客" value={booking.customer_id} set={(v)=>setBooking({...booking,customer_id:v})} options={customers.map((c)=>[c.id,`${c.name}（${c.phone}）${c.is_blocked?' ⚠':''}`])} />
      <Select label="店舗" value={booking.store_id} set={(v)=>setBooking({...booking,store_id:v})} options={stores.map((s)=>[s.id,s.name])} />
      <Select label="ルーム" value={booking.room_number} set={(v)=>setBooking({...booking,room_number:v})} options={[[1,'ルーム1'],[2,'ルーム2']]} />
      <Select label="女の子" value={booking.therapist_id} set={(v)=>setBooking({...booking,therapist_id:v})} options={therapists.map((t)=>[t.id,t.name])} />
      <Input label="日付" type="date" value={booking.booking_date} set={(v)=>setBooking({...booking,booking_date:v})} /><Input label="開始時間" type="time" value={booking.start_time} set={(v)=>setBooking({...booking,start_time:v})} /><Input label="施術時間（分）" type="number" value={booking.duration_minutes} set={(v)=>setBooking({...booking,duration_minutes:v})} />
      <Input label="コース名" value={booking.course_name} set={(v)=>setBooking({...booking,course_name:v})} /><Input label="コース料金" type="number" value={booking.base_price} set={(v)=>setBooking({...booking,base_price:v})} /><Input label="指名料" type="number" value={booking.nomination_fee} set={(v)=>setBooking({...booking,nomination_fee:v})} /><Input label="延長料金" type="number" value={booking.extension_fee} set={(v)=>setBooking({...booking,extension_fee:v})} /><Input label="割引" type="number" value={booking.discount} set={(v)=>setBooking({...booking,discount:v})} /><Input label="女の子バック" type="number" value={booking.therapist_payout} set={(v)=>setBooking({...booking,therapist_payout:v})} />
      <Select label="支払方法" value={booking.payment_method} set={(v)=>setBooking({...booking,payment_method:v})} options={[['unpaid','未会計'],['cash','現金'],['card','カード'],['paypay','PayPay'],['other','その他']]} />
      <Select label="状態" value={booking.status} set={(v)=>setBooking({...booking,status:v})} options={Object.entries(labels)} />
      <label className="admin-switch"><input type="checkbox" checked={booking.is_first_visit} onChange={(e)=>setBooking({...booking,is_first_visit:e.target.checked})}/>初回来店</label>
    </div><label>メモ<textarea rows="3" value={booking.notes} onChange={(e)=>setBooking({...booking,notes:e.target.value})}/></label><p className="admin-total">合計 <strong>{yen(total)}</strong>　店舗実質 <strong>{yen(total-Number(booking.therapist_payout||0))}</strong></p><button className="admin-primary" disabled={saving}>保存</button></form>
    <div className="admin-table-wrap admin-table-section"><table className="admin-table"><thead><tr>{['日時','店舗・ルーム・女の子','顧客','コース','売上','状態','操作'].map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{monthRows.map((b)=><tr key={b.id}><td>{b.booking_date}<small>{b.start_time?.slice(0,5)}</small></td><td>{b.resort_stores?.name} ルーム{b.room_number}<small>{b.resort_therapists?.name}</small></td><td>{b.resort_customers?.name}<small>{b.resort_customers?.phone}</small></td><td>{b.course_name}<small>{b.duration_minutes}分</small></td><td>{yen(b.total_amount)}<small>実質 {yen(b.total_amount-b.therapist_payout)}</small></td><td><span className={`admin-badge ${b.status}`}>{b.payment_method==='unpaid'&&b.status==='reserved'?'未会計':labels[b.status]}</span></td><td><div className="admin-row-actions"><button onClick={()=>{setBooking({...blankBooking,...b,store_id:String(b.store_id),room_number:String(b.room_number),start_time:b.start_time?.slice(0,5)||''});scrollTo({top:0,behavior:'smooth'});}}>編集</button><button className="danger" onClick={()=>removeBooking(b.id)}>削除</button></div></td></tr>)}</tbody></table>{!monthRows.length&&<p className="admin-empty">対象月の予約はありません。</p>}</div></>}
    {view === 'customers' && <><form className="admin-panel admin-form" onSubmit={saveCustomer}><div className="admin-panel-title"><h2>{customer.id?'顧客情報を編集':'顧客を新規登録'}</h2>{customer.id&&<button type="button" onClick={()=>setCustomer(blankCustomer)}>新規登録に戻る</button>}</div><div className="admin-grid"><Input label="名前" value={customer.name} set={(v)=>setCustomer({...customer,name:v})}/><Input label="電話番号" type="tel" value={customer.phone} set={(v)=>setCustomer({...customer,phone:v})}/><Input label="LINE名" value={customer.line_name||''} set={(v)=>setCustomer({...customer,line_name:v})}/><label className="admin-switch"><input type="checkbox" checked={customer.is_blocked} onChange={(e)=>setCustomer({...customer,is_blocked:e.target.checked})}/>要注意・受付不可</label></div><label>接客メモ<textarea rows="3" value={customer.notes} onChange={(e)=>setCustomer({...customer,notes:e.target.value})}/></label><label>注意事項<textarea rows="3" value={customer.caution} onChange={(e)=>setCustomer({...customer,caution:e.target.value})}/></label><button className="admin-primary" disabled={saving}>顧客情報を保存</button></form><div className="admin-toolbar"><input placeholder="名前・電話番号・LINE名で検索" value={search} onChange={(e)=>setSearch(e.target.value)}/></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{['顧客','電話番号','来店','最終来店','累計利用額','操作'].map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{customerRows.map((c)=><tr key={c.id} className={c.is_blocked?'blocked':''}><td><strong>{c.name}</strong>{c.is_blocked&&<span className="admin-badge danger">要注意</span>}<small>{c.line_name? `LINE: ${c.line_name}`:''}</small></td><td>{c.phone}</td><td>{c.visits}回</td><td>{c.last}</td><td>{yen(c.total)}</td><td><button onClick={()=>{setCustomer({...blankCustomer,...c});scrollTo({top:0,behavior:'smooth'});}}>編集</button></td></tr>)}</tbody></table></div></>}
    {view === 'activity' && <><h2 className="admin-section-heading">本日のルーム稼働状況</h2><div className="admin-room-grid">{roomRows.map((room) => <article className={`admin-room-card ${room.active ? 'in-use' : ''}`} key={`${room.store.id}-${room.roomNumber}`}><div className="admin-room-card-head"><h3>{room.store.name.replace('店','')}ルーム{room.roomNumber}</h3><span>{room.active ? '利用中' : '空き'}</span></div>{room.active ? <><strong>{room.active.resort_therapists?.name}</strong><p>{room.active.start_time?.slice(0,5)}〜（{room.active.duration_minutes}分）</p><small>お客様：{room.active.resort_customers?.name}</small></> : <p className="admin-room-empty">現在は空いています</p>}{room.next && room.next.id !== room.active?.id && <p className="admin-room-next">次回 {room.next.start_time?.slice(0,5)}〜　{room.next.resort_therapists?.name}</p>}</article>)}</div><h2 className="admin-section-heading">女の子別 月間稼働</h2><Table head={['女の子','接客','施術時間','稼働率','売上','バック','指名','リピート']} rows={activity.map((t)=>[t.name,`${t.count}件`,`${t.minutes}分`,t.utilization===null?'—':`${t.utilization}%`,yen(t.sales),yen(t.payout),`${t.nomination}件`,`${t.repeat}件`])} /></>}
  </section>;
}

function Metric({ label, value, warn }) { return <article className={warn?'warning':''}><span>{label}</span><strong>{value}</strong></article>; }
function Input({ label, value, set, type='text' }) { return <label>{label}<input required type={type} min={type==='number'?'0':undefined} value={value} onChange={(e)=>set(e.target.value)}/></label>; }
function Select({ label, value, set, options }) { return <label>{label}<select required value={value} onChange={(e)=>set(e.target.value)}><option value="">選択してください</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>; }
function Table({ head, rows }) { return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{head.map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div>; }
