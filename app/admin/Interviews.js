'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const bucket = 'resort-interview-documents';
const empty = { id: '', interview_date: '', interviewer: '', full_name: '', age: '', residence: '', photo_path: null, identity_path: null };
const accepted = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

export default function Interviews() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('resort_interviews')
      .select('id,interview_date,interviewer,full_name,age,residence,photo_path,identity_path')
      .order('interview_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    setRecords(data || []);
  }, []);

  useEffect(() => {
    let active = true;
    refresh().catch(error => { if (active) setMessage('面接記録を読み込めませんでした：' + error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  function reset() {
    setForm(empty);
    setPhoto(null);
    setIdentity(null);
    setFileKey(value => value + 1);
  }

  function edit(row) {
    setForm({ ...row, age: String(row.age) });
    setPhoto(null);
    setIdentity(null);
    setFileKey(value => value + 1);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function upload(file, id, kind) {
    if (!file) return null;
    if (!accepted.includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) {
      throw new Error('添付は10MB以下のJPEG・PNG・WebP・PDFを選択してください。');
    }
    const path = `${id}/${kind}/${crypto.randomUUID()}.${extensions[file.type]}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    const id = form.id || crypto.randomUUID();
    const uploaded = [];
    try {
      const newPhoto = await upload(photo, id, 'photo');
      if (newPhoto) uploaded.push(newPhoto);
      const newIdentity = await upload(identity, id, 'identity');
      if (newIdentity) uploaded.push(newIdentity);
      const payload = {
        interview_date: form.interview_date,
        interviewer: form.interviewer.trim(),
        full_name: form.full_name.trim(),
        age: Number(form.age),
        residence: form.residence.trim(),
        photo_path: newPhoto || form.photo_path,
        identity_path: newIdentity || form.identity_path,
      };
      const query = form.id
        ? supabase.from('resort_interviews').update(payload).eq('id', id).select('id').single()
        : supabase.from('resort_interviews').insert({ id, ...payload }).select('id').single();
      const { error } = await query;
      if (error) throw error;
      reset();
      setMessage('面接記録を保存しました。');
      try {
        await refresh();
      } catch {
        setMessage('保存しました。一覧の更新に失敗したため、画面を更新して確認してください。');
      }
      const replaced = [newPhoto && form.photo_path, newIdentity && form.identity_path].filter(Boolean);
      if (replaced.length) await supabase.storage.from(bucket).remove(replaced);
    } catch (error) {
      if (uploaded.length) await supabase.storage.from(bucket).remove(uploaded);
      setMessage('保存できませんでした：' + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function download(path, label) {
    if (!path || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${label}.${path.split('.').pop()}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setMessage('添付を取得できませんでした：' + error.message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <form className="admin-panel admin-form" onSubmit={save}>
      <div className="admin-panel-title">
        <h2>{form.id ? '面接記録を編集' : '面接記録を追加'}</h2>
        {form.id && <button type="button" disabled={busy} onClick={reset}>新規入力に戻る</button>}
      </div>
      <p>MarroN・Resort-style共通の面接記録です。添付は管理者だけが取得できます。</p>
      <div className="admin-grid">
        <label>日付<input type="date" value={form.interview_date} onChange={event => setForm({ ...form, interview_date: event.target.value })} required /></label>
        <label>担当者<input value={form.interviewer} onChange={event => setForm({ ...form, interviewer: event.target.value })} maxLength={120} required /></label>
        <label>氏名<input value={form.full_name} onChange={event => setForm({ ...form, full_name: event.target.value })} maxLength={120} required /></label>
        <label>年齢<input type="number" min="1" max="120" value={form.age} onChange={event => setForm({ ...form, age: event.target.value })} required /></label>
        <label>住まい<input value={form.residence} onChange={event => setForm({ ...form, residence: event.target.value })} maxLength={300} required /></label>
        <label>写真添付<input key={`photo-${fileKey}`} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setPhoto(event.target.files?.[0] || null)} />{form.photo_path && <small>登録済み（変更する場合は新しいファイルを選択）</small>}</label>
        <label>身分証添付<input key={`identity-${fileKey}`} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setIdentity(event.target.files?.[0] || null)} />{form.identity_path && <small>登録済み（変更する場合は新しいファイルを選択）</small>}</label>
      </div>
      <p>添付はJPEG・PNG・WebP・PDF、各10MBまで。</p>
      <button className="admin-primary" disabled={busy}>{busy ? '保存中…' : '面接記録を保存'}</button>
      {message && <p className="admin-message" role="status">{message}</p>}
    </form>
    <section className="admin-panel admin-table-section">
      <h2>登録済みの面接</h2>
      {loading ? <p>読み込み中…</p> : records.length === 0 ? <p className="admin-empty">面接記録はまだありません。</p> :
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>日付</th><th>氏名</th><th>年齢</th><th>住まい</th><th>担当者</th><th>添付</th><th>操作</th></tr></thead>
          <tbody>{records.map(row => <tr key={row.id}>
            <td>{row.interview_date}</td><td>{row.full_name}</td><td>{row.age}</td><td>{row.residence}</td><td>{row.interviewer}</td>
            <td><div className="admin-row-actions">
              {row.photo_path && <button type="button" disabled={busy} onClick={() => download(row.photo_path, '写真')}>写真を保存</button>}
              {row.identity_path && <button type="button" disabled={busy} onClick={() => download(row.identity_path, '身分証')}>身分証を保存</button>}
              {!row.photo_path && !row.identity_path && '—'}
            </div></td>
            <td><button type="button" disabled={busy} onClick={() => edit(row)}>編集</button></td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </>;
}
