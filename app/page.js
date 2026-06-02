'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [schedule, setSchedule] = useState([]);
  
  // スライダー画像
  const sliderImages = ['/hero.jpg', '/hero2.jpg', '/hero3.jpg'];
  const [currentSlide, setCurrentSlide] = useState(0);

  // スプレッドシートからデータを取得
  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzUSn_oR0zIkj4V0iUKoceNhWmzbxg8utL5U2HjlQQ8e9KlhInJuB5_yEGDKgcKAq_q/exec')
      .then(res => res.json())
      .then(data => setSchedule(data))
      .catch(err => console.error("データ取得エラー:", err));

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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

      {/* ここでスプレッドシートのデータを表示 */}
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
              <div>読み込み中...</div>
            )}
          </div>
        </div>
      </section>

      {/* 以降のTherapistsカードなどは省略（同じコードを残してください） */}
      {/* (省略されている部分は先ほどのものと差し替えてください) */}
    </>
  );
}
