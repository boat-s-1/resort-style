'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AuthPanel from './AuthPanel';

export default function ResetPasswordPage() {
  const [state, setState] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    // getSession waits for the SDK to process the recovery URL. Validate the
    // resulting session with the Auth server before enabling the form.
    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) throw new Error('invalid');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error('invalid');
        if (active) setState('ready');
      } catch {
        if (active) setState('invalid');
      } finally {
        // Do not retain recovery tokens or error details in the address bar.
        window.history.replaceState(null, '', '/reset-password');
      }
    }
    check();
    return () => { active = false; };
  }, []);

  async function update(event) {
    event.preventDefault();
    if (busy || state !== 'ready') return;
    if (password.length < 12) return setMessage('12文字以上で入力してください。');
    if (password !== confirmation) return setMessage('確認用パスワードが一致しません。');
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      setState('done');
      await supabase.auth.signOut();
    } catch {
      setMessage('変更できませんでした。別の強いパスワードで試すか、再設定メールを送り直してください。');
    } finally {
      setBusy(false);
    }
  }
  return <AuthPanel title="新しいパスワードを設定">
    {state === 'checking' && <p role="status">再設定リンクを確認しています…</p>}
    {state === 'invalid' && <p role="alert">リンクが無効か、有効期限が切れています。再設定メールを送り直し、最新のリンクを開いてください。</p>}
    {state === 'ready' && <form onSubmit={update}>
      <p>12文字以上の、他のサービスで使っていないパスワードを設定してください。</p>
      <label>新しいパスワード<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label>
      <label>新しいパスワード（確認）<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy}/></label>
      <button className="admin-primary" disabled={busy}>{busy ? '変更中…' : 'パスワードを変更する'}</button>
    </form>}
    <p role="status">{message}</p>
    {state === 'done' && <p role="status">パスワードを変更しました。新しいパスワードでログインしてください。</p>}
    {state !== 'done' && <p><a href="/forgot-password">再設定メールを送り直す</a></p>}
    <a href="/admin">管理画面ログインへ戻る</a>
  </AuthPanel>;
}
