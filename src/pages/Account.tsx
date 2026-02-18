import React, { useState } from "react";
import { getPremium, setPremium } from "../lib/storage";

export function AccountPage() {
  const [premium, setP] = useState(getPremium());

  return (
    <div className="container" style={{ paddingTop: 18, paddingBottom: 26 }}>
      <div className="h1">Fiók</div>
      <div className="p">Free (hirdetéses) vs Premium (reklámmentes).</div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Állapot: {premium ? "Premium" : "Free"}</div>
          <div className="p" style={{ marginTop: 6 }}>
            Premiumban eltűnik a banner és az epizód előtti 10 mp-es felugró.
          </div>

          <div style={{ marginTop: 12, display:"flex", gap: 10, flexWrap:"wrap" }}>
            <button className="btn primary" onClick={() => {
              const next = !premium;
              setPremium(next);
              setP(next);
            }}>
              {premium ? "Premium kikapcsolása" : "Váltás Premiumra (demo)"}
            </button>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            Éles rendszerben itt Stripe / IAP + entitlement ellenőrzés lenne.
          </div>
        </div>
      </div>
    </div>
  );
}
