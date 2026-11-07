'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import attendanceMath from '../../lib/attendance.cjs';

const {attendanceDetails}=attendanceMath;
const timeValue=value=>value?.slice(0,5)||'';

export default function AttendancePanel({ schedules, records, selectedId, setSelectedId, onSaved, notify }) {
  const [status,setStatus]=useState('unrecorded');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const [note,setNote]=useState('');
  const [saving,setSaving]=useState(false);
  const selected=schedules.find(row=>row.id===selectedId);
  const current=records.find(row=>row.schedule_id===selectedId);
  useEffect(()=>{
    const record=records.find(item=>item.schedule_id===selectedId);
    setStatus(record?.status==='worked' && timeValue(record.actual_start_time)===timeValue(schedules.find(s=>s.id===selectedId)?.start_time) && timeValue(record.actual_end_time)===timeValue(schedules.find(s=>s.id===selectedId)?.end_time)
      ? 'on_schedule' : record?.status||'unrecorded');
    setStart(timeValue(record?.actual_start_time));
    setEnd(timeValue(record?.actual_end_time));
    setNote(record?.note||'');
    if(selectedId)document.getElementById('attendance-editor')?.scrollIntoView({behavior:'smooth',block:'start'});
  },[selectedId,records,schedules]);

  function select(row) {
    setSelectedId(row.id);
    document.getElementById('attendance-editor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function changeStatus(value) {
    setStatus(value);
    if(value==='on_schedule') {
      setStart(timeValue(selected?.start_time));
      setEnd(timeValue(selected?.end_time));
    } else if(value==='worked') {
      setStart(previous=>previous||timeValue(selected?.start_time));
      setEnd(previous=>previous||timeValue(selected?.end_time));
    }
  }

  async function save(event) {
    event.preventDefault();
    if(!selected||saving)return;
    if((status==='worked'||status==='on_schedule')&&(!start||!end||start===end)){
      notify('実際の開始・終了を別の時刻で入力してください。');return;
    }
    setSaving(true);
    try {
      const table=supabase.from('resort_schedule_attendance');
      const query=status==='unrecorded'
        ? table.delete().eq('schedule_id',selected.id).select('schedule_id')
        : table.upsert({schedule_id:selected.id,status:status==='on_schedule'?'worked':status,actual_start_time:status==='worked'||status==='on_schedule'?start:null,
            actual_end_time:status==='worked'||status==='on_schedule'?end:null,note:note.trim()},{onConflict:'schedule_id'}).select('schedule_id');
      const {data,error}=await query;
      if(error)throw error;
      if(status!=='unrecorded'&&!data?.length)throw new Error('保存結果を確認できませんでした。');
      await onSaved();
      notify('出勤実績を保存しました。');
    } catch(error){notify(`出勤実績を保存できませんでした：${error.message}`);}
    finally{setSaving(false);}
  }

  return <section className="admin-panel" id="attendance-editor">
    <h2>出勤実績（遅刻・早退・当日欠勤）</h2>
    <p>登録済みの出勤から「実績を入力」を選びます。実際の時刻は1分単位で入力でき、日付をまたぐ終了は翌日として計算します。</p>
    {selected?<form onSubmit={save}>
      <h3>{selected.work_date}　{selected.resort_therapists?.name}　{selected.resort_stores?.name}</h3>
      <p>予定：{timeValue(selected.start_time)||'—'}〜{timeValue(selected.end_time)||'—'}</p>
      <div className="admin-grid">
        <label>出勤状況<select value={status} onChange={e=>changeStatus(e.target.value)}>
          <option value="unrecorded">未入力（予定時間で暫定計算）</option>
          <option value="on_schedule" disabled={!selected.start_time||!selected.end_time}>予定通り（時刻を自動入力）</option>
          <option value="worked">出勤（実際の時刻を記録）</option>
          <option value="absent">当日欠勤（実働0分）</option>
        </select></label>
        {(status==='worked'||status==='on_schedule')&&<><label>実際の開始<input type="time" step="60" required value={start} onChange={e=>{setStart(e.target.value);setStatus('worked');}}/></label>
        <label>実際の終了<input type="time" step="60" required value={end} onChange={e=>{setEnd(e.target.value);setStatus('worked');}}/></label></>}
      </div>
      {status!=='unrecorded'&&<label>備考（任意）<textarea maxLength={500} rows={2} value={note} onChange={e=>setNote(e.target.value)}/></label>}
      {(status==='worked'||status==='on_schedule')&&start&&end&&start!==end&&<p>実働：{attendanceDetails(selected,{status,actual_start_time:start,actual_end_time:end}).minutes}分
        {attendanceDetails(selected,{status,actual_start_time:start,actual_end_time:end}).late&&'／遅刻'}
        {attendanceDetails(selected,{status,actual_start_time:start,actual_end_time:end}).early&&'／早退'}</p>}
      <div className="admin-row-actions"><button className="admin-primary" type="submit" disabled={saving}>{saving?'保存中…':'出勤実績を保存'}</button>
        <button type="button" onClick={()=>setSelectedId('')}>閉じる</button></div>
    </form>:<p>下の出勤一覧から選択してください。</p>}
    {selected&&current?.status==='absent'&&<p>当日欠勤として記録済みです。</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>日付</th><th>女の子</th><th>出勤実績</th><th>操作</th></tr></thead>
      <tbody>{schedules.filter(s=>s.work_date<=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})).slice().reverse().slice(0,30).map(row=>{
        const record=records.find(item=>item.schedule_id===row.id);
        const details=attendanceDetails(row,record);
        return <tr key={row.id}><td>{row.work_date}</td><td>{row.resort_therapists?.name}</td>
          <td>{record?.status==='absent'?'当日欠勤':record?.status==='worked'
            ?`${timeValue(record.actual_start_time)}〜${timeValue(record.actual_end_time)}（${details.minutes}分）${details.late?' 遅刻':''}${details.early?' 早退':''}`
            :'未入力（予定ベース）'}</td>
          <td><button type="button" onClick={()=>select(row)}>実績を入力</button></td></tr>;
      })}</tbody></table></div>
  </section>;
}