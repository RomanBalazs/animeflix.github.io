import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, setActiveProfileId, setProfiles } from "../lib/storage";

export function ProfilesPage() {
  const nav = useNavigate();
  const [profiles, setP] = useState(getProfiles());
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("😺");

  const emojis = useMemo(() => ["🦊","🐺","🧸","😺","🦉","🐼","🐸","🦁","🐙"], []);

  return (
    <div className="container" style={{ paddingTop: 22, paddingBottom: 28 }}>
      <div className="h1">Profil kiválasztása</div>
      <div className="p">Netflix-szerű több profil egy fiókban.</div>

      <div className="grid cols2 cols3" style={{ marginTop: 16 }}>
        {profiles.map(p => (
          <button key={p.id} className="card" style={{ padding: 16, textAlign:"left", cursor:"pointer" }}
            onClick={() => { setActiveProfileId(p.id); nav("/browse", { replace: true }); }}>
            <div style={{ fontSize: 34 }}>{p.avatar}</div>
            <div style={{ marginTop: 10, fontWeight: 900 }}>{p.name}</div>
            <div className="small" style={{ marginTop: 4 }}>Korhatár: {p.maturity}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Új profil hozzáadása</div>

        <div style={{ display:"grid", gap: 10, marginTop: 10 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Profil név"
            style={{
              padding: "12px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.06)",
              color: "rgba(255,255,255,.92)",
              outline: "none"
            }}
          />

          <div style={{ display:"flex", flexWrap:"wrap", gap: 8 }}>
            {emojis.map(e => (
              <button key={e} className={"btn " + (avatar === e ? "primary" : "")} onClick={() => setAvatar(e)}>{e}</button>
            ))}
          </div>

          <button className="btn primary" onClick={() => {
            const id = "p" + Math.random().toString(16).slice(2,8);
            const next = [...profiles, { id, name: name || "Új profil", avatar, maturity: "ADULT" as const }];
            setP(next); setProfiles(next); setName("");
          }}>
            Hozzáadás
          </button>
        </div>
      </div>
    </div>
  );
}
