/* global window, document, ANIMEFLIX_DATA */
(function () {
  const $app = document.getElementById("app");
  const $overlayRoot = document.getElementById("overlayRoot");

  const k = {
    auth: "animeflix:auth",
    profiles: "animeflix:profiles",
    activeProfile: "animeflix:activeProfileId",
    premium: "animeflix:premium",
    watchlist: "animeflix:watchlist",
    watchstate: "animeflix:watchstate"
  };

  // ---------- storage ----------
  function getAuth() {
    const raw = localStorage.getItem(k.auth);
    return raw ? JSON.parse(raw) : null;
  }
  function setAuth(email) {
    localStorage.setItem(k.auth, JSON.stringify({ email: email || "demo@animeflix.local", loggedInAt: Date.now() }));
  }
  function clearAuth() {
    localStorage.removeItem(k.auth);
    localStorage.removeItem(k.activeProfile);
  }
  function getPremium() {
    return localStorage.getItem(k.premium) === "1";
  }
  function setPremium(v) {
    localStorage.setItem(k.premium, v ? "1" : "0");
  }
  function getProfiles() {
    const raw = localStorage.getItem(k.profiles);
    if (raw) return JSON.parse(raw);
    const defaults = [
      { id: "p1", name: "Balázs", avatar: "🦊", maturity: "ADULT" },
      { id: "p2", name: "Vendég", avatar: "🐺", maturity: "TEEN" },
      { id: "p3", name: "Gyerek", avatar: "🧸", maturity: "KID" }
    ];
    localStorage.setItem(k.profiles, JSON.stringify(defaults));
    return defaults;
  }
  function setProfiles(p) { localStorage.setItem(k.profiles, JSON.stringify(p)); }
  function getActiveProfileId() { return localStorage.getItem(k.activeProfile); }
  function setActiveProfileId(id) { localStorage.setItem(k.activeProfile, id); }

  function getWatchlist() {
    const raw = localStorage.getItem(k.watchlist);
    return raw ? JSON.parse(raw) : [];
  }
  function toggleWatchlist(titleId) {
    const set = new Set(getWatchlist());
    if (set.has(titleId)) set.delete(titleId); else set.add(titleId);
    localStorage.setItem(k.watchlist, JSON.stringify(Array.from(set)));
  }

  function getWatchStates() {
    const raw = localStorage.getItem(k.watchstate);
    return raw ? JSON.parse(raw) : [];
  }
  function upsertWatchState(ws) {
    const all = getWatchStates();
    const idx = all.findIndex(x => x.titleId === ws.titleId);
    if (idx >= 0) all[idx] = ws; else all.push(ws);
    localStorage.setItem(k.watchstate, JSON.stringify(all));
  }

  // ---------- helpers ----------
  function htm(el, html) { el.innerHTML = html; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  }
  function route() {
    const raw = (location.hash || "#/").slice(1);
    const [path, qs] = raw.split("?");
    return { path: path || "/", qs: qs || "" };
  }
  function nav(to) { location.hash = "#" + to; }
  function requireAuth() {
    if (!getAuth()) { nav("/login"); return false; }
    return true;
  }
  function requireProfile() {
    if (!requireAuth()) return false;
    if (!getActiveProfileId()) { nav("/profiles"); return false; }
    return true;
  }
  function setNavActive() {
    const { path } = route();
    document.querySelectorAll(".navLink[data-route]").forEach(a => {
      const p = a.getAttribute("data-route");
      if (p && path.startsWith(p)) a.classList.add("active");
      else a.classList.remove("active");
    });

    const planBtn = document.getElementById("planBtn");
    if (planBtn) {
      planBtn.textContent = getPremium() ? "Premium" : "Free";
      planBtn.classList.toggle("primary", getPremium());
    }

    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) profileBtn.textContent = getActiveProfileId() ? "Profil" : "Válassz profilt";

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.style.display = getAuth() ? "inline-flex" : "none";
  }

  function pageWrap(content) {
    return `<div class="container" style="padding-top:18px;padding-bottom:26px">${content}</div>`;
  }

  function adBanner() {
    if (getPremium()) return "";
    return `
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="small" style="font-weight:900">Hirdetés</div>
        <div style="margin-top:6px;color:rgba(255,255,255,.85);font-size:14px">
          Free csomag: banner + epizód indítás előtt 10 mp felugró. Premiumban eltűnik.
        </div>
        <div class="small" style="margin-top:8px">demo ad slot</div>
      </div>
    `;
  }

  function titleGrid(items) {
    return `
      <div class="grid cols2 cols3 cols5">
        ${items.map(t => `
          <a href="#/title/${esc(t.id)}" style="text-decoration:none">
            <div class="tile">
              <div class="tilePoster"></div>
              <div class="tileInfo">
                <div style="font-weight:900">${esc(t.name)}</div>
                <div class="small" style="margin-top:4px">${esc(t.year)} • ${esc(t.studio)}</div>
              </div>
            </div>
          </a>
        `).join("")}
      </div>
    `;
  }

  function findTitle(id) {
    return ANIMEFLIX_DATA.titles.find(t => t.id === id) || null;
  }
  function findEpisode(title, epId) {
    for (const s of title.seasons) {
      const e = s.episodes.find(x => x.id === epId);
      if (e) return e;
    }
    return null;
  }

  // ---------- overlay (interstitial) ----------
  let interstitialTimer = null;
  function showInterstitial(seconds, onSkip) {
    let left = seconds;
    clearInterval(interstitialTimer);
    $overlayRoot.innerHTML = `
      <div class="modalBack">
        <div class="modal">
          <div class="modalHead">
            <div style="font-weight:900">Hirdetés</div>
            <div class="p">10 mp után átugorható (Premiumban nincs).</div>
          </div>
          <div class="modalBody">
            <div class="adBox">
              Interstitial kreatív helye<br/>
              <span style="font-size:12px;opacity:.75">Itt köthetsz be ad hálózatot.</span>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:12px">
              <div class="small" id="skipTxt">Átugorható: ${left}s</div>
              <button class="btn primary" id="skipBtn" disabled>Hirdetés átugrása</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const skipBtn = document.getElementById("skipBtn");
    const skipTxt = document.getElementById("skipTxt");

    interstitialTimer = setInterval(() => {
      left -= 1;
      if (skipTxt) skipTxt.textContent = left <= 0 ? "Most átugorható" : ("Átugorható: " + left + "s");
      if (skipBtn) skipBtn.disabled = left > 0;
      if (left <= 0) {
        // keep timer running a bit? no: stop at 0
        clearInterval(interstitialTimer);
        interstitialTimer = null;
      }
    }, 1000);

    skipBtn.addEventListener("click", () => {
      if (left > 0) return;
      hideOverlay();
      onSkip();
    });
  }
  function hideOverlay() { $overlayRoot.innerHTML = ""; }

  // ---------- pages ----------
  function pageLogin() {
    const html = `
      <div style="min-height:calc(100vh - 56px);display:flex;align-items:center;justify-content:center;padding-top:30px;padding-bottom:30px">
        <div class="card" style="width:min(520px,100%);padding:18px">
          <div style="font-size:20px;font-weight:950">AnimeFlix</div>
          <div class="p">Bejelentkezés (lokális demo)</div>

          <div style="margin-top:18px">
            <div class="small">Email</div>
            <input id="email" class="input" placeholder="pelda@email.hu" />
          </div>

          <div style="margin-top:12px">
            <div class="small">Jelszó</div>
            <input id="pw" class="input" type="password" placeholder="••••••••" />
          </div>

          <div style="margin-top:14px">
            <button class="btn primary" style="width:100%" id="loginBtn">Belépés</button>
          </div>

          <div class="small" style="margin-top:10px;opacity:.8">Demo: nem küld semmit szerverre.</div>
        </div>
      </div>
    `;
    htm($app, pageWrap(html));
    document.getElementById("loginBtn").onclick = () => {
      const email = document.getElementById("email").value;
      setAuth(email || "demo@animeflix.local");
      nav("/profiles");
    };
  }

  function pageProfiles() {
    if (!requireAuth()) return;
    const profiles = getProfiles();
    const emoji = ["🦊","🐺","🧸","😺","🦉","🐼","🐸","🦁","🐙"];

    const html = `
      <div class="h1">Profil kiválasztása</div>
      <div class="p">Netflix-szerű több profil egy fiókban.</div>

      <div class="grid cols2 cols3" style="margin-top:16px">
        ${profiles.map(p => `
          <button class="card" style="padding:16px;text-align:left;cursor:pointer" data-pid="${esc(p.id)}">
            <div style="font-size:34px">${esc(p.avatar)}</div>
            <div style="margin-top:10px;font-weight:900">${esc(p.name)}</div>
            <div class="small" style="margin-top:4px">Korhatár: ${esc(p.maturity)}</div>
          </button>
        `).join("")}
      </div>

      <div class="card" style="margin-top:16px;padding:16px">
        <div style="font-weight:900">Új profil hozzáadása</div>

        <div style="display:grid;gap:10px;margin-top:10px">
          <input id="newName" class="input" placeholder="Profil név" />
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${emoji.map(e => `<button class="btn" data-emo="${esc(e)}">${esc(e)}</button>`).join("")}
          </div>
          <button class="btn primary" id="addBtn">Hozzáadás</button>
        </div>
      </div>
    `;
    htm($app, pageWrap(html));

    document.querySelectorAll("button[data-pid]").forEach(btn => {
      btn.addEventListener("click", () => {
        setActiveProfileId(btn.getAttribute("data-pid"));
        nav("/browse");
      });
    });

    let selected = "😺";
    document.querySelectorAll("button[data-emo]").forEach(btn => {
      btn.addEventListener("click", () => {
        selected = btn.getAttribute("data-emo");
        document.querySelectorAll("button[data-emo]").forEach(b => b.classList.remove("primary"));
        btn.classList.add("primary");
      });
    });

    document.getElementById("addBtn").onclick = () => {
      const name = document.getElementById("newName").value || "Új profil";
      const id = "p" + Math.random().toString(16).slice(2,8);
      const next = profiles.concat([{ id, name, avatar: selected, maturity: "ADULT" }]);
      setProfiles(next);
      nav("/profiles"); // refresh
    };
  }

  function pageBrowse() {
    if (!requireProfile()) return;
    const titles = ANIMEFLIX_DATA.titles;
    const featured = titles.find(t => t.featured) || titles[0];

    const states = getWatchStates().slice().sort((a,b)=>b.updatedAt-a.updatedAt);
    const contIds = new Set(states.slice(0,10).map(s => s.titleId));
    const continueWatching = titles.filter(t => contIds.has(t.id));

    const listIds = new Set(getWatchlist());
    const myList = titles.filter(t => listIds.has(t.id));

    const hero = `
      <div class="hero">
        <div class="container heroInner">
          <div class="small" style="font-weight:900">Kiemelt</div>
          <h1 class="h1" style="margin-top:8px">${esc(featured.name)}</h1>
          <div class="p">${esc(featured.tagline)}</div>
          <div class="pills">
            <span class="pill">${esc(featured.year)}</span>
            <span class="pill">${esc(featured.studio)}</span>
            <span class="pill">${esc(featured.ageRating)}</span>
            ${featured.genres.slice(0,3).map(g => `<span class="pill">${esc(g)}</span>`).join("")}
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn primary" href="#/watch/${esc(featured.id)}/s1e1">Lejátszás</a>
            <a class="btn" href="#/title/${esc(featured.id)}">Infó</a>
          </div>
        </div>
      </div>
    `;

    let body = `
      ${adBanner()}
      ${continueWatching.length ? `
        <section style="margin-top:16px">
          <div class="h2">Folytatás</div>
          <div class="p">Ott, ahol abbahagytad.</div>
          <div style="margin-top:10px">${titleGrid(continueWatching)}</div>
        </section>
      ` : ""}

      ${myList.length ? `
        <section style="margin-top:16px">
          <div class="h2">Saját listám</div>
          <div class="p">Elmentett animék.</div>
          <div style="margin-top:10px">${titleGrid(myList)}</div>
        </section>
      ` : ""}

      <section style="margin-top:16px">
        <div class="h2">Katalógus</div>
        <div class="p">Teljes demo lista.</div>
        <div style="margin-top:10px">${titleGrid(titles)}</div>
      </section>

      <div class="small" style="margin-top:18px">Demo projekt. Valós licenc/DRM/CDN integráció későbbi fázis.</div>
    `;

    // hero is full-width. body in container.
    htm($app, hero + `<div class="container" style="padding-top:16px;padding-bottom:26px">${body}</div>`);
  }

  function pageSearch() {
    if (!requireProfile()) return;
    const titles = ANIMEFLIX_DATA.titles;
    const genres = Array.from(new Set(titles.flatMap(t => t.genres))).sort();
    const moods = Array.from(new Set(titles.flatMap(t => t.moods))).sort();

    const html = `
      <div class="h1">Keresés</div>
      <div class="p">Szűrők: műfaj + hangulat.</div>

      <div style="display:grid;gap:10px;margin-top:12px">
        <input id="q" class="input" placeholder="Cím, leírás, kulcsszó…" />
        <div style="display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))">
          <select id="genre" class="select">
            <option value="">Műfaj (összes)</option>
            ${genres.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join("")}
          </select>
          <select id="mood" class="select">
            <option value="">Hangulat (összes)</option>
            ${moods.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="small" style="margin-top:12px" id="count"></div>
      <div style="margin-top:10px" id="results"></div>
    `;
    htm($app, pageWrap(html));

    const $q = document.getElementById("q");
    const $g = document.getElementById("genre");
    const $m = document.getElementById("mood");
    const $count = document.getElementById("count");
    const $res = document.getElementById("results");

    function run() {
      const s = ($q.value || "").trim().toLowerCase();
      const genre = $g.value || "";
      const mood = $m.value || "";
      const results = titles.filter(t => {
        const hitText = !s || t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s);
        const hitGenre = !genre || t.genres.includes(genre);
        const hitMood = !mood || t.moods.includes(mood);
        return hitText && hitGenre && hitMood;
      });
      $count.textContent = "Találatok: " + results.length;
      htm($res, titleGrid(results));
    }

    $q.addEventListener("input", run);
    $g.addEventListener("change", run);
    $m.addEventListener("change", run);
    run();
  }

  function pageMyList() {
    if (!requireProfile()) return;
    const titles = ANIMEFLIX_DATA.titles;
    const ids = new Set(getWatchlist());
    const items = titles.filter(t => ids.has(t.id));

    const html = `
      <div class="h1">Saját listám</div>
      <div class="p">Elmentett animék.</div>
      <div style="margin-top:12px">
        ${items.length ? titleGrid(items) : `<div class="small">Még üres. Nyiss meg egy animét és add hozzá.</div>`}
      </div>
    `;
    htm($app, pageWrap(html));
  }

  function pageTitle(id) {
    if (!requireProfile()) return;
    const title = findTitle(id);
    if (!title) {
      htm($app, pageWrap(`<div class="h1">Nem található</div><div class="p">Hibás anime ID.</div>`));
      return;
    }
    const inList = new Set(getWatchlist()).has(title.id);
    const first = title.seasons && title.seasons[0] && title.seasons[0].episodes && title.seasons[0].episodes[0];

    const hero = `
      <div class="hero">
        <div class="container heroInner">
          <h1 class="h1">${esc(title.name)}</h1>
          <div class="p">${esc(title.tagline)}</div>

          <div class="pills">
            <span class="pill">${esc(title.year)}</span>
            <span class="pill">${esc(title.studio)}</span>
            <span class="pill">${esc(title.ageRating)}</span>
            ${title.genres.map(g => `<span class="pill">${esc(g)}</span>`).join("")}
          </div>

          <div class="p" style="max-width:900px">${esc(title.description)}</div>

          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
            ${first ? `<a class="btn primary" href="#/watch/${esc(title.id)}/${esc(first.id)}">Lejátszás</a>` : ""}
            <button class="btn" id="toggleListBtn">${inList ? "Listában" : "Listához"}</button>
            <a class="btn" href="#/browse">Vissza</a>
          </div>
        </div>
      </div>
    `;

    const seasons = title.seasons.map(s => `
      <div class="card" style="padding:16px;margin-top:12px">
        <div style="font-weight:900">Évad ${esc(s.season)}</div>
        <div style="display:grid;gap:10px;margin-top:10px">
          ${s.episodes.map(e => `
            <div class="card" style="padding:14px;box-shadow:none">
              <div style="font-weight:900">${esc(e.title)}</div>
              <div class="small" style="margin-top:4px">${esc(e.durationMin)} perc • ${esc(e.synopsis)}</div>
              <div style="margin-top:10px">
                <a class="btn primary" href="#/watch/${esc(title.id)}/${esc(e.id)}">Rész indítása</a>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");

    htm($app, hero + `<div class="container" style="padding-top:16px;padding-bottom:26px">${seasons}</div>`);

    document.getElementById("toggleListBtn").onclick = () => {
      toggleWatchlist(title.id);
      nav("/title/" + title.id);
    };
  }

  // watch page mock
  let playTimer = null;
  const MOCK_DURATION_SEC = 24 * 60;

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2,"0") + ":" + String(sec).padStart(2,"0");
  }

  function pageWatch(titleId, episodeId) {
    if (!requireProfile()) return;

    const title = findTitle(titleId);
    if (!title) { htm($app, pageWrap(`<div class="h1">Nem található</div><div class="p">Hibás anime ID.</div>`)); return; }
    const ep = findEpisode(title, episodeId);
    if (!ep) { htm($app, pageWrap(`<div class="h1">Nem található</div><div class="p">Hibás rész ID.</div>`)); return; }

    clearInterval(playTimer); playTimer = null;

    let progress = 0;
    let playing = false;

    // Free: interstitial ALWAYS before playing page becomes usable
    if (!getPremium()) {
      showInterstitial(10, () => {
        render(); // re-render after skip (no overlay)
      });
      // NOTE: we still render underlying page now; overlay blocks.
    } else {
      hideOverlay();
    }

    const html = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div class="h2">${esc(title.name)}</div>
          <div class="p">${esc(ep.title)}</div>
        </div>
        ${getPremium() ? "" : `<a class="btn" href="#/account">Váltás Premiumra</a>`}
      </div>

      <div class="card" style="margin-top:12px;overflow:hidden">
        <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,.12)">
          <div style="font-weight:900">Lejátszó (demo)</div>
          <div class="small" style="margin-top:6px">Placeholder. Ide jön majd a HLS/DASH + DRM.</div>
        </div>

        <div style="padding:16px">
          <div class="adBox" style="margin-bottom:12px">
            Videó helye (demo)<br/>
            <span style="font-size:12px;opacity:.75">Progress mentés működik.</span>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn primary" id="playBtn">Lejátszás</button>
            <button class="btn" id="pauseBtn" disabled>Szünet</button>
            <button class="btn" id="restartBtn">Újra</button>
          </div>

          <div class="small" style="margin-top:10px" id="progTxt">Progress: ${fmt(progress)} / ${fmt(MOCK_DURATION_SEC)}</div>

          <div class="p" style="margin-top:10px">${esc(ep.synopsis)}</div>

          <div style="margin-top:14px">
            <a class="btn" href="#/title/${esc(title.id)}">Vissza az adatlapra</a>
          </div>
        </div>
      </div>
    `;
    htm($app, pageWrap(html));

    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const restartBtn = document.getElementById("restartBtn");
    const progTxt = document.getElementById("progTxt");

    function tick() {
      progress = Math.min(MOCK_DURATION_SEC, progress + 1);
      progTxt.textContent = "Progress: " + fmt(progress) + " / " + fmt(MOCK_DURATION_SEC);
      upsertWatchState({
        titleId: titleId,
        episodeId: episodeId,
        progressSec: progress,
        durationSec: MOCK_DURATION_SEC,
        updatedAt: Date.now()
      });
      if (progress >= MOCK_DURATION_SEC) stop();
    }
    function start() {
      if (playing) return;
      playing = true;
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      playTimer = setInterval(tick, 1000);
    }
    function stop() {
      playing = false;
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      clearInterval(playTimer);
      playTimer = null;
    }
    function restart() {
      progress = 0;
      progTxt.textContent = "Progress: " + fmt(progress) + " / " + fmt(MOCK_DURATION_SEC);
      upsertWatchState({
        titleId: titleId,
        episodeId: episodeId,
        progressSec: progress,
        durationSec: MOCK_DURATION_SEC,
        updatedAt: Date.now()
      });
    }

    playBtn.onclick = start;
    pauseBtn.onclick = stop;
    restartBtn.onclick = restart;
  }

  function pageAccount() {
    if (!requireProfile()) return;
    const premium = getPremium();

    const html = `
      <div class="h1">Fiók</div>
      <div class="p">Free (hirdetéses) vs Premium (reklámmentes).</div>

      <div class="grid" style="margin-top:12px">
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Állapot: ${premium ? "Premium" : "Free"}</div>
          <div class="p" style="margin-top:6px">Premiumban eltűnik a banner és az epizód előtti 10 mp-es felugró.</div>

          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn primary" id="togglePremiumBtn">
              ${premium ? "Premium kikapcsolása" : "Váltás Premiumra (demo)"}
            </button>
          </div>

          <div class="small" style="margin-top:10px">Éles rendszerben itt Stripe / IAP + entitlement ellenőrzés lenne.</div>
        </div>
      </div>
    `;
    htm($app, pageWrap(html));

    document.getElementById("togglePremiumBtn").onclick = () => {
      setPremium(!getPremium());
      hideOverlay(); // if any
      render();
    };
  }

  // ---------- router ----------
  function render() {
    setNavActive();

    const { path } = route();

    // hide nav-ish actions on login page
    const isLogin = path === "/login";
    document.querySelector("header.nav").style.display = isLogin ? "none" : "block";

    // bootstrap
    if (path === "/" || path === "") {
      const auth = getAuth();
      if (!auth) { nav("/login"); return; }
      if (!getActiveProfileId()) { nav("/profiles"); return; }
      nav("/browse"); return;
    }

    // routes
    if (path === "/login") return pageLogin();
    if (path === "/profiles") return pageProfiles();
    if (path === "/browse") return pageBrowse();
    if (path === "/search") return pageSearch();
    if (path === "/my-list") return pageMyList();
    if (path === "/account") return pageAccount();

    const mTitle = path.match(/^\/title\/([^/]+)$/);
    if (mTitle) return pageTitle(decodeURIComponent(mTitle[1]));

    const mWatch = path.match(/^\/watch\/([^/]+)\/([^/]+)$/);
    if (mWatch) return pageWatch(decodeURIComponent(mWatch[1]), decodeURIComponent(mWatch[2]));

    // fallback
    nav("/"); 
  }

  // ---------- navbar buttons ----------
  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearInterval(playTimer); playTimer = null;
    hideOverlay();
    clearAuth();
    nav("/login");
  });

  // ---------- init ----------
  window.addEventListener("hashchange", () => {
    // When leaving watch page, stop timers and overlays
    clearInterval(playTimer); playTimer = null;
    hideOverlay();
    render();
  });

  if (!location.hash) location.hash = "#/";
  render();
})();
