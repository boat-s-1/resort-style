'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import AuthPanel from '../reset-password/AuthPanel';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('uuu1946@gmail.com');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  async function send(event) {
    event.preventDefault();
    if (busy || sent) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setSent(true);
      setMessage('登録済みのメールアドレスの場合、再設定メールが届きます。最新のメールのリンクを開いてください。');
    } catch {
      setMessage('送信できませんでした。少し時間を置いてからお試しください。');
    } finally {
      setBusy(false);
    }
  }
  return <AuthPanel title="パスワードの再設定">
    <p>管理者として登録したメールアドレスに再設定メールを送ります。</p>
    <form onSubmit={send}>
      <label>メールアドレス<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy || sent}/></label>
      <button className="admin-primary" disabled={busy || sent}>{busy ? '送信中…' : sent ? '送信受付済み' : '再設定メールを送る'}</button>
    </form>
    <p role="status">{message}</p>
    <a href="/admin">管理画面ログインへ戻る</a>
  </AuthPanel>;
}
