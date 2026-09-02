'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, therapistImageUrl } from '../../../lib/supabase';

export default function TherapistProfile() {
  const params = useParams();
  const slug = decodeURIComponent(params.name);
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: therapist, error } = await supabase
        .from('resort_therapists')
        .select('*, resort_therapist_stores(resort_stores(name))')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (!error && therapist) {
        setProfile(therapist);
        const { data: scheduleRows } = await supabase
          .from('resort_schedules')
          .select('*, resort_stores(name)')
          .eq('therapist_id', therapist.id)
          .eq('is_published', true)
          .gte('work_date', new Date().toISOString().slice(0, 10))
          .order('work_date')
          .order('start_time');
        setSchedule(scheduleRows || []);
      }
      setLoading(false);
    }
    loadProfile();
  }, [slug]);

  if (loading) return <div className="profile-state">読み込み中…</div>;
  if (!profile) return <div className="profile-state">セラピストが見つかりません。<br /><a href="/">トップへ戻る</a></div>;

  const stores = profile.resort_therapist_stores?.map((item) => item.resort_stores?.name).filter(Boolean).join('・');

  return (
    <main className="profile-container">
      <a href="/" className="back-link">← トップページに戻る</a>
      <article className="profile-card">
        <img src={therapistImageUrl(profile.image_path)} alt={profile.name} className="profile-image" />
        <p className="profile-store">{stores || 'Resort-Style'}</p>
        <h1 className="profile-name">{profile.name}</h1>
        {(profile.age || profile.height) && <p className="profile-stats">{profile.age ? `${profile.age}歳` : ''}{profile.age && profile.height ? ' / ' : ''}{profile.height ? `${profile.height}cm` : ''}</p>}
        <p className="nomination-fee">指名料：{Number(profile.nomination_fee || 0).toLocaleString()}円</p>
        <div className="sns-links">
          {profile.x_url && <a href={profile.x_url} target="_blank" rel="noopener noreferrer">X</a>}
          {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {profile.bluesky_url && <a href={profile.bluesky_url} target="_blank" rel="noopener noreferrer">Bluesky</a>}
        </div>
        {profile.manager_comment && <section className="shop-comment"><h2>店長からの紹介</h2><p>{profile.manager_comment}</p></section>}
        {profile.profile_text && <p className="profile-text">{profile.profile_text}</p>}
      </article>
      <section className="profile-schedule">
        <h2>{profile.name}の出勤予定</h2>
        {schedule.length ? schedule.map((item) => (
          <div className="profile-schedule-row" key={item.id}>
            <div><strong>{item.work_date}</strong><span>{item.resort_stores?.name}</span></div>
            <p>{item.start_time?.slice(0, 5) || '--:--'}〜{item.end_time?.slice(0, 5) || '--:--'}{item.note ? `　${item.note}` : ''}</p>
          </div>
        )) : <p className="empty-store-message">現在、公開中の出勤予定はありません。</p>}
      </section>
    </main>
  );
}
