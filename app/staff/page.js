'use client';
import { useEffect, useState } from 'react';

export default function StaffPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // 先ほどコピーしたURLを貼り付ける
    fetch('https://script.google.com/macros/s/AKfycbzldBaCb58P6wQtmUMbfMBX_K8KwdOouBNTrIC0pjwehtBG0mLpTOxjPV5-xE-hxb0J/exec')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  return (
    <div>
      {/* 自分の名前でフィルターして表示 */}
      {data.filter(row => row.name === "あかり").map((row, index) => (
        <div key={index} className="card">
          <p>{row.date} : {row.course} コース</p>
          <h2 style={{ color: '#cdb273' }}>報酬: ¥{row.salary}</h2>
        </div>
      ))}
    </div>
  );
}

export default function StaffPage() {
  // ここでスプレッドシートから取得した自分のデータを表示
  return (
    <div className="staff-container" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
      <header>
        <h1>マイページ</h1>
      </header>

      {/* 報酬表示 */}
      <section className="salary-card" style={{ background: '#cdb273', color: '#fff', padding: '20px', borderRadius: '10px' }}>
        <p>本日の報酬見込み</p>
        <h2 style={{ fontSize: '32px' }}>¥ 15,400</h2>
      </section>

      {/* アクションボタン */}
      <section className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => alert('店長に通知しました！')}>お仕事開始</button>
        <button onClick={() => alert('店長に通知しました！')}>お仕事終了</button>
      </section>

      {/* 予約状況 */}
      <section className="schedule-list" style={{ marginTop: '20px' }}>
        <h3>本日の予約</h3>
        <div className="card">14:00〜 Aコース (リピート)</div>
      </section>
    </div>
  );
}
