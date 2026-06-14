'use client';
import { useState } from 'react';

export default function StaffPage() {
  // 入力フォームのステート
  const [booking, setBooking] = useState({
    date: '', name: '', time: '', course: '', duration: '', nomination: '', nominationFee: 0, note: ''
  });
  const [status, setStatus] = useState('');

  // GASへの送信処理
  const submitBooking = async () => {
    setStatus('送信中...');
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwHJVmB6I8wna32-gtYweLoiqvog3QEF4wRt9tbiAPbq28fRGw-Mdni6Zlth8oFtg/exec', {
        method: 'POST',
        body: JSON.stringify({ type: 'booking', ...booking })
      });
      const result = await response.json();
      
      if (result.result === 'success') {
        alert('保存しました！');
        setBooking({ date: '', name: '', time: '', course: '', duration: '', nomination: '', nominationFee: 0, note: '' });
        setStatus('保存完了');
      }
    } catch (e) {
      setStatus('エラーが発生しました');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>運営スタッフ用管理画面</h1>
      
      <div style={{ background: '#fdfbf7', padding: '20px', borderRadius: '15px', border: '1px solid #cdb273' }}>
        <h3 style={{ color: '#cdb273', marginTop: 0 }}>新規予約登録</h3>
        
        <label style={{ fontSize: '12px', color: '#666' }}>日付</label>
        <input type="date" onChange={(e) => setBooking({...booking, date: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }} />
        
        <label style={{ fontSize: '12px', color: '#666' }}>お名前</label>
        <input type="text" placeholder="名前" onChange={(e) => setBooking({...booking, name: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }} />
        
        <label style={{ fontSize: '12px', color: '#666' }}>予約時間</label>
        <input type="time" onChange={(e) => setBooking({...booking, time: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }} />

        <label style={{ fontSize: '12px', color: '#666' }}>コース</label>
        <select onChange={(e) => setBooking({...booking, course: e.target.value})} style={{ width: '100%', marginBottom: '15px', padding: '8px' }}>
          <option value="">選択してください</option>
          <option value="A">Aコース</option>
          <option value="B">Bコース</option>
        </select>

        <button onClick={submitBooking} style={{ width: '100%', padding: '15px', background: '#cdb273', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          スプレッドシートに保存する
        </button>
        <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '10px' }}>{status}</p>
      </div>
    </div>
  );
}
