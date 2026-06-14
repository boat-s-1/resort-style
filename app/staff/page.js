'use client';
import { useState } from 'react';

export default function StaffPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 予約データ用の状態
  const [booking, setBooking] = useState({
    date: '', name: '', time: '', course: '', duration: '', nomination: '', nominationFee: 0, note: ''
  });

  const handleLogin = () => {
    if (password === 'staff1234') { setIsAuthenticated(true); }
    else { alert('パスワードが違います'); }
  };

  // 予約追加処理
  const submitBooking = async () => {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxjxY9p1ZQDQI1HASKT-u-1-qjLWq4oFBXP-hLuEYWRE56PaTvvF3y0D7b8XQtv2Iq3/exec', {
      method: 'POST',
      body: JSON.stringify({ type: 'booking', ...booking })
    });
    const result = await response.json();
    if (result.result === 'success') {
      alert('保存しました！');
      setBooking({ date: '', name: '', time: '', course: '', duration: '', nomination: '', nominationFee: 0, note: '' });
    }
  };

  if (!isAuthenticated) {
    return ( /* ...先ほどのログイン画面... */ );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>運営スタッフ用管理画面</h1>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px' }}>
        <h3>新規予約登録</h3>
        <input type="date" onChange={(e) => setBooking({...booking, date: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <input type="text" placeholder="名前" onChange={(e) => setBooking({...booking, name: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <input type="text" placeholder="時間 (例: 14:30)" onChange={(e) => setBooking({...booking, time: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        
        <select onChange={(e) => setBooking({...booking, course: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
          <option value="">コース選択</option>
          <option value="A">Aコース</option>
          <option value="B">Bコース</option>
        </select>

        <button onClick={submitBooking} style={{ width: '100%', padding: '10px', background: '#cdb273', color: '#fff', border: 'none', cursor: 'pointer' }}>
          スプレッドシートに保存
        </button>
      </div>
    </div>
  );
}
