const therapists = [
  { id: 1, name: "Yuna", age: 24, height: 160, bust: "D", image: "/therapist1.jpg" },
  { id: 2, name: "Mio", age: 22, height: 158, bust: "E", image: "/therapist2.jpg" },
  { id: 3, name: "Rina", age: 25, height: 162, bust: "F", image: "/therapist3.jpg" },
  { id: 4, name: "Karen", age: 23, height: 165, bust: "D", image: "/therapist1.jpg" },
  { id: 5, name: "Ayaka", age: 26, height: 164, bust: "E", image: "/therapist2.jpg" },
  { id: 6, name: "Mao", age: 21, height: 157, bust: "C", image: "/therapist3.jpg" },
  { id: 7, name: "Nana", age: 24, height: 161, bust: "F", image: "/therapist1.jpg" },
  { id: 8, name: "Yui", age: 22, height: 159, bust: "D", image: "/therapist2.jpg" },
  { id: 9, name: "Reina", age: 25, height: 163, bust: "E", image: "/therapist3.jpg" },
  { id: 10, name: "Noa", age: 23, height: 160, bust: "F", image: "/therapist1.jpg" }
];

export default function TherapistsPage() {
  return (
    <main className="section">
      <h1 className="page-title">
        THERAPISTS
      </h1>

      <div className="cards">
        {therapists.map((t) => (
          <div className="card" key={t.id}>
            <img src={t.image} alt={t.name} />
            <h3>{t.name}</h3>
            <p>{t.age}歳</p>
            <p>T{t.height}</p>
            <p>BUST {t.bust}</p>
            <a href={`/therapists/${t.id}`} className="hero-btn">
              PROFILE
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
