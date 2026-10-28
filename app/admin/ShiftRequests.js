'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
export default function ShiftRequests({brand,onApproved}){
 const [rows,setRows]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const load=useCallback(async()=>{const {data,error}=await supabase.rpc('resort_mypage_action',{p_action:'admin_requests',p_data:{brand}});if(error){setMessage('申請一覧を読み込めませんでした。');setReady(false);}else{setRows(data||[]);setReady(true)}},[brand]);
 useEffect(()=>{load()},[load]);
 async function review(id,approve){if(busy)return;setBusy(true);try{const {error}=await supabase.rpc('resort_mypage_action',{p_action:approve?'admin_approve':'admin_reject',p_data:{brand,id}});if(error)throw error;setMessage(approve?'承認しました。確定した出勤予定に反映しました。':'申請を見送りにしました。');await load();if(approve)await onApproved();}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 const pending=rows.filter(r=>r.status==='pending');
 return <section className="admin-panel" style={{marginBottom:24}}><div className="admin-panel-title"><h2>出勤申請（仮） {ready?`${pending.length}件`:''}</h2><button type="button" onClick={load} disabled={busy}>申請を更新</button></div><p>承認待ちはホームページの出勤情報に表示されません。承認すると出勤が確定します。</p>{message&&<p role="status">{message}</p>}{ready&&!pending.length&&<p>承認待ちの申請はありません。</p>}{pending.map(r=><article key={r.id} style={{padding:16,borderBottom:'1px solid #eee'}}><strong>{r.therapist_name} ／ {r.store_name}</strong><p>{r.work_date} {r.start_time?.slice(0,5)}〜{r.end_time?.slice(0,5)}{r.end_time<r.start_time?'（翌日終了）':''}</p>{r.note&&<p>{r.note}</p>}<div className="admin-row-actions"><button className="admin-primary" type="button" disabled={busy} onClick={()=>review(r.id,true)}>承認して出勤を確定</button><button type="button" disabled={busy} onClick={()=>review(r.id,false)}>見送り</button></div></article>)}{rows.some(r=>r.status!=='pending')&&<details><summary>処理済みの申請</summary>{rows.filter(r=>r.status!=='pending').map(r=><p key={r.id}>{r.work_date} {r.therapist_name} ／ {r.store_name} ／ {{approved:'承認済み',rejected:'見送り',cancelled:'取り下げ済み'}[r.status]}</p>)}</details>}</section>
}
