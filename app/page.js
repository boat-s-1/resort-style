export default function Home() {
  const therapists = [
    { name: "Yuna", age: 24, image: "/therapist1.jpg" },
    { name: "Mio", age: 22, image: "/therapist2.jpg" },
    { name: "Rina", age: 25, image: "/therapist3.jpg" },
    { name: "Airi", age: 23, image: "/therapist1.jpg" },
    { name: "Mika", age: 26, image: "/therapist2.jpg" },
    { name: "Saki", age: 22, image: "/therapist3.jpg" }
  ];

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="overlay">
          <h1>Resort-Style</h1>
          <p>愛知県豊橋市の高級リラクゼーションサロン</p>
          <div className="hero-info">
            <p>営業時間 10:00〜翌5:00</p>
          </div>
          <a href="#therapists" className="hero-btn">
            セラピストを見る
          </a>
        </div>
      </section>

      {/* TODAY */}
      <section className="section">
        <h2>TODAY'S THERAPIST</h2>
        <div className="schedule-box">
          <p>Yuna 12:00〜20:00</p>
          <p>Mio 15:00〜24:00</p>
          <p>Rina 18:00〜LAST</p>
        </div>
      </section>

      {/* NEW FACE */}
      <section className="section">
        <h2>NEW FACE</h2>
        <div className="card">
          <img src="/therapist1.jpg" alt="" />
          <h3>新人入店</h3>
          <p>
            22歳 / T163
            <br />
            上品で優しい癒し系セラピスト
          </p>
        </div>
      </section>

      {/* THERAPIST */}
      <section className="section" id="therapists">
        <h2>THERAPISTS</h2>
        <div className="cards">
          {therapists.map((t, index) => (
            <div className="card" key={index}>
              <img src={t.image} alt={t.name} />
              <h3>{t.name}</h3>
              <p>{t.age}歳</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}  </section>
  {/* ABOUT */}
  <section className="section">
    <h2>ABOUT US</h2>
    <div className="info-box">
      <p>
        日常を忘れる、
        上質なリラクゼーション空間。
      </p>
      <br />
      <p>
        南国リゾートをイメージした
        完全個室サロン。
      </p>
      <br />
      <p>
        洗練されたセラピストによる
        極上の癒しをご提供します。
      </p>
    </div>
  </section>
  {/* GALLERY */}
  <section className="section">
    <h2>GALLERY</h2>
    <div className="cards">
      <div className="card">
        <img src="/hero.jpg" alt="" />
      </div>
      <div className="card">
        <img src="/hero.jpg" alt="" />
      </div>
      <div className="card">
        <img src="/hero.jpg" alt="" />
      </div>
    </div>
  </section>
  {/* PRICE */}
  <section className="section">
    <h2>PRICE SYSTEM</h2>
    <table className="price-table">
      <tbody>
        <tr>
          <th>60分</th>
          <td>-----</td>
        </tr>
        <tr>
          <th>90分</th>
          <td>-----</td>
        </tr>
        <tr>
          <th>120分</th>
          <td>-----</td>
        </tr>
        <tr>
          <th>150分</th>
          <td>-----</td>
        </tr>
        <tr>
          <th>180分</th>
          <td>-----</td>
        </tr>
      </tbody>
    </table>
  </section>
  {/* RECRUIT */}
  <section className="section">
    <h2>RECRUIT</h2>
    <div className="info-box">
      <h3>セラピスト募集中</h3>
      <br />
      <p>完全自由出勤</p>
      <p>未経験歓迎</p>
      <p>高バック率</p>
      <p>日給30,000円以上可能</p>
    </div>
  </section>
  {/* BLOG */}
  <section className="section">
    <h2>NEWS</h2>
    <div className="info-box">
      <p>2026.06.03 サイトオープン</p>
      <p>2026.06.01 新人セラピスト入店</p>
    </div>
  </section>
  {/* ACCESS */}
  <section className="section">
    <h2>ACCESS</h2>
    <div className="info-box">
      <p>愛知県豊橋市</p>
      <br />
      <p>営業時間 10:00〜翌5:00</p>
      <br />
      <p>TEL 0532-xx-xxxx</p>
    </div>
  </section>
  <footer>
    <h3>Resort-Style</h3>
    <p>Private Relaxation Salon</p>
    <br />
    <p>愛知県豊橋市</p>
    <p>営業時間 10:00〜翌5:00</p>
  </footer>
  <a
    href="https://line.me"
    className="line-btn"
  >
    LINE予約
  </a>
</main>

);
}
