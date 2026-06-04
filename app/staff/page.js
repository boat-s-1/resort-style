'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // URLから名前を受け取るために必要

export default function StaffPage() {
  const [allData, setAllData] = useState([]);
  const searchParams = useSearchParams();
  const userName = searchParams.get('name'); // URLから名前を取得 (例: /staff?name=あかり)

  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzldBaCb58P6wQtmUMbfMBX_K8KwdOouBNTrIC0pjwehtBG0mLpTOxjPV5-xE-hxb0J/exec')
      .then(res => res.json())
      .then(data => setAllData(data));
  }, []);

  // ログインしている女の子のデータだけを抽出
  const myData = allData.filter(row => row.name === userName);

  return (
    <div>
      <h1>{userName} さんのマイページ</h1>
      {myData.map((row, index) => (
        <div key={index} className="card">
          <p>{row.date} : {row.course} コース</p>
          <h2 style={{ color: '#cdb273' }}>報酬: ¥{row.salary}</h2>
        </div>
      ))}
    </div>
  );
}
