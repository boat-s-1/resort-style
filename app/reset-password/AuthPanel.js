export default function AuthPanel({ title, children }) {
  return <main className="admin-shell admin-login-shell">
    <section className="admin-panel recovery-panel">
      <p className="admin-kicker">RESORT-STYLE</p>
      <h1>{title}</h1>
      {children}
    </section>
    <style>{`
      .recovery-panel { width: min(100%, 480px); margin: 0 auto; overflow-wrap: anywhere; }
      .recovery-panel form, .recovery-panel label { display: grid; gap: 12px; }
      .recovery-panel input { box-sizing: border-box; width: 100%; min-width: 0; min-height: 48px; padding: 10px; border: 1px solid #d9d1ca; border-radius: 10px; font: inherit; }
      .recovery-panel button { min-height: 48px; }
      .recovery-panel button:disabled { opacity: .6; }
    `}</style>
  </main>;
}
