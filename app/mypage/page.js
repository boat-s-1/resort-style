'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const btnStyle = { padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' };

function MyPageContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '未選択';
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzldBaCb58P6wQtmUMbfMBX_K8KwdOouBNTrIC0pjwehtBG0mLpTOxjPV5-xE-hxb0J/exec';

  useEffect(() => {
    fetch(GAS_URL)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error("データ取得エラー:", err));
  }, []);

  const sendReport = async (reportMessage) => {
    if(!reportMessage) return;
    setLoading(true);
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, message: reportMessage })
      });
      alert(`送信しました：${reportMessage}`);
      setMessage('');
    } catch (error) { alert('送信失敗'); } finally { setLoading(false); }
  };

 // 報酬合計の計算部分を以下に差し替えてください
const myData = data.filter(row => row.name === name);

// 確定かつ、報酬が数値であるものだけを合計
const totalSalary = myData
  .filter(r => r.status === '確定')
  .reduce((sum, r) => sum + (Number(r.salary) || 0), 0);

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{name} さん マイページ</h1>
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
        <p>【本日の確定報酬】</p>
        <h2 style={{ color: '#d32f2f' }}>¥ {totalSalary.toLocaleString()}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => sendReport('出勤')} style={btnStyle}>出勤</button>
        <button onClick={() => sendReport('退勤')} style={btnStyle}>退勤</button>
        <button onClick={() => sendReport('お仕事開始')} style={btnStyle}>お仕事開始</button>
        <button onClick={() => sendReport('お仕事終了')} style={btnStyle}>お仕事終了</button>
      </div>

      <div>
        <h3>■ 確定予約</h3>
        {myData.filter(r => r.status === '確定').map((r, i) => (
          <div key={i} style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{r.time}時: {r.course}コース</div>
        ))}
        <h3 style={{ marginTop: '20px' }}>■ 仮予約・予定</h3>
        {myData.filter(r => r.status === '仮予約').map((r, i) => (
          <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#666' }}>{r.time}時: {r.course}コース (仮)</div>
        ))}
      </div>

      <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
        <h3>■ メッセージ/報告</h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: '100%', height: '60px', boxSizing: 'border-box' }} />
        <button onClick={() => sendReport(message)} style={{ width: '100%', marginTop: '5px', background: '#e65100', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer' }}>店長へ送信</button>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div>読み込み中...</div>}><MyPageContent /></Suspense>;
}
