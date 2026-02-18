import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { clearAuth, getActiveProfileId, getPremium } from "../lib/storage";

export function NavBar() {
  const nav = useNavigate();
  const premium = getPremium();
  const activeProfile = getActiveProfileId();

  return (
    <div className="nav">
      <div className="container">
        <div className="navRow">
          <NavLink to="/browse" className="brand" style={{ textDecoration: "none" }}>
            <span className="badgeA">A</span> AnimeFlix
          </NavLink>

          <div className="navLinks">
            <NavLink to="/browse" className={({isActive}) => "navLink" + (isActive ? " active" : "")}>Kezdőlap</NavLink>
            <NavLink to="/search" className={({isActive}) => "navLink" + (isActive ? " active" : "")}>Felfedezés</NavLink>
            <NavLink to="/my-list" className={({isActive}) => "navLink" + (isActive ? " active" : "")}>Saját listám</NavLink>
          </div>

          <div className="right">
            <NavLink to="/search" className="btn" style={{ display: "inline-flex", gap: 8, alignItems:"center" }}>
              <Search size={16}/> Keresés
            </NavLink>

            <NavLink to="/account" className={"btn " + (premium ? "primary" : "")}>
              {premium ? "Premium" : "Free"}
            </NavLink>

            <NavLink to="/profiles" className="btn">
              {activeProfile ? "Profil" : "Válassz profilt"}
            </NavLink>

            <button className="btn" onClick={() => { clearAuth(); nav("/login", { replace: true }); }}>
              Kilépés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
