'use client';
import pricing from '../../lib/marronPricing.cjs';
const {COURSES,NOMINATIONS}=pricing;
const START_TIMES=Array.from({length:96},(_,i)=>{const time=`${String(Math.floor(i/4)).padStart(2,'0')}:${String(i%4*15).padStart(2,'0')}`;return [time,time]});
const OPTION_FEES=Array.from({length:31},(_,i)=>[i*500,`${(i*500).toLocaleString('ja-JP')}円`]);
function preserveCurrent(options,value,label){return value!==''&&value!=null&&!options.some(([v])=>String(v)===String(value))?[[value,`${label}（保存済み）`],...options]:options;}
export default function MarronBookingFields({ booking, setBooking, customers, stores, therapists, labels }) {
 const set=(key,value)=>setBooking({...booking,[key]:value});
 return <>
  <div className="admin-grid marron-booking-grid">
   <Choice label="顧客" value={booking.customer_id} onChange={v=>set('customer_id',v)} options={customers.map(c=>[c.id,`${c.name}（${c.phone}）${c.is_blocked?' ⚠':''}`])}/>
   <Choice label="店舗" value={booking.store_id} onChange={v=>set('store_id',v)} options={stores.map(s=>[s.id,s.name])}/>
   <Choice label="ルーム" value={booking.room_number} onChange={v=>set('room_number',v)} options={[[1,'ルーム1'],[2,'ルーム2']]}/>
   <Choice label="女の子" value={booking.therapist_id} onChange={v=>set('therapist_id',v)} options={therapists.map(t=>[t.id,t.name])}/>
   <label>日付<input type="date" required value={booking.booking_date} onChange={e=>set('booking_date',e.target.value)}/></label>
   <Choice label="開始時間" value={booking.start_time} onChange={v=>set('start_time',v)} options={preserveCurrent(START_TIMES,booking.start_time,booking.start_time)}/>
   <Choice label="コース名" value={booking.course_name} onChange={v=>set('course_name',v)} options={COURSES.map(c=>[c[0],c[0]])}/>
   <Choice label="延長" value={booking.extension_minutes} onChange={v=>set('extension_minutes',Number(v))} options={[[0,'なし'],[20,'20分'],[40,'40分'],[60,'60分']]}/>
   <Amount label="割引・割増" value={booking.price_adjustment} onChange={v=>set('price_adjustment',v)} signed hint="＋で割増／−で割引"/>
   <Choice label="オプション料金" value={booking.option_fee??0} onChange={v=>set('option_fee',Number(v))} options={preserveCurrent(OPTION_FEES,booking.option_fee,`${Number(booking.option_fee||0).toLocaleString('ja-JP')}円`)}/>
   <Amount label="キャストバック調整" value={booking.payout_adjustment} onChange={v=>set('payout_adjustment',v)} signed hint="＋で増額／−で減額"/>
   <div className="marron-grid-spacer" aria-hidden="true"/>
   <Choice label="指名料" value={booking.nomination_code} onChange={v=>set('nomination_code',v)} options={NOMINATIONS.map(n=>[n[0],n[0]])}/>
   <Choice label="支払い方法" value={booking.payment_method} onChange={v=>set('payment_method',v)} options={[["unpaid","未会計"],["cash","現金"],["card","カード"],["paypay","PayPay"],["other","その他"]]}/>
   <Choice label="状態" value={booking.status} onChange={v=>set('status',v)} options={Object.entries(labels)}/>
  </div>
  <label className="admin-switch"><input type="checkbox" checked={booking.is_first_visit} onChange={e=>set('is_first_visit',e.target.checked)}/>初回来店</label>
 </>;
}
function Choice({label,value,onChange,options}) {return <label>{label}<select required value={value??''} onChange={e=>onChange(e.target.value)}><option value="">選択してください</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
function Amount({label,value,onChange,signed,hint}) {return <label>{label}<input type="number" step="1" min={signed?undefined:0} value={value??0} onChange={e=>onChange(e.target.value)}/>{hint&&<small>{hint}</small>}</label>}
