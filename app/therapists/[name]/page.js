'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TherapistProfile() {
  const params = useParams();
  const therapistName = decodeURIComponent(params.name); // URLから名前を取得
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // スプレッドシートから全データを取得
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => {
        // 今のセラピストの名前を探す
        const found = data.profiles.find(p => p.name === therapistName);
        setProfile(found);
      });
  }, [therapistName]);

  if (!profile) return <div>読み込み中...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{profile.name}のプロフィール</h1>
      <img src={profile.image_url} alt={profile.name} style={{ width: '100%', borderRadius: '10px' }} />
      <p style={{ marginTop: '20px', lineHeight: '1.8' }}>{profile.profile_text}</p>
      <a href="/" style={{ display: 'block', marginTop: '30px', color: '#cdb273' }}>← トップページに戻る</a>
    </div>
  );
}
