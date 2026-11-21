'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const bucket = 'resort-interview-documents';
const formats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const blank = {
  desired_stage_name: '', age: '', height_cm: '', bust_cm: '', waist_cm: '', hip_cm: '',
  cup_size: '', face_visibility: '', profile_preferences: '', micro: '', video: '', panel_image_path: null,
};
const numberOrNull = value => value === '' ? null : Number(value);

export default function InterviewQuestionnaire() {
  const [interviews, setInterviews] = useState([]);
  const [answers, setAnswers] = useState({});
  const [interviewId, setInterviewId] = useState('');
  const [form, setForm] = useState(blank);
  const [image, setImage] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from('resort_interviews').select('id,interview_date,full_name,store')
        .order('interview_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('resort_interview_questionnaires').select('*'),
    ]).then(([sheet, questionnaire]) => {
      if (sheet.error || questionnaire.error) throw sheet.error || questionnaire.error;
      if (!active) return;
      setInterviews(sheet.data || []);
      setAnswers(Object.fromEntries((questionnaire.data || []).map(row => [row.interview_id, row])));
    }).catch(error => { if (active) setMessage('アンケートを読み込めませんでした：' + error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function selectInterview(id) {
    setInterviewId(id);
    const row = answers[id];
    setForm(row ? {
      ...blank, ...row,
      age: row.age == null ? '' : String(row.age),
      height_cm: row.height_cm == null ? '' : String(row.height_cm),
      bust_cm: row.bust_cm == null ? '' : String(row.bust_cm),
      waist_cm: row.waist_cm == null ? '' : String(row.waist_cm),
      hip_cm: row.hip_cm == null ? '' : String(row.hip_cm),
      face_visibility: row.face_visibility || '', micro: row.micro || '', video: row.video || '',
    } : blank);
    setImage(null);
    setFileKey(value => value + 1);
    setMessage('');
  }

  function field(name) {
    return { value: form[name], onChange: event => setForm(current => ({ ...current, [name]: event.target.value })) };
  }

  async function save(event) {
    event.preventDefault();
    if (!interviewId || busy) return;
    setBusy(true);
    setMessage('');
    let newPath = null;
    let saved = false;
    try {
      if (image) {
        if (!formats[image.type] || image.size === 0 || image.size > 10 * 1024 * 1024) {
          throw new Error('パネル画像は10MB以下のJPEG・PNG・WebPを選択してください。');
        }
        newPath = `${interviewId}/panel/${crypto.randomUUID()}.${formats[image.type]}`;
        const { error } = await supabase.storage.from(bucket).upload(newPath, image, { contentType: image.type, upsert: false });
        if (error) throw error;
      }
      const payload = {
        interview_id: interviewId,
        desired_stage_name: form.desired_stage_name.trim(),
        age: numberOrNull(form.age),
        height_cm: numberOrNull(form.height_cm),
        bust_cm: numberOrNull(form.bust_cm),
        waist_cm: numberOrNull(form.waist_cm),
        hip_cm: numberOrNull(form.hip_cm),
        cup_size: form.cup_size.trim(),
        face_visibility: form.face_visibility || null,
        profile_preferences: form.profile_preferences.trim(),
        micro: form.micro || null,
        video: form.video || null,
        panel_image_path: newPath || form.panel_image_path,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('resort_interview_questionnaires')
        .upsert(payload, { onConflict: 'interview_id' }).select('*').single();
      if (error) throw error;
      saved = true;
      setAnswers(current => ({ ...current, [interviewId]: data }));
      setForm({ ...form, panel_image_path: data.panel_image_path });
      setImage(null);
      setFileKey(value => value + 1);
      setMessage('面接アンケートを保存しました。');
      if (newPath && form.panel_image_path) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove([form.panel_image_path]);
        if (cleanupError) setMessage('保存しました。以前のパネル画像の削除だけ失敗しました。');
      }
    } catch (error) {
      if (newPath && !saved) await supabase.storage.from(bucket).remove([newPath]);
      setMessage('保存できませんでした：' + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function downloadImage() {
    if (!form.panel_image_path || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from(bucket).download(form.panel_image_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `パネル画像.${form.panel_image_path.split('.').pop()}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setMessage('画像を取得できませんでした：' + error.message);
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-panel admin-form" onSubmit={save}>
    <h2>面接アンケート</h2>
    <p>先に面接シートを保存し、対象者を選択してください。内容とパネル画像は管理者のみ閲覧できます。</p>
    <label>対象の面接シート
      <select value={interviewId} onChange={event => selectInterview(event.target.value)} required disabled={loading || busy}>
        <option value="">選択してください</option>
        {interviews.map(row => <option key={row.id} value={row.id}>
          {row.interview_date}　{row.full_name}　{row.store || '店舗未設定'}{answers[row.id] ? '（入力済み）' : ''}
        </option>)}
      </select>
    </label>
    {loading ? <p>読み込み中…</p> : interviews.length === 0 ? <p>面接シートがまだありません。先に「面接シート」から登録してください。</p> : null}
    {interviewId && <div className="admin-grid">
      <label style={{ gridColumn: '1 / -1' }}>希望の店名（NGの名前・文字数なども記入）
        <textarea rows={3} maxLength={500} {...field('desired_stage_name')} placeholder="希望の店名・NGの名前・希望の文字数など" />
      </label>
      <label>年齢<input type="number" min="1" max="120" {...field('age')} /></label>
      <label>身長（cm）<input type="number" min="1" max="300" step="0.1" {...field('height_cm')} /></label>
      <label>スリーサイズ B（cm）<input type="number" min="1" max="300" {...field('bust_cm')} /></label>
      <label>スリーサイズ W（cm）<input type="number" min="1" max="300" {...field('waist_cm')} /></label>
      <label>スリーサイズ H（cm）<input type="number" min="1" max="300" {...field('hip_cm')} /></label>
      <label>カップ数<input maxLength={30} {...field('cup_size')} placeholder="例：F" /></label>
      <label>顔出し有無<select {...field('face_visibility')}><option value="">未選択</option><option value="可能">可能</option><option value="不可">不可</option></select></label>
      <label>マイクロ<select {...field('micro')}><option value="">未選択</option><option value="可能">可能</option><option value="不可">不可</option></select></label>
      <label>動画<select {...field('video')}><option value="">未選択</option><option value="可能">可能</option><option value="不可">不可</option></select></label>
      <label style={{ gridColumn: '1 / -1' }}>プロフ希望・NG
        <textarea rows={4} maxLength={3000} {...field('profile_preferences')} />
      </label>
      <label style={{ gridColumn: '1 / -1' }}>パネル画像の添付
        <input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImage(event.target.files?.[0] || null)} />
        {form.panel_image_path && <span>登録済み　<button type="button" disabled={busy} onClick={downloadImage}>画像を保存</button></span>}
        <small>JPEG・PNG・WebP、10MBまで。公開サイトには反映されません。</small>
      </label>
    </div>}
    {interviewId && <button className="admin-primary" disabled={busy}>{busy ? '保存中…' : '面接アンケートを保存'}</button>}
    {message && <p className="admin-message" role="status">{message}</p>}
  </form>;
}
