import React from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { LoginPage } from "./pages/Login";
import { ProfilesPage } from "./pages/Profiles";
import { BrowsePage } from "./pages/Browse";
import { SearchPage } from "./pages/Search";
import { TitlePage } from "./pages/Title";
import { WatchPage } from "./pages/Watch";
import { AccountPage } from "./pages/Account";
import { MyListPage } from "./pages/MyList";
import { getActiveProfileId, getAuth } from "./lib/storage";

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}

function Shell() {
  const loc = useLocation();
  const hideNav = loc.pathname === "/login";

  return (
    <>
      {!hideNav ? <NavBar /> : null}
      <Routes>
        <Route path="/" element={<Bootstrap />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profiles" element={<RequireAuth><ProfilesPage /></RequireAuth>} />

        <Route path="/browse" element={<RequireAuthProfile><BrowsePage /></RequireAuthProfile>} />
        <Route path="/search" element={<RequireAuthProfile><SearchPage /></RequireAuthProfile>} />
        <Route path="/my-list" element={<RequireAuthProfile><MyListPage /></RequireAuthProfile>} />
        <Route path="/title/:id" element={<RequireAuthProfile><TitlePage /></RequireAuthProfile>} />
        <Route path="/watch/:titleId/:episodeId" element={<RequireAuthProfile><WatchPage /></RequireAuthProfile>} />
        <Route path="/account" element={<RequireAuthProfile><AccountPage /></RequireAuthProfile>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function Bootstrap() {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!getActiveProfileId()) return <Navigate to="/profiles" replace />;
  return <Navigate to="/browse" replace />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAuthProfile({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!getActiveProfileId()) return <Navigate to="/profiles" replace />;
  return <>{children}</>;
}
