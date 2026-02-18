import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TITLES } from "../lib/data";
import { getWatchlist, toggleWatchlist } from "../lib/storage";

export function TitlePage() {
  const { id } = useParams();
  const title = useMemo(() => TITLES.find(t => t.id === id), [id]);
  const [inList, setInList] = useState(() => !!title && new Set(getWatchlist()).has(title.id));

  if (!title) {
    return (
      <div className="container" style={{ paddingTop: 18, paddingBottom: 26 }}>
        <div className="h1">Nem található</div>
        <div className="p">Hibás anime ID.</div>
      </div>
    );
  }

  const first = title.seasons?.[0]?.episodes?.[0];

  return (
    <>
      <div className="hero">
        <div className="container heroInner">
          <h1 className="h1">{title.name}</h1>
          <div className="p">{title.tagline}</div>

          <div className="pills">
            <span className="pill">{title.year}</span>
            <span className="pill">{title.studio}</span>
            <span className="pill">{title.ageRating}</span>
            {title.genres.map(g => <span key={g} className="pill">{g}</span>)}
          </div>

          <div className="p" style={{ maxWidth: 900 }}>{title.description}</div>

          <div style={{ marginTop: 14, display:"flex", gap: 10, flexWrap:"wrap" }}>
            {first ? <Link className="btn primary" to={`/watch/${title.id}/${first.id}`}>Lejátszás</Link> : null}
            <button className="btn" onClick={() => { toggleWatchlist(title.id); setInList(new Set(getWatchlist()).has(title.id)); }}>
              {inList ? "Listában" : "Listához"}
            </button>
            <Link className="btn" to="/browse">Vissza</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 26 }}>
        {title.seasons.map(s => (
          <div key={s.season} className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 900 }}>Évad {s.season}</div>
            <div style={{ display:"grid", gap: 10, marginTop: 10 }}>
              {s.episodes.map(e => (
                <div key={e.id} className="card" style={{ padding: 14, boxShadow: "none" }}>
                  <div style={{ fontWeight: 900 }}>{e.title}</div>
                  <div className="small" style={{ marginTop: 4 }}>{e.durationMin} perc • {e.synopsis}</div>
                  <div style={{ marginTop: 10 }}>
                    <Link className="btn primary" to={`/watch/${title.id}/${e.id}`}>Rész indítása</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
