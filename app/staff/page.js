'use client';
import { useState } from 'react';

export default function StaffPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    // 実際にはAPIで検証するか、環境変数と照合します
    if (password === 'staff1234') { 
      setIsAuthenticated(true);
    } else {
      alert('パスワードが違います');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>スタッフ専用ページ</h2>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="パスワードを入力"
        />
        <button onClick={handleLogin}>ログイン</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>運営スタッフ用管理画面</h1>
      <p>ここにシフト管理や店舗設定の機能を配置します。</p>
      {/* スタッフ専用のダッシュボード内容 */}
    </div>
  );
}
