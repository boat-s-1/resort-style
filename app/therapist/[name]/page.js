'use client';

// この1行が404を防ぐ魔法です
export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TherapistProfile() {
  const params = useParams();
  const therapistName = decodeURIComponent(params.name);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // あなたの正しいGASのURLであることを確認してください
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => {
        // data.profiles が配列であることを確認して検索
        if (data && data.profiles) {
          const found = data.profiles.find(p => p.name === therapistName);
          setProfile(found);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [therapistName]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
  if (!profile) return <div style={{ padding: '20px', textAlign: 'center' }}>セラピスト情報が見つかりません。</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <a href="/" style={{ color: '#cdb273', textDecoration: 'none' }}>← トップページに戻る</a>
      <h1 style={{ marginTop: '20px' }}>{profile.name}</h1>
      <img src={profile.image_url} alt={profile.name} style={{ width: '100%', borderRadius: '10px', marginTop: '10px' }} />
      <p style={{ marginTop: '20px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{profile.profile_text}</p>
    </div>
  );
}
