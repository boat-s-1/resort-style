'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
const blank = { id: null, name: '', url: '', login_id: '', password: '' };
function safeUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export default function MediaAccounts({ brand }) {
  const [rows, setRows] = useState([]), [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''), [revealed, setRevealed] = useState({});
  const [revealing, setRevealing] = useState(null);
  const generation = useRef(0), timer = useRef(null);
  function hide() { generation.current++; setRevealed({}); setRevealing(null); clearTimeout(timer.current); }
  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase.rpc('resort_media_list', { p_brand: brand }).then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage('媒体一覧を読み込めませんでした。再ログインしてお試しください。');
      else setRows(data || []);
      setLoading(false);
    }).catch(() => { if (active) { setLoading(false); setMessage('媒体一覧を読み込めませんでした。'); } });
    const conceal = () => { if (document.hidden) { hide(); setForm(value => ({ ...value, password: '' })); } };
    document.addEventListener('visibilitychange', conceal);
    return () => { active = false; generation.current++; clearTimeout(timer.current); document.removeEventListener('visibilitychange', conceal); };
  }, [brand]);
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (form.url && !safeUrl(form.url)) return setMessage('アドレスはID・パスワードを含まないhttpまたはhttpsのURLを入力してください。');
    setBusy(true); setMessage(''); hide();
    try {
      const { error } = await supabase.rpc('resort_media_save', { p_brand: brand, p_id: form.id, p_name: form.name.trim(), p_url: form.url.trim(), p_login_id: form.login_id, p_password: form.password || null });
      if (error) throw error;
      setForm(blank);
      const result = await supabase.rpc('resort_media_list', { p_brand: brand });
      if (result.error) { setMessage('保存しました。一覧を再読み込みしてください。'); return; }
      setRows(result.data || []); setMessage('媒体情報を保存しました。');
    } catch { setMessage('保存できませんでした。入力内容とログイン状態を確認してください。'); }
    finally { setBusy(false); }
  }
  async function reveal(row) {
    if (revealing || busy) return;
    if (Object.hasOwn(revealed, row.id)) { hide(); return; }
    hide(); const token = generation.current; setRevealing(row.id); setMessage('');
    try {
      const { data, error } = await supabase.rpc('resort_media_reveal', { p_brand: brand, p_id: row.id });
      if (token !== generation.current) return;
      if (error) throw error;
      setRevealed({ [row.id]: data || '' });
      timer.current = setTimeout(hide, 30000);
    } catch { if (token === generation.current) setMessage('パスワードを表示できませんでした。再ログインしてお試しください。'); }
    finally { if (token === generation.current) setRevealing(null); }
  }
  return <section aria-label="媒体一覧">
    <h2>{brand === 'marron' ? 'MarroN' : 'Resort-style'}の媒体一覧</h2>
    <form className="admin-panel admin-form" onSubmit={save} autoComplete="off">
      <h3>{form.id ? '媒体情報を編集' : '媒体を追加'}</h3>
      <div className="admin-grid">
        <label>媒体名<input required maxLength={200} value={form.name} disabled={busy} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>アドレス<input type="url" placeholder="https://…" value={form.url} disabled={busy} onChange={e=>setForm({...form,url:e.target.value})}/></label>
        <label>ID<input autoComplete="off" maxLength={500} value={form.login_id} disabled={busy} onChange={e=>setForm({...form,login_id:e.target.value})}/></label>
        <label>パスワード<input type="password" autoComplete="new-password" value={form.password} maxLength={10000} disabled={busy} onChange={e=>setForm({...form,password:e.target.value})}/></label>
      </div>
      {form.id && <p>パスワードを空欄にすると、保存済みのパスワードを維持します。</p>}
      <button className="admin-primary" disabled={busy}>{busy ? '保存中…' : '保存する'}</button>
      {form.id && <button type="button" disabled={busy} onClick={()=>{setForm(blank);hide();}}>編集をやめる</button>}
    </form>
    <p role="status">{message}</p>
    <p>パスワードは「表示」を押した項目だけ表示し、30秒後に自動で隠します。</p>
    {loading ? <p role="status">読み込み中…</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{['媒体名','アドレス','ID','パスワード','操作'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>
      {rows.map(row=><tr key={row.id}><td>{row.name}</td><td>{safeUrl(row.url) ? <a href={safeUrl(row.url)} target="_blank" rel="noopener noreferrer">{row.url}</a> : '—'}</td><td>{row.login_id || '—'}</td><td>{row.has_password ? <><span>{Object.hasOwn(revealed,row.id) ? revealed[row.id] : '••••••••'}</span> <button type="button" disabled={Boolean(revealing)||busy} aria-label={`${row.name}のパスワードを${Object.hasOwn(revealed,row.id)?'隠す':'表示'}`} onClick={()=>reveal(row)}>{revealing===row.id?'確認中…':Object.hasOwn(revealed,row.id)?'隠す':'表示'}</button></> : '未登録'}</td><td><button disabled={busy} onClick={()=>{hide();setForm({...blank,...row,password:''});}}>編集</button></td></tr>)}
    </tbody></table>{!rows.length && <p className="admin-empty">この店舗の媒体はまだ登録されていません。</p>}</div>}
  </section>;
}
