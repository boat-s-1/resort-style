'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // スライダー用の画像リスト（アップロードした画像名に合わせて変更してください）
  const sliderImages = [
    '/hero.jpg',
    '/hero2.jpg',
    '/hero3.jpg'
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // 4秒ごとに自動で次の画像に切り替えるタイマー設定
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  const therapists = [
    { name: "Yuna", image: "/therapist1.jpg" },
    { name: "Mio", image: "/therapist2.jpg" },
    { name: "Rina", image: "/therapist3.jpg" }
  ];

  return (
    <>
      {/* HEADER LOGO BAR */}
      <header className="site-header">
        <div className="menu-trigger">
          <div>＝</div>
          <div>MENU</div>
        </div>
        <div className="header-logo-wrapper">
          <div className="header-logo-sub">Luxury Relaxation Salon</div>
          <div className="header-logo-main">Resort-Style</div>
        </div>
        <div className="line-trigger">
          <div>💬</div>
          <div>LINE</div>
        </div>
      </header>

      {/* HERO SECTION (AUTOMATIC FADE SLIDER) */}
      <section className="hero">
        {/* 背景スライダーの器 */}
        <div className="slider-container">
          {sliderImages.map((image, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: url("${image}") }}
            />
          ))}
          {/* 画像の上に重なる黒いアミ（文字を見やすくするため） */}
          <div className="slider-overlay-layer"></div>
        </div>

        {/* 前面に表示する文字コンテンツ（新しいデザイン画像に文字があるため非表示に調整済） */}
        <div className="hero-content">
          <p className="hero-sub-title">愛知県豊橋市の高級リラクゼーションサロン</p>
          <h1 className="hero-main-title">Resort-Style</h1>
          <div className="hero-ornament">⚜️</div>
          <p className="hero-hours">営業時間 10:00～翌5:00</p>
        </div>
      </section>

      {/* TODAY'S THERAPISTS */}
      <section className="section">
        <h2 className="section-title-en">Today's Therapists</h2>
        <div className="section-ornament">✧ ⚜️ ✧</div>
        <p className="section-title-ja">本日の出勤情報</p>

        <div className="info-status-box">
          <div className="status-icon">📅</div>
          <div className="status-text">
            <strong>本日の出勤情報は</strong>
            <br />
            近日公開予定です。
          </div>
        </div>
      </section>

      {/* THERAPISTS LIST */}
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

        {/* 6 PREMIUM NAVIGATION BUTTONS */}
        <div className="submenu-grid">
          <a href="#" className="submenu-item">
            <span className="submenu-icon">📅</span>
            <span className="submenu-title-en">SCHEDULE</span>
            <span className="submenu-title-ja">出勤表</span>
          </a>
          <a href="#" className="submenu-item">
            <span className="submenu-icon">🌸</span>
            <span className="submenu-title-en">NEW FACE</span>
            <span className="submenu-title-ja">新人情報</span>
          </a>
          <a href="#" className="submenu-item">
            <span className="submenu-icon">💎</span>
            <span className="submenu-title-en">SYSTEM</span>
            <span className="submenu-title-ja">料金システム</span>
          </a>
          <a href="#" className="submenu-item">
            <span className="submenu-icon">👠</span>
            <span className="submenu-title-en">RECRUIT</span>
            <span className="submenu-title-ja">求人情報</span>
          </a>
          <a href="#" className="submenu-item">
            <span className="submenu-icon">✉️</span>
            <span className="submenu-title-en">CONTACT</span>
            <span className="submenu-title-ja">お問い合わせ</span>
          </a>
          <a href="#" className="submenu-item">
            <span className="submenu-icon">🌴</span>
            <span className="submenu-title-en">BLOG</span>
            <span className="submenu-title-ja">ブログ・お知らせ</span>
          </a>
        </div>
      </section>

      {/* FIXED DUAL FOOTER BAR */}
      <div className="dual-footer-bar">
        <a href="tel:0532-xx-xxxx" className="footer-btn-call">
          <span style={{ fontSize: '20px' }}>📞</span>
          <div className="btn-main-text-box">
            <span className="footer-btn-subtext">お電話でのご予約</span>
            <span>0532-xx-xxxx</span>
          </div>
        </a>
        <a href="https://line.me" target="_blank" rel="noopener noreferrer" className="footer-btn-line">
          <span style={{ fontSize: '24px' }}>💬</span>
          <div className="btn-main-text-box">
            <span className="footer-btn-subtext">24時間受付中</span>
            <span>LINEで予約する</span>
          </div>
        </a>
      </div>
    </>
  );
}
