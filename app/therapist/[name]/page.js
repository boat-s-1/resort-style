'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TherapistProfile() {
  const params = useParams();
  const therapistName = decodeURIComponent(params.name);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => {
        if (data && data.profiles) {
          const found = data.profiles.find(p => p.name === therapistName);
          setProfile(found);
        }
        setLoading(false);
      });
  }, [therapistName]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="error">セラピスト情報が見つかりません。</div>;

  return (
    <div className="profile-container">
      <a href="/" className="back-link">← BACK TO HOME</a>
      
      <div className="profile-card">
        <div className="profile-image-wrapper">
          <img src={profile.image_url} alt={profile.name} className="profile-image" />
        </div>
        <h1 className="profile-name">{profile.name}</h1>
        <div className="profile-divider">✧ ⚜️ ✧</div>
        <p className="profile-text">{profile.profile_text}</p>
      </div>

      <style jsx>{`
        .profile-container { padding: 40px 20px; max-width: 700px; margin: 0 auto; background: #fafafa; min-height: 100vh; }
        .back-link { color: #cdb273; text-decoration: none; font-size: 14px; letter-spacing: 1px; }
        .profile-card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-top: 20px; text-align: center; }
        .profile-image-wrapper { width: 200px; height: 200px; margin: 0 auto 30px; border-radius: 50%; overflow: hidden; border: 3px solid #cdb273; }
        .profile-image { width: 100%; height: 100%; object-fit: cover; }
        .profile-name { font-size: 28px; color: #333; margin-bottom: 10px; }
        .profile-divider { color: #cdb273; margin-bottom: 20px; }
        .profile-text { font-size: 16px; line-height: 2; color: #666; white-space: pre-wrap; text-align: left; }
      `}</style>
    </div>
  );
}
