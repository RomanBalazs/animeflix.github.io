import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { TITLES } from "../lib/data";
import { AdBanner } from "../components/AdBanner";
import { TitleGrid } from "../components/TitleGrid";
import { getWatchStates, getWatchlist } from "../lib/storage";

export function BrowsePage() {
  const featured = useMemo(() => TITLES.find(t => t.featured) ?? TITLES[0], []);
  const continueWatching = useMemo(() => {
    const states = getWatchStates().sort((a,b)=>b.updatedAt-a.updatedAt);
    const ids = new Set(states.slice(0,10).map(s => s.titleId));
    return TITLES.filter(t => ids.has(t.id));
  }, []);
  const myList = useMemo(() => {
    const ids = new Set(getWatchlist());
    return TITLES.filter(t => ids.has(t.id));
  }, []);

  return (
    <>
      <div className="hero">
        <div className="container heroInner">
          <div className="small" style={{ fontWeight: 900 }}>Kiemelt</div>
          <h1 className="h1" style={{ marginTop: 8 }}>{featured.name}</h1>
          <div className="p">{featured.tagline}</div>
          <div className="pills">
            <span className="pill">{featured.year}</span>
            <span className="pill">{featured.studio}</span>
            <span className="pill">{featured.ageRating}</span>
            {featured.genres.slice(0,3).map(g => <span key={g} className="pill">{g}</span>)}
          </div>
          <div style={{ marginTop: 14, display:"flex", gap: 10, flexWrap:"wrap" }}>
            <Link className="btn primary" to={`/watch/${featured.id}/s1e1`}>Lejátszás</Link>
            <Link className="btn" to={`/title/${featured.id}`}>Infó</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 26 }}>
        <AdBanner />

        {continueWatching.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <div className="h2">Folytatás</div>
            <div className="p">Ott, ahol abbahagytad.</div>
            <div style={{ marginTop: 10 }}>
              <TitleGrid items={continueWatching} />
            </div>
          </section>
        )}

        {myList.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <div className="h2">Saját listám</div>
            <div className="p">Elmentett animék.</div>
            <div style={{ marginTop: 10 }}>
              <TitleGrid items={myList} />
            </div>
          </section>
        )}

        <section style={{ marginTop: 16 }}>
          <div className="h2">Katalógus</div>
          <div className="p">Teljes demo lista.</div>
          <div style={{ marginTop: 10 }}>
            <TitleGrid items={TITLES} />
          </div>
        </section>

        <div className="small" style={{ marginTop: 18 }}>
          Demo projekt. Valós licenc/DRM/CDN integráció későbbi fázis.
        </div>
      </div>
    </>
  );
}
