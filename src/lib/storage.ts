export type Profile = { id: string; name: string; avatar: string; maturity: "KID"|"TEEN"|"ADULT" };
export type WatchState = { titleId: string; episodeId: string; progressSec: number; durationSec: number; updatedAt: number };

const k = {
  auth: "animeflix:auth",
  profiles: "animeflix:profiles",
  activeProfile: "animeflix:activeProfileId",
  premium: "animeflix:premium",
  watchlist: "animeflix:watchlist",
  watchstate: "animeflix:watchstate"
} as const;

const isBrowser = () => typeof window !== "undefined";

export function getAuth(): { email: string; loggedInAt: number } | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(k.auth);
  return raw ? JSON.parse(raw) : null;
}
export function setAuth(email: string) {
  localStorage.setItem(k.auth, JSON.stringify({ email, loggedInAt: Date.now() }));
}
export function clearAuth() {
  localStorage.removeItem(k.auth);
  localStorage.removeItem(k.activeProfile);
}

export function getPremium(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(k.premium) === "1";
}
export function setPremium(v: boolean) {
  localStorage.setItem(k.premium, v ? "1" : "0");
}

export function getProfiles(): Profile[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(k.profiles);
  if (raw) return JSON.parse(raw);
  const defaults: Profile[] = [
    { id: "p1", name: "Balázs", avatar: "🦊", maturity: "ADULT" },
    { id: "p2", name: "Vendég", avatar: "🐺", maturity: "TEEN" },
    { id: "p3", name: "Gyerek", avatar: "🧸", maturity: "KID" }
  ];
  localStorage.setItem(k.profiles, JSON.stringify(defaults));
  return defaults;
}
export function setProfiles(p: Profile[]) {
  localStorage.setItem(k.profiles, JSON.stringify(p));
}

export function getActiveProfileId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(k.activeProfile);
}
export function setActiveProfileId(id: string) {
  localStorage.setItem(k.activeProfile, id);
}

export function getWatchlist(): string[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(k.watchlist);
  return raw ? JSON.parse(raw) : [];
}
export function toggleWatchlist(titleId: string) {
  const set = new Set(getWatchlist());
  if (set.has(titleId)) set.delete(titleId); else set.add(titleId);
  localStorage.setItem(k.watchlist, JSON.stringify(Array.from(set)));
}

export function getWatchStates(): WatchState[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(k.watchstate);
  return raw ? JSON.parse(raw) : [];
}
export function upsertWatchState(ws: WatchState) {
  const all = getWatchStates();
  const idx = all.findIndex(x => x.titleId === ws.titleId);
  if (idx >= 0) all[idx] = ws; else all.push(ws);
  localStorage.setItem(k.watchstate, JSON.stringify(all));
}
