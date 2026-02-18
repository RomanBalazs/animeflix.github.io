import React, { useMemo, useState } from "react";
import { TITLES } from "../lib/data";
import { TitleGrid } from "../components/TitleGrid";

export function SearchPage() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [mood, setMood] = useState<string>("");

  const genres = useMemo(() => Array.from(new Set(TITLES.flatMap(t => t.genres))).sort(), []);
  const moods = useMemo(() => Array.from(new Set(TITLES.flatMap(t => t.moods))).sort(), []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TITLES.filter(t => {
      const hitText = !s || t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s);
      const hitGenre = !genre || t.genres.includes(genre);
      const hitMood = !mood || t.moods.includes(mood);
      return hitText && hitGenre && hitMood;
    });
  }, [q, genre, mood]);

  return (
    <div className="container" style={{ paddingTop: 18, paddingBottom: 26 }}>
      <div className="h1">Keresés</div>
      <div className="p">Szűrők: műfaj + hangulat.</div>

      <div style={{ display:"grid", gap: 10, marginTop: 12 }}>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Cím, leírás, kulcsszó…"
          style={inp()}
        />

        <div style={{ display:"grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          <select value={genre} onChange={(e)=>setGenre(e.target.value)} style={sel()}>
            <option value="">Műfaj (összes)</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={mood} onChange={(e)=>setMood(e.target.value)} style={sel()}>
            <option value="">Hangulat (összes)</option>
            {moods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="small" style={{ marginTop: 12 }}>Találatok: {results.length}</div>

      <div style={{ marginTop: 10 }}>
        <TitleGrid items={results} />
      </div>
    </div>
  );
}

function inp(): React.CSSProperties {
  return {
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)",
    outline: "none"
  };
}
function sel(): React.CSSProperties {
  return inp();
}
