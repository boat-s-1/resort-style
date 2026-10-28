'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
const platforms={x:'X',instagram:'インスタ',relaxxy:'リラクシー'};
export default function IssuedAccounts({brand,therapists}){
 const [id,setId]=useState('');
 return <section className="admin-panel" style={{marginTop:24}}><h2>女の子専用・発行済みアカウント</h2><p>店舗が発行したX・インスタ・リラクシーのIDとパスワードを登録します。本人のマイページから確認できます。</p><label>女の子<select value={id} onChange={e=>setId(e.target.value)}><option value="">選択してください</option>{therapists.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{id&&<AccountForm key={`${brand}-${id}`} brand={brand} therapistId={id}/>}</section>
}
function AccountForm({brand,therapistId}){
 const [rows,setRows]=useState([]),[platform,setPlatform]=useState('x'),[loginId,setLoginId]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 async function list(){const {data,error}=await supabase.rpc('resort_mypage_action',{p_action:'admin_accounts',p_data:{brand,therapist_id:therapistId}});if(error)throw error;return data||[];}
 useEffect(()=>{let active=true;list().then(r=>{if(active){setRows(r);setLoginId(r.find(a=>a.platform==='x')?.login_id||'');setReady(true)}}).catch(()=>{if(active)setMessage('読み込めませんでした。女の子を選び直してください。')});return()=>{active=false}},[]);
 function choose(v){setPlatform(v);setLoginId(rows.find(a=>a.platform===v)?.login_id||'');setPassword('');setMessage('')}
 async function save(e){e.preventDefault();if(busy||!ready)return;setBusy(true);try{const {error}=await supabase.rpc('resort_mypage_action',{p_action:'admin_save_account',p_data:{brand,therapist_id:therapistId,platform,login_id:loginId,password}});if(error)throw error;setPassword('');setRows(await list());setMessage('保存しました。本人のマイページに反映されます。');}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 return <form className="admin-form" onSubmit={save} style={{marginTop:18}}><div className="admin-grid"><label>媒体<select value={platform} onChange={e=>choose(e.target.value)} disabled={busy||!ready}>{Object.entries(platforms).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label><label>発行したID<input required maxLength={200} autoComplete="off" value={loginId} onChange={e=>setLoginId(e.target.value)} disabled={busy||!ready}/></label><label>発行したパスワード<input type="password" autoComplete="new-password" required={!rows.some(a=>a.platform===platform)} maxLength={1024} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy||!ready}/><small>登録済みの場合、空欄なら現在のパスワードを維持します。</small></label></div><button className="admin-primary" disabled={busy||!ready}>本人用アカウントを保存</button>{message&&<p role="status">{message}</p>}<ul>{Object.entries(platforms).map(([v,label])=><li key={v}>{label}：{rows.find(a=>a.platform===v)?.login_id||'未登録'}</li>)}</ul></form>
}
