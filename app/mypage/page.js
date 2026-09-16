'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, therapistImageUrl } from '../../lib/supabase';

const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`;
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

export default function MyPage() {
  const [loginId,setLoginId]=useState(''); const [password,setPassword]=useState('');
  const [token,setToken]=useState(''); const [data,setData]=useState(null); const [message,setMessage]=useState('');
  const [month,setMonth]=useState(today().slice(0,7)); const [loading,setLoading]=useState(true);

  async function load(t=token,m=month){ if(!t)return; setLoading(true); const {data:r,error}=await supabase.rpc('resort_therapist_mypage',{p_token:t,p_month:m}); if(error||!r){ localStorage.removeItem('resort_therapist_token'); setToken(''); setData(null); setMessage('ログインの有効期限が切れました。'); } else setData(r); setLoading(false); }
  useEffect(()=>{ const t=localStorage.getItem('resort_therapist_token')||''; setToken(t); if(t) load(t,month); else setLoading(false); },[]);
  async function login(e){e.preventDefault();setMessage('ログイン中…'); const {data:r,error}=await supabase.rpc('resort_therapist_login',{p_login_id:loginId.trim(),p_password:password}); const row=r?.[0]; if(error||!row){setMessage('ログインIDまたはパスワードを確認してください。');return;} localStorage.setItem('resort_therapist_token',row.token);setToken(row.token);setPassword('');setMessage('');await load(row.token,month);}
  function logout(){localStorage.removeItem('resort_therapist_token');setToken('');setData(null);}
  const stats=data?.month_stats||{}; const bookings=data?.today_bookings||[]; const schedules=data?.schedules||[];
  const nextSchedules=useMemo(()=>schedules.filter(s=>s.work_date>=today()).slice(0,12),[schedules]);

  if(loading) return <main className="admin-shell"><p>読み込み中…</p></main>;
  if(!token||!data) return <main className="admin-shell admin-login-shell"><form className="admin-panel admin-login" onSubmit={login}><p className="admin-kicker">RESORT-STYLE</p><h1>女の子マイページ</h1><label>ログインID<input value={loginId} onChange={e=>setLoginId(e.target.value)} autoCapitalize="none" required /></label><label>パスワード<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button className="admin-primary">ログイン</button>{message&&<p className="admin-message">{message}</p>}<a href="/">← サイトへ戻る</a></form></main>;

  return <main className="admin-shell"><header className="admin-header"><div style={{display:'flex',alignItems:'center',gap:14}}><img src={therapistImageUrl(data.therapist?.image_path)} alt="" style={{width:64,height:64,borderRadius:'50%',objectFit:'cover'}}/><div><p className="admin-kicker">RESORT-STYLE MY PAGE</p><h1>{data.therapist?.name}さん</h1></div></div><button onClick={logout}>ログアウト</button></header>
    <div className="admin-toolbar"><label>対象月<input type="month" value={month} onChange={e=>{setMonth(e.target.value);load(token,e.target.value)}}/></label></div>
    <section className="admin-metrics"><div className="admin-panel"><small>今月のバック</small><h2>{yen(stats.payout)}</h2></div><div className="admin-panel"><small>接客件数</small><h2>{stats.count||0}件</h2></div><div className="admin-panel"><small>指名</small><h2>{stats.nomination||0}件</h2></div><div className="admin-panel"><small>リピート</small><h2>{stats.repeat||0}件</h2></div></section>
    <section className="admin-panel"><h2>今日の予約</h2>{!bookings.length?<p>本日の予約はありません。</p>:bookings.map(b=><article key={b.id} style={{padding:'14px 0',borderBottom:'1px solid #eee'}}><strong>{b.start_time?.slice(0,5)}〜　{b.course_name}</strong><p>ルーム{b.room_number} ／ {b.duration_minutes}分</p><p>予定バック：{yen(b.therapist_payout)}{b.nomination_fee>0?' ／ 指名':''}{b.is_first_visit===false?' ／ リピート':''}</p></article>)}</section>
    <section className="admin-panel" style={{marginTop:18}}><h2>出勤予定</h2>{!nextSchedules.length?<p>この月の今後の出勤予定はありません。</p>:nextSchedules.map(s=><article key={s.id} style={{padding:'12px 0',borderBottom:'1px solid #eee'}}><strong>{s.work_date}</strong><p>{s.start_time?.slice(0,5)||'--:--'}〜{s.end_time?.slice(0,5)||'--:--'}{s.note?` ／ ${s.note}`:''}</p></article>)}</section>
  </main>;
}