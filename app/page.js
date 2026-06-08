'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

export default function Home() {
  const [scheduleData, setScheduleData] = useState([]);
  const [events, setEvents] = useState([]);
  const sliderImages = ['/hero.jpg'];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');

  const formatDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
    return `${month}/${day}（${dayOfWeek}）`;
  };

  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.schedule) setScheduleData(data.schedule);
          if (data.events) setEvents(data.events);
        }
      })
      .catch(err => console.error("読み込みエラー:", err));

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const dates = [...new Set(scheduleData.map(item => item.date))];
  const uniqueTherapists = [...new Set(scheduleData.map(item => item.therapist_name))];

return (
    <>
      <header className="site-header">
        <div className="menu-trigger" onClick={() => setCurrentPage('recruit')}><div>＝</div><div>求人</div></div>
        <div className="header-logo-wrapper" onClick={() => setCurrentPage('home')} style={{cursor: 'pointer'}}>
          <div className="header-logo-sub">Luxury Relaxation Salon</div>
          <div className="header-logo-main">Resort-Style</div>
        </div>
        <div className="line-trigger"><div>💬</div><div>LINE</div></div>
      </header>

      {currentPage === 'home' ? (
        <>
          <section className="hero">
            <div className="slider-container">
              {sliderImages.map((image, index) => (
                <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`} style={{ backgroundImage: `url(${image})` }} />
              ))}
              <div className="slider-overlay-layer"></div>
            </div>
          </section>

      {/* イベント情報エリア */}
      {events && events.length > 0 && (
        <div className="event-section" style={{ marginTop: '50px', padding: '20px', background: '#fff9f0', borderRadius: '15px', border: '1px solid #cdb273', maxWidth: '800px', margin: '50px auto' }}>
          <h2 style={{ textAlign: 'center', color: '#cdb273', marginBottom: '20px' }}>✨ EVENT INFORMATION</h2>
          {events.map((e, idx) => (
            <div key={idx} style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0', color: '#333' }}>{e.title}</h4>
              <p style={{ fontSize: '13px', color: '#666', margin: '5px 0' }}>{e.description}</p>
              <small style={{ color: '#cdb273' }}>期間：{e.period}</small>
            </div>
          ))}
        </div>
      )}

      <section className="section">
        <h2 className="section-title-en">Schedule</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">出勤スケジュール</p>
        
        <div style={{ overflowX: 'auto', background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', borderBottom: '2px solid #cdb273', textAlign: 'left' }}>Therapist</th>
                {dates.map(d => <th key={d} style={{ padding: '8px', borderBottom: '2px solid #cdb273', whiteSpace: 'nowrap' }}>{formatDate(d)}</th>)}
              </tr>
            </thead>
            <tbody>
              {uniqueTherapists.map(t => (
                <tr key={t}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t}</td>
                  {dates.map(d => {
                    const entry = scheduleData.find(item => item.therapist_name === t && item.date === d);
                    return (
                      <td key={d} style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {entry ? entry.status : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0px' }}>
        <h2 className="section-title-en">Therapists</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">セラピスト一覧</p>
        <div className="cards">
          {uniqueTherapists.map((t, index) => (
            <div className="card" key={index}>
              <img src={`/therapist${index + 1}.jpg`} alt={t} onError={(e) => e.target.src = '/default.jpg'} />
              <h3>{t}</h3>
              <a href={`/therapist/${t}`} className="card-link">› PROFILE</a>
            </div>
          ))}
        </div>

        <div className="price-section" style={{ marginTop: '50px', padding: '30px 20px', background: '#fff', borderRadius: '15px', border: '1px solid #eee' }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>料金システム</h2>
          {[
            { title: "ノーマルコース", desc: "丁寧な揉みほぐしで全身の疲れを癒やします。", prices: [["60分", "10,000円"], ["90分", "14,000円"], ["120分", "18,000円"]] },
            { title: "とろふわコース", desc: "とろけるような感覚をお楽しみください。", prices: [["90分", "18,000円"], ["120分", "23,000円"]] },
            { title: "マイクロコース", desc: "至福のひとときをご提供します。", prices: [["90分", "22,000円"], ["120分", "27,000円"]] }
          ].map((course, idx) => (
            <div key={idx} style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#cdb273', borderBottom: '2px solid #cdb273', paddingBottom: '5px' }}>{course.title}</h3>
              <p style={{ fontSize: '13px', color: '#666', margin: '10px 0' }}>※施術内容：{course.desc}</p>
              <table style={{ width: '100%' }}>
                {course.prices.map((p, i) => (
                  <tr key={i}><td>{p[0]}</td><td style={{ textAlign: 'right' }}>{p[1]}</td></tr>
                ))}
              </table>
            </div>
          ))}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '14px', color: '#555' }}>
            <h4 style={{ marginBottom: '10px' }}>■ その他・オプション</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
              <li>指名料：別途</li>
              <li>延長：20分 4,000円</li>
              <li>ルーム代：500円 / VIPルーム代：3,000円</li>
              <li>深夜割増（22:00以降）：＋500円</li>
              <li>土日祝割増：＋500円</li>
            </ul>
          </div>
        </div>
     </section>


      <section className="section">
        <h2 className="section-title-en">Access</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">店舗所在地</p>
        
        {/* ここにGoogleマップを配置 */}
        <div style={{ marginTop: '20px', width: '100%', maxWidth: '800px', margin: '20px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d487.26885705736595!2d137.3819646985964!3d34.757076982850826!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6004d210465f1493%3A0x42af0831aefc9045!2z44CSNDQxLTgwMzEg5oSb55-l55yM6LGK5qmL5biC5Lit6YO355S677yR77yR77yW4oiS77yV!5e0!3m2!1sja!2sjp!4v1780938305926!5m2!1sja!2sjp" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" 
           width="100%" 
  height="300" 
  style={{ border: 0 }} 
  allowFullScreen="" 
  loading="lazy" 
  referrerPolicy="no-referrer-when-downgrade">
</iframe>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666' }}>
        <p>愛知県豊橋市中郷町</p>
            </div>
          </section>
        </>
      ) : (
        <section className="section" style={{ padding: '100px 20px', minHeight: '60vh' }}>
          <h2 className="section-title-en">Recruit</h2>
          <div className="section-ornament">✧ ⚜️ ✧</div>
       <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left', lineHeight: '1.8', padding: '20px' }}>
  <h3 style={{ borderLeft: '4px solid #cdb273', paddingLeft: '15px' }}>一緒に働いてくれるセラピストを募集中！</h3>
  <p>未経験者大歓迎！研修制度が充実しており、安心してスタートできます。系列店一切なしの完全新規店です。</p>

  {/* 待遇・給与・条件セクション */}
  <div style={{ background: '#fcfaf5', padding: '20px', borderRadius: '10px', border: '1px solid #eee' }}>
    
    <h4 style={{ color: '#cdb273', marginBottom: '10px' }}>【応募資格】</h4>
    <p style={{ fontSize: '14px' }}>18歳〜39歳まで ※未経験・経験者・Wワーク・ブランク大歓迎！</p>

    <h4 style={{ color: '#cdb273', marginTop: '20px', marginBottom: '10px' }}>【給与システム】</h4>
    <p style={{ fontSize: '14px' }}>
      ・60分：6,000円〜<br />
      ・120分：12,000円〜<br />
      ・最低60%〜スタート（経験者は条件クリアで70%バック）<br />
      ・随時バックアップあり、完全日払い制<br />
      <span style={{ fontSize: '12px', color: '#666' }}>※目安：3万円稼ぐには2〜3名接客、6万円なら4〜6名接客</span>
    </p>

    <h4 style={{ color: '#cdb273', marginTop: '20px', marginBottom: '10px' }}>【勤務スタイル】</h4>
    <p style={{ fontSize: '14px' }}>
      ・完全自由出勤制（週1日・1日2〜3時間〜OK）<br />
      ・24時間営業・年中無休<br />
      ・自宅待機OK・完全個室待機<br />
      ・系列店一切なし
    </p>

    <h4 style={{ color: '#cdb273', marginTop: '20px', marginBottom: '10px' }}>【充実の待遇】</h4>
    <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px' }}>
      <li>✅ ネイル・髪色自由</li>
      <li>✅ 制服貸与・WIFI完備</li>
      <li>✅ 時給保証制度あり</li>
      <li>✅ 主婦・シングルマザー大歓迎</li>
    </ul>
  </div>

  <div style={{ textAlign: 'center', marginTop: '30px' }}>
    <p>まずは話を聞いてみたいという方も大歓迎です！<br />お気軽にLINEからお問い合わせください。</p>
    <button onClick={() => setCurrentPage('home')} style={{ padding: '12px 30px', background: '#cdb273', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
      トップに戻る
    </button>
  </div>
</div>
        </section>
      )}

            
      <div className="dual-footer-bar">
        <a href="tel:0532-xx-xxxx" className="footer-btn-call">
          <span style={{ fontSize: '20px' }}>📞</span>
          <div className="btn-main-text-box"><span className="footer-btn-subtext">お電話でのご予約</span><span>0532-xx-xxxx</span></div>
        </a>
        <a href="https://line.me" target="_blank" rel="noopener noreferrer" className="footer-btn-line">
          <span style={{ fontSize: '24px' }}>💬</span>
          <div className="btn-main-text-box"><span className="footer-btn-subtext">24時間受付中</span><span>LINEで予約する</span></div>
        </a>
      </div>
    </>
  );
}
