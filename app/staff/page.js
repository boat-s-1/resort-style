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
<div style={{ background: '#fdfbf7', padding: '20px', borderRadius: '15px', border: '1px solid #cdb273' }}>
  <label>日付</label>
  <input type="date" onChange={(e) => setBooking({...booking, date: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

  <label>名前</label>
  <input type="text" onChange={(e) => setBooking({...booking, name: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

  <label>予約時間</label>
  <input type="time" onChange={(e) => setBooking({...booking, time: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

  <label>コース (A/B/C)</label>
  <select onChange={(e) => setBooking({...booking, course: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
    <option value="A">A</option><option value="B">B</option><option value="C">C</option>
  </select>

  <label>時間 (60/90/120)</label>
  <select onChange={(e) => setBooking({...booking, duration: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
    <option value="60">60</option><option value="90">90</option><option value="120">120</option>
  </select>

  <label>指名区分</label>
  <select onChange={(e) => setBooking({...booking, nomination: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
    <option value="初指名">初指名</option><option value="リピート">リピート</option>
  </select>

  <label>指名料</label>
  <select onChange={(e) => setBooking({...booking, nominationFee: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
    {[0, 1000, 2000, 3000].map(fee => <option value={fee}>{fee}</option>)}
  </select>

  <label>延長回数</label>
  <select onChange={(e) => setBooking({...booking, extensionCount: e.target.value})} style={{ width: '100%', marginBottom: '20px' }}>
    {[0, 1, 2, 3, 4, 5].map(n => <option value={n}>{n}</option>)}
  </select>

  <button onClick={submitBooking} style={{ width: '100%', padding: '15px', background: '#cdb273', color: '#fff', border: 'none', borderRadius: '5px' }}>
    スプレッドシートに保存
  </button>
</div>
    </div>
  );
}
