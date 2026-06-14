'use client';
import { useState } from 'react';

export default function StaffPage() {
  // 初期値に extensionCount を追加しました
 const [booking, setBooking] = useState({
  date: '', name: '', time: '', course: 'A', duration: '60', 
  nomination: '初指名', nominationFee: 0, extensionCount: 0,
  note: '', customerName: '', customerPhone: '' // 追加
});
  const [status, setStatus] = useState('');

const submitBooking = async () => {
  setStatus('送信中...');
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbwHJVmB6I8wna32-gtYweLoiqvog3QEF4wRt9tbiAPbq28fRGw-Mdni6Zlth8oFtg/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 
        'Content-Type': 'application/json' 
      },
     body: JSON.stringify({ type: 'booking', ...booking })
    });

    alert('保存しました！');
    
    // 全ての項目をリセットする
    setBooking({ 
      date: '', name: '', time: '', course: 'A', duration: '60', 
      nomination: '初指名', nominationFee: 0, extensionCount: 0,
      note: '', customerName: '', customerPhone: '' 
    });
    setStatus('保存完了');

  } catch (e) {
    setStatus('エラーが発生しました');
    console.error("エラー詳細:", e);
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>運営スタッフ用管理画面</h1>
      <div style={{ background: '#fdfbf7', padding: '20px', borderRadius: '15px', border: '1px solid #cdb273' }}>
        <label>日付</label>
        <input type="date" value={booking.date} onChange={(e) => setBooking({...booking, date: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

        <label>セラピスト名</label>
        <input type="text" value={booking.name} onChange={(e) => setBooking({...booking, name: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

        <label>予約時間</label>
        <input type="time" value={booking.time} onChange={(e) => setBooking({...booking, time: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

        <label>コース</label>
        <select value={booking.course} onChange={(e) => setBooking({...booking, course: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
          <option value="A">A</option><option value="B">B</option><option value="C">C</option>
        </select>

        <label>時間</label>
        <select value={booking.duration} onChange={(e) => setBooking({...booking, duration: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
          <option value="60">60</option><option value="90">90</option><option value="120">120</option>
        </select>

        <label>指名区分</label>
        <select value={booking.nomination} onChange={(e) => setBooking({...booking, nomination: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
          <option value="初指名">初指名</option><option value="リピート">リピート</option>
        </select>

        <label>指名料</label>
        <select value={booking.nominationFee} onChange={(e) => setBooking({...booking, nominationFee: parseInt(e.target.value)})} style={{ width: '100%', marginBottom: '10px' }}>
          {[0, 1000, 2000, 3000].map(fee => <option key={fee} value={fee}>{fee}</option>)}
        </select>

        <label>延長回数</label>
        <select value={booking.extensionCount} onChange={(e) => setBooking({...booking, extensionCount: parseInt(e.target.value)})} style={{ width: '100%', marginBottom: '20px' }}>
          {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>

　　　　<label>お客様名</label>
<input type="text" value={booking.customerName} onChange={(e) => setBooking({...booking, customerName: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

<label>お客様電話番号</label>
<input type="tel" value={booking.customerPhone} onChange={(e) => setBooking({...booking, customerPhone: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

<label>コメント</label>
<textarea value={booking.note} onChange={(e) => setBooking({...booking, note: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

        <button onClick={submitBooking} style={{ width: '100%', padding: '15px', background: '#cdb273', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          スプレッドシートに保存
        </button>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>{status}</p>
      </div>
    </div>
  );
}
