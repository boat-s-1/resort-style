export default function Home() {
  const therapists = [
    "Yuna",
    "Mio",
    "Rina",
    "Karen",
    "Ayaka",
    "Mao",
    "Nana",
    "Yui",
    "Reina",
    "Noa",
  ];

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="overlay">
          <h1>Resort-Style</h1>
          <p>Luxury Relaxation Salon</p>

          <div className="hero-info">
            <p>愛知県豊橋市</p>
            <p>営業時間 10:00〜翌5:00</p>
          </div>

          <a href="#therapists" className="hero-btn">
            セラピストを見る
          </a>
        </div>
      </section>

      {/* Schedule */}
      <section className="section">
        <h2>Today's Therapists</h2>

        <div className="schedule-box">
          <p>本日の出勤情報は近日公開予定です。</p>
        </div>
      </section>

      {/* Therapists */}
      <section className="section" id="therapists">
        <h2>Therapists</h2>

        <div className="cards">
          {therapists.map((name, index) => (
            <div className="card" key={index}>
              <img
                src={`/therapist${(index % 3) + 1}.jpg`}
                alt={name}
              />
              <h3>{name}</h3>
              <p>Resort Style Therapist</p>
            </div>
          ))}
        </div>
      </section>

      {/* New Face */}
      <section className="section">
        <h2>New Face</h2>

        <div className="info-box">
          <p>新人セラピスト情報は近日公開予定です。</p>
        </div>
      </section>

      {/* System */}
      <section className="section">
        <h2>Price System</h2>

        <table className="price-table">
          <thead>
            <tr>
              <th>コース</th>
              <th>料金</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>60分</td>
              <td>---</td>
            </tr>

            <tr>
              <td>90分</td>
              <td>---</td>
            </tr>

            <tr>
              <td>120分</td>
              <td>---</td>
            </tr>

            <tr>
              <td>延長30分</td>
              <td>---</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Recruit */}
      <section className="section">
        <h2>Recruit</h2>

        <div className="info-box">
          <p>未経験歓迎</p>
          <p>高収入・日払い対応</p>
          <p>自由出勤</p>
        </div>
      </section>

      {/* Contact */}
      <section className="section">
        <h2>Contact</h2>

        <form className="contact-form">
          <input type="text" placeholder="お名前" />
          <input type="email" placeholder="メールアドレス" />
          <textarea placeholder="お問い合わせ内容"></textarea>

          <button type="submit">
            送信する
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer>
        <h3>Resort-Style</h3>

        <p>愛知県豊橋市</p>

        <p>営業時間 10:00〜翌5:00</p>
      </footer>

      {/* Floating Line */}
      <a
        href="#"
        className="line-btn"
      >
        LINE予約
      </a>
    </main>
  );
}
