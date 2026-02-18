import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TITLES } from "../lib/data";
import { getPremium, upsertWatchState } from "../lib/storage";
import { InterstitialAd } from "../components/InterstitialAd";

const MOCK_DURATION_SEC = 24 * 60;

export function WatchPage() {
  const nav = useNavigate();
  const { titleId, episodeId } = useParams();

  const title = useMemo(() => TITLES.find(t => t.id === titleId), [titleId]);
  const episode = useMemo(() => {
    if (!title) return null;
    for (const s of title.seasons) {
      const e = s.episodes.find(x => x.id === episodeId);
      if (e) return e;
    }
    return null;
  }, [title, episodeId]);

  const [showAd, setShowAd] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Követelményed szerint: MINDEN indítás előtt dobjon felugrót Free-ban.
    if (!getPremium()) setShowAd(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress(p => {
        const next = Math.min(MOCK_DURATION_SEC, p + 1);
        if (titleId && episodeId) {
          upsertWatchState({
            titleId,
            episodeId,
            progressSec: next,
            durationSec: MOCK_DURATION_SEC,
            updatedAt: Date.now()
          });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, titleId, episodeId]);

  if (!title || !episode) {
    return (
      <div className="container" style={{ paddingTop: 18, paddingBottom: 26 }}>
        <div className="h1">Nem található</div>
        <div className="p">Hibás rész vagy anime ID.</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => nav("/browse", { replace: true })}>Vissza</button>
        </div>
      </div>
    );
  }

  const premium = getPremium();

  return (
    <div className="container" style={{ paddingTop: 18, paddingBottom: 26 }}>
      {showAd && !premium ? (
        <InterstitialAd seconds={10} onSkip={() => setShowAd(false)} />
      ) : null}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12, flexWrap:"wrap" }}>
        <div>
          <div className="h2">{title.name}</div>
          <div className="p">{episode.title}</div>
        </div>
        {!premium ? (
          <Link className="btn" to="/account">Váltás Premiumra</Link>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 12, overflow:"hidden" }}>
        <div style={{ padding: 16, borderBottom:"1px solid rgba(255,255,255,.12)" }}>
          <div style={{ fontWeight: 900 }}>Lejátszó (demo)</div>
          <div className="small" style={{ marginTop: 6 }}>Placeholder. Ide jön majd a HLS/DASH + DRM.</div>
        </div>

        <div style={{ padding: 16 }}>
          <div className="adBox" style={{ marginBottom: 12 }}>
            Videó helye (demo)<br/>
            <span style={{ fontSize: 12, opacity: .75 }}>Progress mentés működik.</span>
          </div>

          <div style={{ display:"flex", gap: 10, flexWrap:"wrap" }}>
            <button className="btn primary" disabled={playing} onClick={() => setPlaying(true)}>Lejátszás</button>
            <button className="btn" disabled={!playing} onClick={() => setPlaying(false)}>Szünet</button>
            <button className="btn" onClick={() => setProgress(0)}>Újra</button>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            Progress: {fmt(progress)} / {fmt(MOCK_DURATION_SEC)}
          </div>

          <div className="p" style={{ marginTop: 10 }}>{episode.synopsis}</div>

          <div style={{ marginTop: 14 }}>
            <Link className="btn" to={`/title/${title.id}`}>Vissza az adatlapra</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
