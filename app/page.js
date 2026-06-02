'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [schedule, setSchedule] = useState([]);
  const sliderImages = ['/hero.jpg', '/hero2.jpg', '/hero3.jpg'];
  const [currentSlide, setCurrentSlide] = useState(0);

  // データ取得とスライダーのタイマー
  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => setSchedule(data))
      .catch(err => console.error("出勤表の読み込みエラー:", err));

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const therapists = [
    { name: "Yuna", image: "/therapist1.jpg" },
    { name: "Mio", image: "/therapist2.jpg" },
    { name: "Rina", image: "/therapist3.jpg" }
  ];

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
            <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`} style={{ backgroundImage: 'url(' + image + ')' }} />
          ))}
          <div className="slider-overlay-layer"></div>
        </div>
      </section>

      {/* スプレッドシート連携の出勤表 */}
      <section className="section">
        <h2 className="section-title-en">Today's Therapists</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">本日の出勤情報</p>
        <div className="info-status-box">
          <div className="status-icon">📅</div>
          <div className="status-text">
            {schedule.length > 0 ? (
              schedule.map((item, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <strong>{item.therapist_name}</strong> : {item.status}
                </div>
              ))
            ) : (
              <div>只今、更新を確認中です...</div>
            )}
          </div>
        </div>
      </section>

      {/* セラピスト一覧 */}
      <section className="section" style={{ paddingTop: '0px' }}>
        <h2 className="section-title-en">Therapists</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">セラピスト一覧</p>
        <div className="cards">
          {therapists.map((t, index) => (
            <div className="card" key={index}>
              <img src={t.image} alt={t.name} />
              <h3>{t.name}</h3>
              <a href="#" className="card-link">› PROFILE</a>
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
