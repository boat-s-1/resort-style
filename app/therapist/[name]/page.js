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
        if (data) {
          // 1. プロフィールを探す
          const foundProfile = data.profiles.find(p => p.name === therapistName);
          setProfile(foundProfile);

          // 2. ★追加：その子の出勤スケジュールだけを抽出
          const foundSchedule = data.schedule.filter(s => s.therapist_name === therapistName);
          setSchedule(foundSchedule); // ※stateに schedule を追加してください
        }
        setLoading(false);
      });
  }, [therapistName]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>セラピストが見つかりません。</div>;

  return (
    <div className="profile-container">
      <a href="/" className="back-link">← BACK TO HOME</a>
      
      <div className="profile-card">
        <img src={profile.image_url} alt={profile.name} className="profile-image" />
        <h1 className="profile-name">{profile.name} <span style={{fontSize:'16px'}}>({profile.age}歳)</span></h1>
        <p className="nomination-fee">指名料：{profile.nomination_fee}円</p>
        
        <div className="sns-links">
          {profile.x_url && <a href={profile.x_url} target="_blank">X</a>}
          {profile.insta_url && <a href={profile.insta_url} target="_blank">Instagram</a>}
          {profile.bsky_url && <a href={profile.bsky_url} target="_blank">Bluesky</a>}
        </div>

        <div className="shop-comment">
          <h4>店長からの紹介</h4>
          <p>{profile.comment}</p>
        </div>

        <p className="profile-text">{profile.profile_text}</p>
      </div>

            <div className="schedule-area" style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '20px' }}>
        <h3 style={{ textAlign: 'center', color: '#cdb273' }}>{therapistName}の出勤予定</h3>
        <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
          {schedule.map((s, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{s.date}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{s.status}</td>
            </tr>
          ))}
        </table>
      </div>

      <style jsx>{`
        .profile-container { padding: 40px 20px; max-width: 600px; margin: 0 auto; background: #fafafa; }
        .profile-card { background: white; padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .profile-image { width: 150px; height: 150px; border-radius: 50%; border: 3px solid #cdb273; object-fit: cover; }
        .nomination-fee { color: #cdb273; font-weight: bold; margin: 10px 0; }
        .sns-links { display: flex; justify-content: center; gap: 15px; margin: 20px 0; }
        .sns-links a { color: #333; text-decoration: none; border: 1px solid #ccc; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
        .shop-comment { background: #fdfbf7; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: left; }
        .profile-text { text-align: left; line-height: 1.8; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
