'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function MyPageContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '未選択';
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzldBaCb58P6wQtmUMbfMBX_K8KwdOouBNTrIC0pjwehtBG0mLpTOxjPV5-xE-hxb0J/exec';
　const [message, setMessage] = useState(''); // 入力用ステート追加
  useEffect(() => {
    fetch(GAS_URL)
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  // スプレッドシート記録 ＆ LINE通知送信
  const sendReport = async (message) => {
    setLoading(true); // 送信中にボタン無効化など
    
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, message: message })
      });
      
      alert(`${message} を送信しました！`);
    } catch (error) {
      alert('送信に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const myData = data.filter(row => row.name === name);
  const totalSalary = myData.reduce((sum, row) => sum + row.salary, 0);

 return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.2rem' }}>マイページ - {name} さん</h1>
      
      {/* 報酬表示部分はそのまま */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>【本日の報酬見込み】</p>
        <h2 style={{ margin: '0', color: '#d32f2f' }}>¥ {totalSalary.toLocaleString()}</h2>
      </div>

      {/* ボタンのレイアウト修正 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button disabled={loading} onClick={() => sendReport('お仕事開始')} style={btnStyle}>お仕事開始</button>
        <button disabled={loading} onClick={() => sendReport('退勤通知')} style={btnStyle}>退勤通知</button>
        <button disabled={loading} onClick={() => sendReport('出勤報告')} style={btnStyle}>出勤報告</button>
      </div>

      {/* 姫予約入力エリアの追加 */}
      <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>■ 姫予約を入力</h3>
        <textarea 
          placeholder="お客様名やコース内容を入力..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '5px' }}
        />
        <button 
          disabled={loading || !message} 
          onClick={() => { sendReport(`姫予約: ${message}`); setMessage(''); }} 
          style={{ width: '100%', padding: '10px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '5px' }}
        >
          予約をメールで送信
        </button>
      </div>

      {/* 以下、予約状況・合計給与はそのまま */}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div>読み込み中...</div>}><MyPageContent /></Suspense>;
}
