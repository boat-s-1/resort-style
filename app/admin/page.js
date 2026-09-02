'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, therapistImageUrl } from '../../lib/supabase';
import Operations from './Operations';

const emptyTherapist = {
  id: '', name: '', slug: '', age: '', height: '', nomination_fee: 0,
  profile_text: '', manager_comment: '', image_path: '', x_url: '',
  instagram_url: '', bluesky_url: '', is_published: true, display_order: 0,
  store_ids: [],
};

const emptySchedule = {
  id: '', therapist_id: '', store_id: '', work_date: '', start_time: '',
  end_time: '', note: '', is_published: true,
};

function slugify(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `therapist-${Date.now()}`;
}

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('marron.toyohashi@gmail.com');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stores, setStores] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [therapistForm, setTherapistForm] = useState(emptyTherapist);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [tab, setTab] = useState('operations');

  const loadData = useCallback(async () => {
    const [{ data: storeData }, { data: therapistData, error: therapistError }, { data: scheduleData }] = await Promise.all([
      supabase.from('resort_stores').select('*').order('display_order'),
      supabase.from('resort_therapists').select('*, resort_therapist_stores(store_id)').order('display_order').order('name'),
      supabase.from('resort_schedules').select('*, resort_therapists(name), resort_stores(name)').order('work_date').order('start_time'),
    ]);
    if (therapistError) throw therapistError;
    setStores(storeData || []);
    setTherapists((therapistData || []).map((item) => ({
      ...item,
      store_ids: (item.resort_therapist_stores || []).map((relation) => relation.store_id),
    })));
    setSchedules(scheduleData || []);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const currentSession = data.session;
      setSession(currentSession);
      if (currentSession) {
        const { data: admin } = await supabase.from('resort_admins').select('user_id').eq('user_id', currentSession.user.id).maybeSingle();
        if (admin) {
          setIsAdmin(true);
          await loadData();
        }
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadData]);

  const login = async (event) => {
    event.preventDefault();
    setMessage('ログイン中…');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMessage('メールアドレスまたはパスワードを確認してください。');
    const { data: admin } = await supabase.from('resort_admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      return setMessage('このアカウントにはResort-styleの管理権限がありません。');
    }
    setSession(data.session);
    setIsAdmin(true);
    await loadData();
    setMessage('');
  };

  const editTherapist = (item) => {
    setTherapistForm({ ...emptyTherapist, ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveTherapist = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('保存中…');
    try {
      const payload = {
        name: therapistForm.name.trim(),
        slug: therapistForm.slug ? slugify(therapistForm.slug) : slugify(therapistForm.name),
        age: therapistForm.age ? Number(therapistForm.age) : null,
        height: therapistForm.height ? Number(therapistForm.height) : null,
        nomination_fee: Number(therapistForm.nomination_fee || 0),
        profile_text: therapistForm.profile_text,
        manager_comment: therapistForm.manager_comment,
        image_path: therapistForm.image_path || null,
        x_url: therapistForm.x_url || null,
        instagram_url: therapistForm.instagram_url || null,
        bluesky_url: therapistForm.bluesky_url || null,
        is_published: therapistForm.is_published,
        display_order: Number(therapistForm.display_order || 0),
      };
      const query = therapistForm.id
        ? supabase.from('resort_therapists').update(payload).eq('id', therapistForm.id).select().single()
        : supabase.from('resort_therapists').insert(payload).select().single();
      const { data: saved, error } = await query;
      if (error) throw error;
      await supabase.from('resort_therapist_stores').delete().eq('therapist_id', saved.id);
      if (therapistForm.store_ids.length) {
        const { error: relationError } = await supabase.from('resort_therapist_stores').insert(
          therapistForm.store_ids.map((storeId) => ({ therapist_id: saved.id, store_id: storeId }))
        );
        if (relationError) throw relationError;
      }
      setTherapistForm(emptyTherapist);
      await loadData();
      setMessage('プロフィールを保存しました。');
    } catch (error) {
      setMessage(`保存できませんでした：${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage('画像をアップロード中…');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('resort-therapists').upload(path, file, { cacheControl: '3600' });
    if (error) setMessage(`画像をアップロードできませんでした：${error.message}`);
    else {
      setTherapistForm((current) => ({ ...current, image_path: path }));
      setMessage('画像をアップロードしました。最後にプロフィールを保存してください。');
    }
    setSaving(false);
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      therapist_id: scheduleForm.therapist_id,
      store_id: Number(scheduleForm.store_id),
      work_date: scheduleForm.work_date,
      start_time: scheduleForm.start_time || null,
      end_time: scheduleForm.end_time || null,
      note: scheduleForm.note,
      is_published: scheduleForm.is_published,
    };
    const query = scheduleForm.id
      ? supabase.from('resort_schedules').update(payload).eq('id', scheduleForm.id)
      : supabase.from('resort_schedules').upsert(payload, { onConflict: 'therapist_id,work_date' });
    const { error } = await query;
    if (error) setMessage(`出勤予定を保存できませんでした：${error.message}`);
    else {
      setScheduleForm(emptySchedule);
      await loadData();
      setMessage('出勤店舗と時間を保存しました。');
    }
    setSaving(false);
  };

  const removeSchedule = async (id) => {
    if (!window.confirm('この出勤予定を削除しますか？')) return;
    const { error } = await supabase.from('resort_schedules').delete().eq('id', id);
    if (error) setMessage(`削除できませんでした：${error.message}`);
    else await loadData();
  };

  const sortedSchedules = useMemo(() => [...schedules].sort((a, b) => `${a.work_date}${a.start_time || ''}`.localeCompare(`${b.work_date}${b.start_time || ''}`)), [schedules]);

  if (loading) return <main className="admin-shell"><p>確認中…</p></main>;
  if (!session || !isAdmin) {
    return (
      <main className="admin-shell admin-login-shell">
        <form className="admin-panel admin-login" onSubmit={login}>
          <p className="admin-kicker">RESORT-STYLE</p>
          <h1>管理画面ログイン</h1>
          <label>メールアドレス<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>パスワード<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="admin-primary" type="submit">ログイン</button>
          {message && <p className="admin-message">{message}</p>}
          <a href="/">← サイトへ戻る</a>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="admin-kicker">RESORT-STYLE</p><h1>店舗運営ダッシュボード</h1></div>
        <div className="admin-header-actions"><a href="/" target="_blank">サイトを確認</a><button onClick={() => supabase.auth.signOut().then(() => location.reload())}>ログアウト</button></div>
      </header>
      <nav className="admin-tabs admin-main-tabs">
        <button className={tab === 'operations' ? 'active' : ''} onClick={() => setTab('operations')}>顧客・予約・売上・稼働</button>
        <button className={tab === 'therapists' ? 'active' : ''} onClick={() => setTab('therapists')}>プロフィール管理</button>
        <button className={tab === 'schedules' ? 'active' : ''} onClick={() => setTab('schedules')}>出勤・店舗管理</button>
      </nav>
      {message && <p className="admin-message">{message}</p>}

      {tab === 'operations' && <Operations stores={stores} therapists={therapists} schedules={schedules} notify={setMessage} />}

      {tab === 'therapists' && <>
        <form className="admin-panel admin-form" onSubmit={saveTherapist}>
          <div className="admin-panel-title"><h2>{therapistForm.id ? 'プロフィール編集' : '女の子を新規登録'}</h2>{therapistForm.id && <button type="button" onClick={() => setTherapistForm(emptyTherapist)}>新規登録に戻る</button>}</div>
          <div className="admin-grid">
            <label>名前<input value={therapistForm.name} onChange={(e) => setTherapistForm({ ...therapistForm, name: e.target.value })} required /></label>
            <label>URL用ID（半角英数字）<input value={therapistForm.slug} onChange={(e) => setTherapistForm({ ...therapistForm, slug: e.target.value })} placeholder="空欄なら自動作成" /></label>
            <label>年齢<input type="number" min="18" max="99" value={therapistForm.age} onChange={(e) => setTherapistForm({ ...therapistForm, age: e.target.value })} /></label>
            <label>身長（cm）<input type="number" min="100" max="220" value={therapistForm.height} onChange={(e) => setTherapistForm({ ...therapistForm, height: e.target.value })} /></label>
            <label>指名料（円）<input type="number" min="0" value={therapistForm.nomination_fee} onChange={(e) => setTherapistForm({ ...therapistForm, nomination_fee: e.target.value })} /></label>
            <label>表示順<input type="number" value={therapistForm.display_order} onChange={(e) => setTherapistForm({ ...therapistForm, display_order: e.target.value })} /></label>
          </div>
          <fieldset><legend>在籍店舗</legend><div className="admin-checks">{stores.map((store) => <label key={store.id}><input type="checkbox" checked={therapistForm.store_ids.includes(store.id)} onChange={(e) => setTherapistForm({ ...therapistForm, store_ids: e.target.checked ? [...therapistForm.store_ids, store.id] : therapistForm.store_ids.filter((id) => id !== store.id) })} />{store.name}</label>)}</div></fieldset>
          <label>プロフィール画像<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} /></label>
          {therapistForm.image_path && <img className="admin-image-preview" src={therapistImageUrl(therapistForm.image_path)} alt="アップロード画像" />}
          <label>店長からの紹介<textarea rows="4" value={therapistForm.manager_comment} onChange={(e) => setTherapistForm({ ...therapistForm, manager_comment: e.target.value })} /></label>
          <label>プロフィール本文<textarea rows="6" value={therapistForm.profile_text} onChange={(e) => setTherapistForm({ ...therapistForm, profile_text: e.target.value })} /></label>
          <div className="admin-grid">
            <label>X URL<input type="url" value={therapistForm.x_url || ''} onChange={(e) => setTherapistForm({ ...therapistForm, x_url: e.target.value })} /></label>
            <label>Instagram URL<input type="url" value={therapistForm.instagram_url || ''} onChange={(e) => setTherapistForm({ ...therapistForm, instagram_url: e.target.value })} /></label>
            <label>Bluesky URL<input type="url" value={therapistForm.bluesky_url || ''} onChange={(e) => setTherapistForm({ ...therapistForm, bluesky_url: e.target.value })} /></label>
          </div>
          <label className="admin-switch"><input type="checkbox" checked={therapistForm.is_published} onChange={(e) => setTherapistForm({ ...therapistForm, is_published: e.target.checked })} />サイトに公開する</label>
          <button className="admin-primary" disabled={saving}>{saving ? '処理中…' : 'プロフィールを保存'}</button>
        </form>
        <section className="admin-card-list">{therapists.map((item) => <article className="admin-person-card" key={item.id}><img src={therapistImageUrl(item.image_path)} alt={item.name} /><div><h3>{item.name}</h3><p>{item.store_ids.map((id) => stores.find((store) => store.id === id)?.name).filter(Boolean).join('・') || '在籍店舗未設定'}</p><span>{item.is_published ? '公開中' : '非公開'}</span></div><button onClick={() => editTherapist(item)}>編集</button></article>)}</section>
      </>}

      {tab === 'schedules' && <>
        <form className="admin-panel admin-form" onSubmit={saveSchedule}>
          <div className="admin-panel-title"><h2>{scheduleForm.id ? '出勤予定を編集' : '出勤予定を追加'}</h2>{scheduleForm.id && <button type="button" onClick={() => setScheduleForm(emptySchedule)}>新規追加に戻る</button>}</div>
          <div className="admin-grid">
            <label>女の子<select value={scheduleForm.therapist_id} onChange={(e) => setScheduleForm({ ...scheduleForm, therapist_id: e.target.value })} required><option value="">選択してください</option>{therapists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>出勤店舗<select value={scheduleForm.store_id} onChange={(e) => setScheduleForm({ ...scheduleForm, store_id: e.target.value })} required><option value="">選択してください</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
            <label>出勤日<input type="date" value={scheduleForm.work_date} onChange={(e) => setScheduleForm({ ...scheduleForm, work_date: e.target.value })} required /></label>
            <label>開始時間<input type="time" value={scheduleForm.start_time || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} /></label>
            <label>終了時間<input type="time" value={scheduleForm.end_time || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} /></label>
            <label>補足<input value={scheduleForm.note} onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })} placeholder="受付終了など" /></label>
          </div>
          <label className="admin-switch"><input type="checkbox" checked={scheduleForm.is_published} onChange={(e) => setScheduleForm({ ...scheduleForm, is_published: e.target.checked })} />サイトに公開する</label>
          <button className="admin-primary" disabled={saving}>{saving ? '処理中…' : '出勤予定を保存'}</button>
        </form>
        <section className="admin-schedule-list">{sortedSchedules.map((item) => <article key={item.id}><div><strong>{item.work_date}　{item.start_time?.slice(0, 5) || '--:--'}〜{item.end_time?.slice(0, 5) || '--:--'}</strong><p>{item.resort_therapists?.name}／{item.resort_stores?.name}{item.note ? `／${item.note}` : ''}</p></div><div><button onClick={() => setScheduleForm({ ...emptySchedule, ...item, store_id: String(item.store_id), start_time: item.start_time?.slice(0, 5) || '', end_time: item.end_time?.slice(0, 5) || '' })}>編集</button><button className="danger" onClick={() => removeSchedule(item.id)}>削除</button></div></article>)}</section>
      </>}
    </main>
  );
}
