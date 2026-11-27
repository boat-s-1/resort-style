'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

const label={start:'お仕事開始の報告',finish:'お仕事終了の報告'};
export default function WorkNotices(){
  const [rows,setRows]=useState([]),[available,setAvailable]=useState(false),[sound,setSound]=useState(false);
  const seen=useRef(null), audio=useRef(null), mounted=useRef(true);
  const load=useCallback(async()=>{
    const {data,error}=await supabase.rpc('resort_admin_work_notices');
    if(!mounted.current)return;
    if(error||!Array.isArray(data)){setAvailable(false);return;}
    const unread=data.filter(n=>!n.read_at);
    if(sound&&seen.current!==null&&unread.some(n=>!seen.current.has(n.id))){
      try{const ctx=audio.current;const oscillator=ctx.createOscillator(),gain=ctx.createGain();
        oscillator.frequency.value=660;gain.gain.value=.04;oscillator.connect(gain);gain.connect(ctx.destination);
        oscillator.start();oscillator.stop(ctx.currentTime+.12);
      }catch{}
    }
    seen.current=new Set(unread.map(n=>n.id));setRows(data);setAvailable(true);
  },[sound]);
  useEffect(()=>{mounted.current=true;load();const timer=setInterval(load,15000);return()=>{mounted.current=false;clearInterval(timer)}},[load]);
  useEffect(()=>()=>{audio.current?.close?.()},[]);
  const toggleSound=async()=>{if(sound){setSound(false);return;}try{audio.current=new (window.AudioContext||window.webkitAudioContext)();await audio.current.resume();setSound(true);}catch{setSound(false)}};
  const markRead=async id=>{const {error}=await supabase.rpc('resort_admin_work_notices',{p_mark_read:id});if(!error)load()};
  if(!available)return null;
  const unread=rows.filter(n=>!n.read_at).length;
  return <details className="admin-panel work-notices"><summary>業務通知 {unread}件未読</summary>
    <button type="button" onClick={toggleSound}>通知音：{sound?'ON':'OFF'}</button>
    <p>画面を開いている間は15秒ごとに更新します。通知音はこの端末でONにした場合だけ鳴ります。</p>
    {rows.length===0?<p>通知はありません。</p>:rows.map(n=><div key={n.id}>
      <strong>{n.store_name}・{label[n.kind]||'業務連絡'}</strong>　<time>{new Date(n.created_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}</time>
      {!n.read_at&&<button type="button" onClick={()=>markRead(n.id)}>既読にする</button>}
    </div>)}
  </details>;
}
