'use client';
import {useState} from 'react';
import {supabase} from '../../lib/supabase';
const categories = {
  "transport": "交通費",
  "utilities": "水道光熱費",
  "supplies": "備品・消耗品",
  "cleaning": "清掃・洗濯",
  "advertising": "広告費",
  "other": "その他",
  "uncategorized": "未分類"
};
const yen=n=>`¥${Number(n||0).toLocaleString('ja-JP')}`;
export default function ExpensesPanel({stores,month,rows,ready,onSaved}) {
 const blank=()=>({id:null,store_id:stores.length===1?String(stores[0].id):'',purpose:'',amount:'',expense_date:'',category:'uncategorized'});
 const [form,setForm]=useState(blank),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [filter, setFilter] = useState('');
 const totals = rows.reduce((sum, row) => {
  const category = row.category || 'uncategorized';
  sum[category] = (sum[category] || 0) + Number(row.amount);
  return sum;
 }, {});
 const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
 const visibleRows = rows.filter(row => !filter || (row.category || 'uncategorized') === filter)
  .sort((a, b) => (b.expense_date || '').localeCompare(a.expense_date || ''));
 async function save(event){
  event.preventDefault();if(busy)return;
  const amount=Number(form.amount),storeId=Number(form.store_id);
  if(!stores.some(s=>s.id===storeId)||!form.purpose.trim()||form.amount===''||!Number.isInteger(amount)||amount<0||amount>2147483647)return setMessage('用途・金額・店舗を正しく入力してください。');
  setBusy(true);setMessage('');
  try{
   const payload={store_id:storeId,expense_month:month,purpose:form.purpose.trim(),amount,expense_date:form.expense_date||null,category:form.category};
   const q=form.id?supabase.from('resort_expenses').update(payload).eq('id',form.id).in('store_id',stores.map(s=>s.id)):supabase.from('resort_expenses').insert(payload);
   const {error}=await q;if(error)throw error;
   setForm(blank());await onSaved();setMessage('経費を保存しました。');
  }catch{setMessage('経費を保存できませんでした。再ログインしてお試しください。');}finally{setBusy(false);}
 }
 async function archive(row){
  if(busy||!confirm('この経費を集計から外しますか？'))return;
  setBusy(true);setMessage('');
  try{const{error}=await supabase.from('resort_expenses').update({is_archived:true}).eq('id',row.id).in('store_id',stores.map(s=>s.id));if(error)throw error;await onSaved();if(form.id===row.id)setForm(blank());setMessage('経費を集計から外しました。');}
  catch{setMessage('経費を更新できませんでした。');}finally{setBusy(false);}
 }
 return <section className="admin-panel admin-expenses" aria-label="経費入力">
  <h2>経費</h2>
  <p>計上月 {month}（選択中の店舗）</p>
  {ready && <>
   <p>経費合計 <strong style={{fontSize:'1.6rem'}}>{yen(total)}</strong></p>
   <div className="admin-row-actions" aria-label="経費カテゴリで絞り込み">
    <button type="button" aria-pressed={!filter} onClick={() => setFilter('')}>すべて</button>
    {Object.entries(categories).map(([key, label]) =>
     <button type="button" key={key} aria-pressed={filter === key}
      onClick={() => setFilter(filter === key ? '' : key)}>{label} {yen(totals[key])}</button>
    )}
   </div>
  </>}
  <form className="admin-form" onSubmit={save}>
   <div className="admin-grid">
    {stores.length>1&&<label>店舗<select required disabled={busy} value={form.store_id} onChange={e=>setForm({...form,store_id:e.target.value})}><option value="">選択してください</option>{stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
    <label>日付（任意）<input type="date" disabled={busy} value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})}/></label>
    <label>カテゴリ<select disabled={busy} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
     {Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label}</option>)}
    </select></label>
    <label>内容<input required maxLength={200} placeholder="例：水道代（10月利用分）" disabled={busy} value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}/></label>
    <label>金額（円）<input type="number" required min="0" max="2147483647" step="1" disabled={busy} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
   </div>
   <button className="admin-primary" disabled={busy||!ready}>{busy?'保存中…':form.id?'経費を更新':'経費を追加'}</button>
   {form.id&&<button type="button" disabled={busy} onClick={()=>setForm(blank())}>編集をやめる</button>}
  </form><p role="status">{message}</p>
  {!ready?<p role="status">経費データを確認できていません。</p>:<><h3>明細{filter ? `（${categories[filter]}）` : ""}</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{['日付','カテゴリ','内容',...(stores.length>1?['店舗']:[]),'金額','操作'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visibleRows.map(row=><tr key={row.id}><td>{row.expense_date || '—'}</td><td>{categories[row.category] || categories.uncategorized}</td><td>{row.purpose}</td>{stores.length>1&&<td>{stores.find(s=>s.id===row.store_id)?.name}</td>}<td>{yen(row.amount)}</td><td><div className="admin-row-actions"><button disabled={busy} onClick={()=>setForm({...row,store_id:String(row.store_id),expense_date:row.expense_date||'',category:row.category||'uncategorized'})}>編集</button><button disabled={busy} onClick={()=>archive(row)}>集計から外す</button></div></td></tr>)}</tbody></table>{!visibleRows.length&&<p className="admin-empty">該当する経費はありません。</p>}</div></>}
 </section>;
}
