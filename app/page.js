'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [scheduleData, setScheduleData] = useState([]);
  const sliderImages = ['/hero.jpg', '/hero2.jpg', '/hero3.jpg'];
  const [currentSlide, setCurrentSlide] = useState(0);

  // ★追加：日付を「6/3（水）」形式に変換する関数
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
      .then(data => setScheduleData(data))
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
        <div className="menu-trigger"><div>＝</div><div>MENU</div></div>
        <div className="header-logo-wrapper">
          <div className="header-logo-sub">Luxury Relaxation Salon</div>
          <div className="header-logo-main">Resort-Style</div>
        </div>
        <div className="line-trigger"><div>💬</div><div>LINE</div></div>
      </header>

      <section className="hero">
        <div className="slider-container">
          {sliderImages.map((image, index) => (
            <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`} style={{ backgroundImage: `url(${image})` }} />
          ))}
          <div className="slider-overlay-layer"></div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title-en">Schedule</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">出勤スケジュール</p>
        
        <div style={{ overflowX: 'auto', background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', borderBottom: '2px solid #cdb273', textAlign: 'left' }}>Therapist</th>
                {/* ★修正：ヘッダーでformatDateを使用 */}
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
      {/* セラピスト一覧 */}
      <section className="section" style={{ paddingTop: '0px' }}>
        <h2 className="section-title-en">Therapists</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
       <p className="section-title-ja">セラピスト一覧</p>
        <div className="cards">
          {uniqueTherapists.map((t, index) => (
            <div className="card" key={index}>
              <img src={`/therapist${index + 1}.jpg`} alt={t} onError={(e) => e.target.src = '/default.jpg'} />
              <h3>{t}</h3>
              {/* リンク先を therapist/名前 に指定 */}
              <a href={`/therapist/${t}`} className="card-link">› PROFILE</a>
            </div>
          ))}
        </div>
          ))}
        </div>

        <div className="submenu-grid">
          <a href="#" className="submenu-item"><span className="submenu-icon">📅</span><span className="submenu-title-en">SCHEDULE</span><span className="submenu-title-ja">出勤表</span></a>
          <a href="#" className="submenu-item"><span className="submenu-icon">🌸</span><span className="submenu-title-en">NEW FACE</span><span className="submenu-title-ja">新人情報</span></a>
          <a href="#" className="submenu-item"><span className="submenu-icon">💎</span><span className="submenu-title-en">SYSTEM</span><span className="submenu-title-ja">料金システム</span></a>
          <a href="#" className="submenu-item"><span className="submenu-icon">👠</span><span className="submenu-title-en">RECRUIT</span><span className="submenu-title-ja">求人情報</span></a>
          <a href="#" className="submenu-item"><span className="submenu-icon">✉️</span><span className="submenu-title-en">CONTACT</span><span className="submenu-title-ja">お問い合わせ</span></a>
          <a href="#" className="submenu-item"><span className="submenu-icon">🌴</span><span className="submenu-title-en">BLOG</span><span className="submenu-title-ja">ブログ・お知らせ</span></a>
        </div>
      </section>

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
