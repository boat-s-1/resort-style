'use client';

import { useState } from 'react';

const lineUrl = 'https://line.me/R/ti/p/%40999csrjr';

const payRows = [
  ['ノーマル', '60分', '10,000円', '5,000円'],
  ['ノーマル', '90分', '14,000円', '8,000円'],
  ['ノーマル', '120分', '18,000円', '11,000円'],
  ['とろふわ', '90分', '18,000円', '11,000円'],
  ['とろふわ', '120分', '23,000円', '14,000円'],
  ['マイクロ', '90分', '22,000円', '14,000円'],
  ['マイクロ', '120分', '27,000円', '17,000円'],
];

const incomeExamples = [
  { title: '短時間で3本', detail: 'ノーマル90分 × 3本', amount: '24,000円' },
  { title: 'しっかり3本', detail: 'ノーマル120分 × 3本', amount: '33,000円' },
  { title: 'とろふわ3本', detail: 'とろふわ120分 × 3本', amount: '42,000円' },
  { title: 'マイクロ3本', detail: 'マイクロ120分 × 3本', amount: '51,000円' },
];

const faqs = [
  ['体型に自信がなくても応募できますか？', 'はい。Resort-Styleは体型だけで採用を決めません。清潔感、愛嬌、会話、施術への姿勢などを含めて総合的に見ています。'],
  ['未経験でも大丈夫ですか？', '大丈夫です。接客・施術・清掃・安全面まで、初出勤前に必要な内容を講習します。'],
  ['顔出しは必須ですか？', '掲載方法は面接時に相談して決めます。身バレへの不安も含めて、無理のない見せ方を一緒に考えます。'],
  ['出勤はどのくらい必要ですか？', '出勤スタイルは相談可能です。副業・Wワーク、昼だけ・夜だけなど、希望を面接時にお聞かせください。'],
  ['指名料はどうなりますか？', '初指名料は500円〜でセラピストごとに設定、リピート指名料は1,000円〜でセラピストごとに設定します。リピート指名料はセラピストバックです。'],
  ['予約の電話対応も自分でしますか？', '基本的な受付はお店側が24時間体制で対応します。施術中に自分で予約電話を受ける必要はありません。'],
  ['どの店舗で働けますか？', '名古屋・栄、豊橋を順次オープン予定です。安城も物件決定後に展開予定です。勤務エリアは相談して決めます。'],
  ['ノルマや罰金はありますか？', '売上ノルマを前提にした運営は考えていません。当欠・遅刻などの勤務ルールは、契約内容を含め面接時に分かりやすくご説明します。'],
];

