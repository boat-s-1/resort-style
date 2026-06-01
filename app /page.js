export default function Home() {
  return (
    <main>
      <section className="hero">
        <h1>Resort-Style</h1>
        <p>Private Relaxation Salon</p>
        <a href="#therapist">セラピストを見る</a>
      </section>

      <section id="therapist">
        <h2>おすすめセラピスト</h2>

        <div className="cards">
          <div className="card">
            <img src="/therapist1.jpg" alt="" />
            <h3>Yuna</h3>
            <p>癒し系セラピスト</p>
          </div>

          <div className="card">
            <img src="/therapist2.jpg" alt="" />
            <h3>Mio</h3>
            <p>笑顔が魅力</p>
          </div>

          <div className="card">
            <img src="/therapist3.jpg" alt="" />
            <h3>Rina</h3>
            <p>新人セラピスト</p>
          </div>
        </div>
      </section>

      <section className="info">
        <h2>本日の出勤</h2>
        <p>近日実装予定</p>

        <h2>料金システム</h2>
        <p>60分 12,000円〜</p>

        <h2>求人情報</h2>
        <p>セラピスト募集中</p>
      </section>
    </main>
  );
}
