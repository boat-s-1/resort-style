'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// この関数がNext.jsに「どのページを作るか」を教えます
export async function generateStaticParams() {
  // 本来はここでFetchしますが、簡易的に一覧を管理している場合は
  // ビルド時に取得するか、動的生成設定を調整します。
  return []; 
}

export default function TherapistProfile() {
  const params = useParams();
  const therapistName = decodeURIComponent(params.name);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => {
        // data.profiles が存在することを確認
        if (data && data.profiles) {
          const found = data.profiles.find(p => p.name === therapistName);
          setProfile(found);
        }
      });
  }, [therapistName]);

  if (!profile) return <div>読み込み中...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{profile.name}のプロフィール</h1>
      <img src={profile.image_url} alt={profile.name} style={{ width: '100%', borderRadius: '10px' }} />
      <p style={{ marginTop: '20px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{profile.profile_text}</p>
      <a href="/" style={{ display: 'block', marginTop: '30px', color: '#cdb273' }}>← トップページに戻る</a>
    </div>
  );
}
