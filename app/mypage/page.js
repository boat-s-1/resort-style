'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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
      .then(data => setData(data));
  }, []);

  const sendReport = async (reportMessage) => {
    setLoading(true);
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, message: reportMessage })
      });
      alert(`送信しました：${reportMessage}`);
    } catch (error) { alert('送信失敗'); } finally { setLoading(false); }
  };

  // スプレッドシートの構成に合わせてインデックスを調整
  // B列(名前), C列(予約時間), D列(コース), E列(時間), H列(支給金額), J列(チェックボックス)
  const myData = data.filter(row => row.name === name);
  const totalSalary = myData.filter(r => r.isChecked).reduce((sum, r) => sum + (Number(r.salary) || 0), 0);

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{name} さん マイページ</h1>
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
        <p>【本日の確定報酬】</p>
        <h2 style={{ color: '#d32f2f' }}>¥ {totalSalary.toLocaleString()}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => sendReport('出勤')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>出勤</button>
        <button onClick={() => sendReport('開始')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>開始</button>
        <button onClick={() => sendReport('終了')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>終了</button>
        <button onClick={() => sendReport('退勤')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>退勤</button>
      </div>

      <div>
        <h3>■ 確定予約</h3>
        {myData.filter(r => r.isChecked).map((r, i) => (
          <div key={i} style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{r.time}時: {r.course}コース</div>
        ))}
        <h3>■ 仮予約</h3>
        {myData.filter(r => !r.isChecked).map((r, i) => (
          <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#666' }}>{r.time}時: {r.course}コース</div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div>読み込み中...</div>}><MyPageContent /></Suspense>;
}
