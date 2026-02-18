import React, { useEffect, useState } from "react";

export function InterstitialAd({
  seconds = 10,
  onSkip
}: {
  seconds?: number;
  onSkip: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const t = setInterval(() => setLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, []);

  const canSkip = left <= 0;

  return (
    <div className="modalBack">
      <div className="modal">
        <div className="modalHead">
          <div style={{ fontWeight: 900 }}>Hirdetés</div>
          <div className="p">10 mp után átugorható (Premiumban nincs).</div>
        </div>
        <div className="modalBody">
          <div className="adBox">
            Interstitial kreatív helye<br/>
            <span style={{ fontSize: 12, opacity: .75 }}>Itt köthetsz be ad hálózatot.</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop: 14, gap: 12 }}>
            <div className="small">{canSkip ? "Most átugorható" : `Átugorható: ${left}s`}</div>
            <button className="btn primary" disabled={!canSkip} onClick={onSkip}>Hirdetés átugrása</button>
          </div>
        </div>
      </div>
    </div>
  );
}
