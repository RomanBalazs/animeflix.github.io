import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../lib/storage";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmailState] = useState("");
  const [pw, setPw] = useState("");

  return (
    <div className="container" style={{ minHeight: "calc(100vh - 56px)", display:"flex", alignItems:"center", justifyContent:"center", paddingTop: 30, paddingBottom: 30 }}>
      <div className="card" style={{ width: "min(520px, 100%)", padding: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 950 }}>AnimeFlix</div>
        <div className="p">Bejelentkezés (lokális demo)</div>

        <div style={{ marginTop: 18 }}>
          <div className="small">Email</div>
          <input value={email} onChange={(e)=>setEmailState(e.target.value)}
            placeholder="pelda@email.hu"
            style={inpStyle()}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="small">Jelszó</div>
          <input value={pw} onChange={(e)=>setPw(e.target.value)}
            placeholder="••••••••"
            type="password"
            style={inpStyle()}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="btn primary" style={{ width:"100%" }}
            disabled={!email && !pw}
            onClick={() => {
              setAuth(email || "demo@animeflix.local");
              nav("/profiles", { replace: true });
            }}>
            Belépés
          </button>
        </div>

        <div className="small" style={{ marginTop: 10, opacity: .8 }}>
          Demo: nem küld semmit szerverre.
        </div>
      </div>
    </div>
  );
}

function inpStyle(): React.CSSProperties {
  return {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)",
    outline: "none"
  };
}
