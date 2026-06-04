'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function MyPageContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '未選択';
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzldBaCb58P6wQtmUMbfMBX_K8KwdOouBNTrIC0pjwehtBG0mLpTOxjPV5-xE-hxb0J/exec';

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
      
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>【本日の報酬見込み】</p>
        <h2 style={{ margin: '0', color: '#d32f2f' }}>¥ {totalSalary.toLocaleString()}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button disabled={loading} onClick={() => sendReport('お仕事開始しました')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>お仕事開始</button>
        <button disabled={loading} onClick={() => sendReport('お仕事終了しました')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>お仕事終了</button>
        <button disabled={loading} onClick={() => sendReport('出勤報告')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>出勤報告</button>
        <button disabled={loading} onClick={() => sendReport('姫予約送信')} style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>姫予約送信</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px' }}>■ 本日の予約状況</h3>
        {myData.map((row, i) => (
          <div key={i} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            {row.date} - {row.course}コース (報酬: ¥{row.salary.toLocaleString()})
          </div>
        ))}
      </div>

      <div style={{ background: '#eee', padding: '15px', borderRadius: '5px' }}>
        <p style={{ margin: '0', fontWeight: 'bold' }}>■ 今月の給与累計</p>
        <h3 style={{ margin: '5px 0 0 0' }}>合計: ¥ {totalSalary.toLocaleString()}</h3>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div>読み込み中...</div>}><MyPageContent /></Suspense>;
}
