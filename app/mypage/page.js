'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function MyPageContent() {
  const [data, setData] = useState([]);
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '未選択';

  useEffect(() => {
    // スプレッドシートからデータを取得
    fetch('https://script.google.com/macros/s/AKfycbzldBaCb58P6wQtmUMbfMBX_K8KwdOouBNTrIC0pjwehtBG0mLpTOxjPV5-xE-hxb0J/exec')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <h1>{name} さんの報酬明細</h1>
      {data
        .filter(row => row.name === name)
        .map((row, index) => (
          <div key={index} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            <p>日付: {row.date}</p>
            <p>コース: {row.course}</p>
            <h2 style={{ color: '#cdb273' }}>報酬: ¥{row.salary}</h2>
          </div>
        ))}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <MyPageContent />
    </Suspense>
  );
}
