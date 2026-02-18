import React from "react";
import { getPremium } from "../lib/storage";

export function AdBanner() {
  if (getPremium()) return null;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="small" style={{ fontWeight: 900 }}>Hirdetés</div>
      <div style={{ marginTop: 6, color: "rgba(255,255,255,.85)", fontSize: 14 }}>
        Free csomag: banner + epizód indítás előtt 10 mp felugró. Premiumban eltűnik.
      </div>
      <div className="small" style={{ marginTop: 8 }}>demo ad slot</div>
    </div>
  );
}