export default function RecruitPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#fffdf8 0%,#fff 34%,#fff9fb 100%)', color: '#333' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #eee', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', minHeight: 70, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <a href="/" style={{ textDecoration: 'none', color: '#333' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#9b8350' }}>Luxury Relaxation Salon</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'serif' }}>Resort-Style</div>
          </a>
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#06c755', color: '#fff', textDecoration: 'none', borderRadius: 999, padding: '11px 18px', fontWeight: 700, fontSize: 14 }}>
            LINEで求人相談
          </a>
        </div>
      </header>

      <section style={{ padding: '62px 18px 46px', textAlign: 'center' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '7px 14px', borderRadius: 999, background: '#fce7f3', color: '#be185d', fontWeight: 700, fontSize: 13, marginBottom: 18 }}>
            名古屋・豊橋 オープニングセラピスト募集
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(34px,8vw,62px)', lineHeight: 1.2, letterSpacing: '-0.04em', color: '#2f2a27' }}>
            体型より、<br /><span style={{ color: '#c5899e' }}>愛嬌重視。</span>
          </h1>
          <p style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 700, margin: '22px 0 12px', color: '#806a3d' }}>
            あなたらしい魅力が、ちゃんと稼ぎになる。
          </p>
          <p style={{ maxWidth: 620, margin: '0 auto', fontSize: 15, lineHeight: 2, color: '#666' }}>
            Resort-Styleは、見た目だけで採用を決めるお店ではありません。<br />
            愛嬌、会話、マッサージ、人を癒すのが好き。<br />
            あなたの「いいところ」を一緒に見つけて、選ばれるセラピストへ育てます。
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
            <a href={lineUrl} target="_blank" rel="noopener noreferrer" style={{ minWidth: 230, padding: '15px 22px', borderRadius: 12, background: '#06c755', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>LINEでまず相談する</a>
            <a href="#pay" style={{ minWidth: 200, padding: '15px 22px', borderRadius: 12, border: '1px solid #cdb273', color: '#8b7444', textDecoration: 'none', fontWeight: 700, background: '#fff' }}>お給料を見る</a>
          </div>
          <p style={{ fontSize: 11, color: '#999', marginTop: 12 }}>質問だけでもOK。応募を決める前の相談も歓迎です。</p>
        </div>
      </section>

      <section style={{ padding: '34px 18px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, marginBottom: 10 }}>こんな理由で迷っていませんか？</h2>
          <p style={{ textAlign: 'center', color: '#777', marginBottom: 25 }}>Resort-Styleでは、それだけで不採用にはしません。</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
            {['体型に自信がない','メンエス未経験','写真やプロフィールが苦手','他店で思うように稼げなかった'].map((x) => (
              <div key={x} style={{ background: '#fff', border: '1px solid #f0e5e8', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 8px 28px rgba(70,50,50,.05)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                <strong>{x}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 18px', background: '#fffaf0' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28 }}>Resort-Styleが大切にする5つ</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 28 }}>
            {[
              ['01','体型だけで決めない','愛嬌・会話・清潔感・施術・頑張る姿勢まで総合的に見ます。'],
              ['02','24時間受付はお店側','予約受付はお店側で対応。接客に集中しやすい環境をつくります。'],
              ['03','未経験講習あり','接客・施術・清掃・安全面まで、初出勤前にサポートします。'],
              ['04','プロフィールも一緒に作る','写真・紹介文・推しポイントまで、その子に合わせて売り方を考えます。'],
              ['05','リピートを収入につなげる','リピート指名料はセラピストバック。頑張りが直接収入につながります。'],
            ].map(([n,t,d]) => (
              <div key={n} style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #eee' }}>
                <div style={{ color: '#cdb273', fontWeight: 800, fontSize: 12 }}>{n}</div>
                <h3 style={{ margin: '7px 0', fontSize: 18 }}>{t}</h3>
                <p style={{ margin: 0, color: '#666', lineHeight: 1.8, fontSize: 14 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pay" style={{ padding: '54px 18px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28 }}>お給料・バック</h2>
          <p style={{ textAlign: 'center', color: '#777', lineHeight: 1.8 }}>コースごとに分かりやすいバック設定。実際の接客本数に応じて積み上がります。</p>
          <div style={{ overflowX: 'auto', marginTop: 24, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr>{['コース','時間','お客様料金','セラピストバック'].map(h => <th key={h} style={{ padding: 14, background: '#8d794c', color: '#fff', fontSize: 13 }}>{h}</th>)}</tr></thead>
              <tbody>{payRows.map((row,i) => <tr key={i}>{row.map((v,j) => <td key={j} style={{ padding: 14, textAlign: 'center', borderBottom: '1px solid #eee', fontWeight: j===3 ? 800 : 400, color: j===3 ? '#be185d' : '#444' }}>{v}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{ marginTop: 18, padding: 18, background: '#fff7fb', borderRadius: 14, color: '#555', lineHeight: 1.9, fontSize: 14 }}>
            <strong>指名料：</strong> 初指名 500円〜 / リピート指名 1,000円〜（セラピストごとに変動）<br />
            <strong>リピート指名料：</strong> セラピストバック
          </div>
        </div>
      </section>

      <section style={{ padding: '50px 18px', background: '#fafafa' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28 }}>1日の収入イメージ</h2>
          <p style={{ textAlign: 'center', color: '#777' }}>施術バックのみの単純例です。</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 24 }}>
            {incomeExamples.map((x) => (
              <div key={x.title} style={{ background: '#fff', borderRadius: 16, padding: 22, textAlign: 'center', border: '1px solid #eee' }}>
                <div style={{ fontSize: 13, color: '#888' }}>{x.title}</div>
                <div style={{ margin: '8px 0', fontSize: 14 }}>{x.detail}</div>
                <div style={{ fontSize: 27, fontWeight: 800, color: '#be185d' }}>{x.amount}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#999', lineHeight: 1.7 }}>
            ※収入例は予約数やコースにより変動します。接客本数・収入を保証するものではありません。指名料等は含んでいません。
          </p>
        </div>
      </section>

      <section style={{ padding: '52px 18px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28 }}>未経験から初出勤まで</h2>
          <div style={{ marginTop: 28 }}>
            {[
              ['STEP 1','LINEで相談','質問だけでも大丈夫です。希望エリア・働き方などを簡単に伺います。'],
              ['STEP 2','面接','経験だけでなく、得意なこと・希望収入・働ける時間を確認します。'],
              ['STEP 3','講習','接客、施術、清掃、安全面など必要な内容を確認します。'],
              ['STEP 4','プロフィール作成','写真・紹介文・推しポイントを一緒に作り、集客につなげます。'],
              ['STEP 5','初出勤','受付はお店側でサポート。出勤後もプロフィールや接客を改善します。'],
            ].map(([step,title,desc]) => (
              <div key={step} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, padding: '18px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 800, color: '#cdb273' }}>{step}</div>
                <div><strong style={{ fontSize: 17 }}>{title}</strong><p style={{ margin: '6px 0 0', color: '#666', lineHeight: 1.8, fontSize: 14 }}>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '52px 18px', background: '#fffaf0' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28 }}>募集エリア</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 24 }}>
            {[
              ['名古屋・栄','2026年10月オープン予定'],
              ['豊橋','2026年11月オープン予定'],
              ['安城','物件決定後オープン予定'],
            ].map(([city,status]) => <div key={city} style={{ background:'#fff',border:'1px solid #eadfca',borderRadius:16,padding:22,textAlign:'center' }}><h3 style={{margin:'0 0 8px'}}>{city}</h3><p style={{margin:0,color:'#8b7444',fontSize:13}}>{status}</p></div>)}
          </div>
        </div>
      </section>

      <section style={{ padding: '52px 18px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28 }}>よくある質問</h2>
          <div style={{ marginTop: 24, borderTop: '1px solid #eee' }}>
            {faqs.map(([q,a],i) => (
              <div key={q} style={{ borderBottom: '1px solid #eee' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 6px', border: 0, background: 'transparent', textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 12, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#333' }}>
                  <span>Q. {q}</span><span>{openFaq === i ? '−' : '＋'}</span>
                </button>
                {openFaq === i && <div style={{ padding: '0 8px 20px', color: '#666', lineHeight: 1.9, fontSize: 14 }}>A. {a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '54px 18px 90px', background: 'linear-gradient(135deg,#fff4f8,#fff9e9)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, marginBottom: 12 }}>まずは話を聞くだけでも大丈夫です。</h2>
          <p style={{ color: '#666', lineHeight: 1.9 }}>経験や体型だけで判断せず、あなたの働き方や得意なことを聞かせてください。</p>
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 18, minWidth: 250, padding: '16px 28px', borderRadius: 12, background: '#06c755', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 17 }}>
            LINEで求人について相談
          </a>
          <div style={{ marginTop: 18 }}><a href="/" style={{ color: '#8b7444', fontSize: 13 }}>Resort-Styleトップへ戻る</a></div>
        </div>
      </section>

      <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 30, display: 'flex', justifyContent: 'center' }}>
        <a href={lineUrl} target="_blank" rel="noopener noreferrer" style={{ width: 'min(520px,100%)', textAlign: 'center', padding: '14px 18px', background: '#06c755', color: '#fff', borderRadius: 999, textDecoration: 'none', fontWeight: 800, boxShadow: '0 8px 30px rgba(6,199,85,.28)' }}>
          💬 LINEで求人相談する
        </a>
      </div>
    </main>
  );
}
