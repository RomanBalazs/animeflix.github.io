/* global window, document, ANIMEFLIX_DATA */
(function () {
  const $app = document.getElementById("app");
  const $overlay = document.getElementById("overlayRoot");

  // AniList GraphQL
  const ANILIST_ENDPOINT = "https://graphql.anilist.co";

  // ====== REKLÁM LOGIKA (kérésed szerint) ======
  // - katalógus: NINCS reklám
  // - epizód indításkor: popup reklám
  // - popup után 90 percig nem jön újabb
  const AD_SKIP_SECONDS = 10;
  const AD_COOLDOWN_MS = 90 * 60 * 1000;

  // LocalStorage kulcsok
  const K = {
    auth: "af:auth",
    profiles: "af:profiles",
    activeProfile: "af:activeProfile",
    premium: "af:premium",
    watchlist: "af:watchlist",
    cache: "af:cache",
    lastAdAtPrefix: "af:lastAdAt:" // + profileId
  };

  // ---------- utils ----------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const stripHtml = (html) =>
    String(html ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

  const pageWrap = (content) => `<div class="container" style="padding:18px 16px 26px">${content}</div>`;

  const nav = (to) => (location.hash = "#" + to);

  const route = () => {
    const raw = (location.hash || "#/").slice(1);
    const [path] = raw.split("?");
    return { path: path || "/" };
  };

  // ---------- auth / profile (demo) ----------
  const getAuth = () => {
    const raw = localStorage.getItem(K.auth);
    return raw ? JSON.parse(raw) : null;
  };
  const setAuth = (email) => localStorage.setItem(K.auth, JSON.stringify({ email: email || "demo@local", t: Date.now() }));
  const clearAuth = () => {
    localStorage.removeItem(K.auth);
    localStorage.removeItem(K.activeProfile);
  };

  const getPremium = () => localStorage.getItem(K.premium) === "1";
  const setPremium = (v) => localStorage.setItem(K.premium, v ? "1" : "0");

  const getProfiles = () => {
    const raw = localStorage.getItem(K.profiles);
    if (raw) return JSON.parse(raw);
    const defaults = [
      { id: "p1", name: "Balázs", avatar: "🦊" },
      { id: "p2", name: "Vendég", avatar: "🐺" }
    ];
    localStorage.setItem(K.profiles, JSON.stringify(defaults));
    return defaults;
  };

  const getActiveProfileId = () => localStorage.getItem(K.activeProfile);
  const setActiveProfileId = (id) => localStorage.setItem(K.activeProfile, id);

  const requireAuth = () => {
    if (!getAuth()) { nav("/login"); return false; }
    return true;
  };
  const requireProfile = () => {
    if (!requireAuth()) return false;
    if (!getActiveProfileId()) { nav("/profiles"); return false; }
    return true;
  };

  // ---------- watchlist ----------
  const getWatchlist = () => {
    const raw = localStorage.getItem(K.watchlist);
    return raw ? JSON.parse(raw) : [];
  };
  const toggleWatchlist = (key) => {
    const set = new Set(getWatchlist());
    if (set.has(key)) set.delete(key); else set.add(key);
    localStorage.setItem(K.watchlist, JSON.stringify([...set]));
  };

  // ---------- AniList cache ----------
  const cacheGet = (key) => {
    const raw = localStorage.getItem(K.cache);
    const c = raw ? JSON.parse(raw) : {};
    const e = c[key];
    if (!e) return null;
    if (Date.now() - e.t > 6 * 60 * 60 * 1000) return null; // 6h TTL
    return e.v;
  };
  const cacheSet = (key, v) => {
    const raw = localStorage.getItem(K.cache);
    const c = raw ? JSON.parse(raw) : {};
    c[key] = { t: Date.now(), v };
    localStorage.setItem(K.cache, JSON.stringify(c));
  };

  const hashKey = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function anilistQuery(query, variables) {
    const payload = JSON.stringify({ query, variables: variables || {} });
    const key = "anilist:" + hashKey(payload);
    const cached = cacheGet(key);
    if (cached) return cached;

    let attempt = 0, wait = 650;
    while (attempt < 4) {
      attempt++;
      const res = await fetch(ANILIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: payload
      });

      if (res.ok) {
        const js = await res.json();
        cacheSet(key, js);
        return js;
      }
      if (res.status === 429) {
        const ra = Number(res.headers.get("Retry-After") || "60");
        await sleep(Math.max(1000, ra * 1000));
        continue;
      }
      if (res.status >= 500) { await sleep(wait); wait *= 2; continue; }
      throw new Error("AniList HTTP " + res.status);
    }
    throw new Error("AniList: túl sok kérés / hálózati hiba.");
  }

  const Q_TRENDING = `
    query ($page:Int,$perPage:Int) {
      Page(page:$page, perPage:$perPage) {
        pageInfo { currentPage lastPage }
        media(type: ANIME, sort: TRENDING_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          seasonYear format episodes averageScore genres
          description(asHtml:false)
        }
      }
    }
  `;
  const Q_POPULAR = `
    query ($page:Int,$perPage:Int) {
      Page(page:$page, perPage:$perPage) {
        pageInfo { currentPage lastPage }
        media(type: ANIME, sort: POPULARITY_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          seasonYear format episodes averageScore genres
          description(asHtml:false)
        }
      }
    }
  `;
  const Q_SEARCH = `
    query ($page:Int,$perPage:Int,$search:String) {
      Page(page:$page, perPage:$perPage) {
        pageInfo { currentPage lastPage }
        media(type: ANIME, search:$search, sort: POPULARITY_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          seasonYear format episodes averageScore genres
          description(asHtml:false)
        }
      }
    }
  `;
  const Q_BY_ID = `
    query ($id:Int) {
      Media(id:$id, type:ANIME) {
        id siteUrl
        title { romaji english native }
        coverImage { extraLarge large }
        seasonYear format episodes averageScore genres
        description(asHtml:false)
      }
    }
  `;

  const mediaTitle = (m) => m?.title?.english || m?.title?.romaji || m?.title?.native || ("AniList #" + m?.id);
  const mediaPoster = (m) => m?.coverImage?.extraLarge || m?.coverImage?.large || "";

  const tilePosterStyle = (url) => url ? `style="background-image:url('${esc(url)}')"` : "";

  function grid(items) {
    return `
      <div class="grid cols2 cols3 cols5">
        ${items.map(m => `
          <a href="#/ani/${esc(m.id)}" style="text-decoration:none">
            <div class="tile">
              <div class="tilePoster" ${tilePosterStyle(m.poster)}></div>
              <div class="tileInfo">
                <div style="font-weight:900">${esc(m.title)}</div>
                <div class="small" style="margin-top:4px">${esc(m.year || "")}</div>
              </div>
            </div>
          </a>
        `).join("")}
      </div>
    `;
  }

  // ====== REKLÁM: per profil cooldown ======
  function getLastAdAt() {
    const pid = getActiveProfileId() || "anon";
    const raw = localStorage.getItem(K.lastAdAtPrefix + pid);
    const v = Number(raw || "0");
    return Number.isFinite(v) ? v : 0;
  }
  function setLastAdAt(ts) {
    const pid = getActiveProfileId() || "anon";
    localStorage.setItem(K.lastAdAtPrefix + pid, String(ts || Date.now()));
  }
  function shouldShowAdNow() {
    if (getPremium()) return false;
    const last = getLastAdAt();
    return !last || (Date.now() - last) >= AD_COOLDOWN_MS;
  }

  let adTimer = null;
  function hideOverlay() { $overlay.innerHTML = ""; }

  function showAd(onContinue) {
    let left = AD_SKIP_SECONDS;
    clearInterval(adTimer);

    $overlay.innerHTML = `
      <div class="modalBack">
        <div class="modal">
          <div class="modalHead">
            <div style="font-weight:900">Hirdetés</div>
            <div class="p">Epizód indítása előtt. Utána 90 percig nem jelenik meg újra.</div>
          </div>
          <div class="modalBody">
            <div class="adBox">
              Popup hirdetés helye<br/>
              <span style="font-size:12px;opacity:.75">Itt köthetsz be ad hálózatot.</span>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:12px">
              <div class="small" id="adTxt">Átugorható: ${left}s</div>
              <button class="btn primary" id="adBtn" disabled>Folytatás</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const $txt = document.getElementById("adTxt");
    const $btn = document.getElementById("adBtn");

    adTimer = setInterval(() => {
      left--;
      if ($txt) $txt.textContent = left <= 0 ? "Most folytatható" : `Átugorható: ${left}s`;
      if ($btn) $btn.disabled = left > 0;
      if (left <= 0) { clearInterval(adTimer); adTimer = null; }
    }, 1000);

    $btn.addEventListener("click", () => {
      if (left > 0) return;
      hideOverlay();
      setLastAdAt(Date.now());
      onContinue();
    });
  }

  function gateEpisodePlayback(onContinue) {
    // KATALÓGUS NINCS reklám -> csak lejátszó route hívja ezt
    if (!shouldShowAdNow()) return onContinue();
    showAd(onContinue);
  }

  // ---------- legal content helpers ----------
  function getLegal(anilistId) {
    const lc = ANIMEFLIX_DATA?.legalContent || {};
    return lc[String(anilistId)] || null;
  }
  function firstEpisodeKey(lc) {
    const s = (lc?.seasons || [])[0];
    const e = (s?.episodes || [])[0];
    return s && e ? `s${s.season}:${e.id}` : null;
  }
  function youTubeIdFromUrl(url) {
    const u = String(url || "");
    const m1 = u.match(/[?&]v=([^&]+)/); if (m1) return m1[1];
    const m2 = u.match(/youtu\.be\/([^?&]+)/); if (m2) return m2[1];
    const m3 = u.match(/youtube\.com\/embed\/([^?&]+)/); if (m3) return m3[1];
    return "";
  }

  // ---------- UI: nav state ----------
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

  // ---------- pages ----------
  function pageLogin() {
    document.querySelector("header.nav").style.display = "none";
    $app.innerHTML = pageWrap(`
      <div style="min-height:calc(100vh - 56px);display:flex;align-items:center;justify-content:center;padding:30px 0">
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

          <div class="small" style="margin-top:10px;opacity:.8">Demo: nincs backend, csak localStorage.</div>
        </div>
      </div>
    `);

    document.getElementById("loginBtn").onclick = () => {
      setAuth(document.getElementById("email").value || "demo@local");
      nav("/profiles");
    };
  }

  function pageProfiles() {
    if (!requireAuth()) return;
    document.querySelector("header.nav").style.display = "block";
    const profiles = getProfiles();

    $app.innerHTML = pageWrap(`
      <div class="h1">Profil kiválasztása</div>
      <div class="p">Több profil egy fiókban.</div>

      <div class="grid cols2 cols3" style="margin-top:16px">
        ${profiles.map(p => `
          <button class="card" style="padding:16px;text-align:left;cursor:pointer" data-pid="${esc(p.id)}">
            <div style="font-size:34px">${esc(p.avatar)}</div>
            <div style="margin-top:10px;font-weight:900">${esc(p.name)}</div>
          </button>
        `).join("")}
      </div>

      <div class="card" style="margin-top:16px;padding:16px">
        <div style="font-weight:900">Új profil hozzáadása</div>
        <div class="row" style="margin-top:10px">
          <input id="newName" class="input" style="flex:1;min-width:220px" placeholder="Profil név" />
          <input id="newAvatar" class="input" style="width:120px" placeholder="😺" />
          <button class="btn primary" id="addBtn">Hozzáadás</button>
        </div>
      </div>
    `);

    document.querySelectorAll("button[data-pid]").forEach(btn => {
      btn.addEventListener("click", () => {
        setActiveProfileId(btn.getAttribute("data-pid"));
        nav("/browse");
      });
    });

    document.getElementById("addBtn").onclick = () => {
      const name = document.getElementById("newName").value || "Új profil";
      const avatar = document.getElementById("newAvatar").value || "😺";
      const id = "p" + Math.random().toString(16).slice(2,8);
      const next = profiles.concat([{ id, name, avatar }]);
      localStorage.setItem(K.profiles, JSON.stringify(next));
      nav("/profiles");
    };
  }

  async function pageBrowse() {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    $app.innerHTML =
      `<div class="hero"><div class="container heroInner">
        <div class="small" style="font-weight:900">Katalógus (AniList) – reklámmentes</div>
        <h1 class="h1" style="margin-top:8px">AnimeFlix</h1>
        <div class="p">Reklám csak epizód indításkor, 90 perc cooldown.</div>
        <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn primary" href="#/discover">Keresés</a>
          <a class="btn" href="#/my-list">Saját listám</a>
        </div>
      </div></div>` +
      pageWrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`);

    try {
      const [tr, pop] = await Promise.all([
        anilistQuery(Q_TRENDING, { page: 1, perPage: 20 }),
        anilistQuery(Q_POPULAR, { page: 1, perPage: 20 })
      ]);

      const trending = (tr?.data?.Page?.media || []).map(m => ({
        id: String(m.id), title: mediaTitle(m), poster: mediaPoster(m), year: m.seasonYear || ""
      }));
      const popular = (pop?.data?.Page?.media || []).map(m => ({
        id: String(m.id), title: mediaTitle(m), poster: mediaPoster(m), year: m.seasonYear || ""
      }));

      $app.innerHTML =
        `<div class="hero"><div class="container heroInner">
          <div class="small" style="font-weight:900">Katalógus (AniList) – reklámmentes</div>
          <h1 class="h1" style="margin-top:8px">AnimeFlix</h1>
          <div class="p">Reklám csak epizód indításkor, 90 perc cooldown.</div>
        </div></div>` +
        `<div class="container" style="padding:16px 16px 26px">
          <section style="margin-top:6px">
            <div class="h2">Trending</div>
            <div class="p">Böngészés reklám nélkül.</div>
            <div style="margin-top:10px">${grid(trending)}</div>
          </section>

          <section style="margin-top:16px">
            <div class="h2">Népszerű</div>
            <div class="p">Top popular címek.</div>
            <div style="margin-top:10px">${grid(popular)}</div>
          </section>
        </div>`;
    } catch (e) {
      $app.innerHTML = pageWrap(`
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Hiba a katalógus betöltésekor</div>
          <div class="p">Rate limit / hálózati gond lehetséges.</div>
          <div class="small" style="margin-top:8px">${esc(e.message || e)}</div>
        </div>
      `);
    }
  }

  async function pageDiscover() {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    $app.innerHTML = pageWrap(`
      <div class="h1">Keresés</div>
      <div class="p">Katalógus nézetben nincs reklám. Reklám csak a lejátszás előtt.</div>

      <div class="card" style="padding:16px;margin-top:12px">
        <div class="row">
          <input id="q" class="input" style="flex:1;min-width:220px" placeholder="Pl.: Naruto, Bleach, Frieren…" />
          <button class="btn primary" id="go">Keresés</button>
          <button class="btn" id="clr">Törlés</button>
        </div>
        <div class="small" style="margin-top:10px" id="meta"></div>
      </div>

      <div style="margin-top:12px" id="results"></div>
      <div style="margin-top:12px" id="pager"></div>
    `);

    const $q = document.getElementById("q");
    const $meta = document.getElementById("meta");
    const $results = document.getElementById("results");
    const $pager = document.getElementById("pager");

    let state = { page: 1, perPage: 24, lastPage: 1 };

    async function run(page) {
      state.page = page;
      $meta.textContent = "Betöltés…";
      $results.innerHTML = `<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`;
      $pager.innerHTML = "";

      try {
        const search = ($q.value || "").trim() || null;
        const js = await anilistQuery(Q_SEARCH, { page: state.page, perPage: state.perPage, search });
        const info = js?.data?.Page?.pageInfo;
        const items = (js?.data?.Page?.media || []).map(m => ({
          id: String(m.id), title: mediaTitle(m), poster: mediaPoster(m), year: m.seasonYear || ""
        }));

        state.lastPage = info?.lastPage || 1;
        $meta.textContent = `Találatok: ${items.length} • Oldal: ${state.page}/${state.lastPage}`;
        $results.innerHTML = items.length ? grid(items) : `<div class="small">Nincs találat.</div>`;

        $pager.innerHTML = `
          <div class="row" style="justify-content:space-between">
            <button class="btn" id="prev" ${state.page <= 1 ? "disabled":""}>Előző</button>
            <div class="small">Oldal: ${state.page}/${state.lastPage}</div>
            <button class="btn" id="next" ${state.page >= state.lastPage ? "disabled":""}>Következő</button>
          </div>
        `;
        document.getElementById("prev").onclick = () => run(Math.max(1, state.page - 1));
        document.getElementById("next").onclick = () => run(Math.min(state.lastPage, state.page + 1));
      } catch (e) {
        $meta.textContent = "Hiba: " + (e.message || e);
        $results.innerHTML = "";
      }
    }

    document.getElementById("go").onclick = () => run(1);
    document.getElementById("clr").onclick = () => { $q.value = ""; run(1); };
    run(1);
  }

  async function pageAniDetails(anilistId) {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    $app.innerHTML = pageWrap(`
      <div class="card" style="padding:16px">
        <div style="font-weight:900">Betöltés…</div>
        <div class="small" style="margin-top:6px">AniList #${esc(anilistId)}</div>
      </div>
    `);

    try {
      const js = await anilistQuery(Q_BY_ID, { id: Number(anilistId) });
      const m = js?.data?.Media;
      if (!m) throw new Error("Nincs adat.");

      const title = mediaTitle(m);
      const poster = mediaPoster(m);
      const year = m.seasonYear || "";
      const descEn = stripHtml(m.description || "");
      const inList = new Set(getWatchlist()).has("ani:" + anilistId);

      const legal = getLegal(anilistId);
      const playableKey = firstEpisodeKey(legal);

      $app.innerHTML =
        `<div class="hero"><div class="container heroInner">
          <div class="small" style="font-weight:900">AniList adatlap (reklámmentes)</div>
          <h1 class="h1" style="margin-top:8px">${esc(title)}</h1>
          <div class="p">${esc(year)} • Score: ${esc(m.averageScore ? (m.averageScore + "/100") : "—")}</div>

          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
            ${
              playableKey
              ? `<a class="btn primary" href="#/watch/ani/${esc(anilistId)}/${esc(playableKey)}">Lejátszás</a>`
              : `<button class="btn primary" disabled>Lejátszás (nincs jogtiszta forrás)</button>`
            }
            <button class="btn" id="wl">${inList ? "Listában" : "Listához"}</button>
            ${m.siteUrl ? `<a class="btn" target="_blank" rel="noreferrer" href="${esc(m.siteUrl)}">AniList</a>` : ""}
          </div>

          <div class="small" style="margin-top:12px;opacity:.9">
            Reklám: csak lejátszás előtt • Cooldown: 90 perc • Premium: ${getPremium() ? "igen" : "nem"}
          </div>
        </div></div>` +
        `<div class="container" style="padding:16px 16px 26px">
          <div class="grid cols2 cols3" style="align-items:start">
            <div class="card" style="padding:16px">
              <div style="font-weight:900">Borító</div>
              <div style="margin-top:10px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12)">
                <img src="${esc(poster)}" alt="${esc(title)}" style="width:100%;display:block" loading="lazy" />
              </div>
            </div>

            <div class="card" style="padding:16px">
              <div style="font-weight:900">Leírás (EN – forrás)</div>
              <div class="p" style="margin-top:10px;white-space:pre-wrap">${esc(descEn || "—")}</div>
              <div class="small" style="margin-top:10px">
                Magyar leírás: javasolt saját szöveg (jogtiszta). 
              </div>
            </div>

            <div class="card" style="padding:16px">
              <div style="font-weight:900">Lejátszás</div>
              <div class="p" style="margin-top:8px">
                ${legal ? esc(legal.noteHu || "Jogtiszta forrás csatolva.") : `Ehhez a címhez nincs forrás. Add hozzá a <span class="kbd">data.js</span> → <span class="kbd">legalContent</span> alatt.`}
              </div>
              ${
                legal ? `
                  <div style="margin-top:12px">
                    ${(legal.seasons || []).map(s => `
                      <div class="small" style="font-weight:900;margin-top:10px">Évad ${esc(s.season)}</div>
                      ${(s.episodes || []).map(ep => `
                        <a class="card" style="display:block;padding:12px;margin-top:8px" href="#/watch/ani/${esc(anilistId)}/s${esc(s.season)}:${esc(ep.id)}">
                          <div style="font-weight:900">${esc(ep.titleHu || ep.id)}</div>
                          <div class="small" style="margin-top:4px">${esc(ep.durationMin ? (ep.durationMin + " perc") : "")}</div>
                        </a>
                      `).join("")}
                    `).join("")}
                  </div>
                ` : ``
              }
            </div>
          </div>
        </div>`;

      document.getElementById("wl").onclick = () => { toggleWatchlist("ani:" + anilistId); nav("/ani/" + anilistId); };
    } catch (e) {
      $app.innerHTML = pageWrap(`
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Nem sikerült betölteni</div>
          <div class="p">Rate limit / hálózati/CORS gond lehetséges.</div>
          <div class="small" style="margin-top:8px">${esc(e.message || e)}</div>
        </div>
      `);
    }
  }

  function pageMyList() {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    const list = getWatchlist();
    $app.innerHTML = pageWrap(`
      <div class="h1">Saját listám</div>
      <div class="p">Lokálisan mentve.</div>

      <div class="card" style="padding:16px;margin-top:12px">
        <div class="small">Elemek: ${list.length}</div>
        <div class="small" style="margin-top:8px">
          <button class="btn" id="clear" style="padding:6px 10px">Lista ürítése</button>
        </div>
      </div>

      <div style="margin-top:12px">
        ${list.length ? list.map(key => {
          if (!key.startsWith("ani:")) return "";
          const id = key.split(":")[1];
          return `
            <a class="card" style="display:block;padding:14px;margin-top:10px" href="#/ani/${esc(id)}">
              <div style="font-weight:900">AniList #${esc(id)}</div>
              <div class="small" style="margin-top:4px">Megnyitás</div>
            </a>
          `;
        }).join("") : `<div class="small">Még üres. Adj hozzá animét az adatlapján.</div>`}
      </div>
    `);

    document.getElementById("clear").onclick = () => {
      localStorage.setItem(K.watchlist, JSON.stringify([]));
      nav("/my-list");
    };
  }

  function pageAccount() {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    const last = getLastAdAt();
    const leftMs = Math.max(0, AD_COOLDOWN_MS - (Date.now() - last));
    const leftMin = Math.ceil(leftMs / 60000);

    $app.innerHTML = pageWrap(`
      <div class="h1">Fiók</div>
      <div class="p">A katalógus reklámmentes. Reklám csak epizód indításakor van (90 perc cooldown).</div>

      <div class="grid" style="margin-top:12px">
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Csomag: ${getPremium() ? "Premium" : "Free"}</div>
          <div class="p" style="margin-top:6px">
            Epizód reklám: ${getPremium() ? "kikapcsolva" : "bekapcsolva"}.
            ${getPremium() ? "" : (leftMs > 0 ? ` Következő reklám kb. ${leftMin} perc múlva.` : " A következő epizódnál felugorhat.")}
          </div>

          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn primary" id="togglePremium">${getPremium() ? "Premium kikapcsolása" : "Váltás Premiumra (demo)"}</button>
            <button class="btn" id="resetAd">Reklám cooldown reset (teszt)</button>
          </div>

          <div class="small" style="margin-top:10px">Éles rendszerben: backend entitlement (ne csak localStorage).</div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-weight:900">Jogtisztaság</div>
          <div class="p" style="margin-top:6px">
            Csak jogtiszta videóforrásokat csatolj. A lejátszó a <span class="kbd">data.js</span> → <span class="kbd">legalContent</span> alapján működik.
          </div>
        </div>
      </div>
    `);

    document.getElementById("togglePremium").onclick = () => { setPremium(!getPremium()); hideOverlay(); render(); };
    document.getElementById("resetAd").onclick = () => { setLastAdAt(0); render(); };
  }

  function pageWatchAni(anilistId, epKey) {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    const legal = getLegal(anilistId);
    if (!legal) {
      $app.innerHTML = pageWrap(`
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Nincs csatolt jogtiszta forrás</div>
          <div class="p">Add hozzá a <span class="kbd">data.js</span> → <span class="kbd">legalContent</span> alatt.</div>
          <div style="margin-top:10px"><a class="btn" href="#/ani/${esc(anilistId)}">Vissza</a></div>
        </div>
      `);
      return;
    }

    const parts = String(epKey || "").split(":");
    const seasonNum = Number(String(parts[0] || "").replace(/^s/i, "")) || 1;
    const epId = parts[1] || "";

    const season = (legal.seasons || []).find(s => Number(s.season) === seasonNum) || (legal.seasons || [])[0];
    const ep = season ? (season.episodes || []).find(e => e.id === epId) : null;

    const label = `AniList #${anilistId} • Évad ${seasonNum} • ${ep ? (ep.titleHu || ep.id) : epId}`;

    const doRender = () => {
      const src = (ep && ep.sources && ep.sources[0]) ? ep.sources[0] : null;

      let videoBlock = `<div class="adBox">Nincs videóforrás ehhez az epizódhoz.</div>`;
      if (src) {
        if (src.type === "youtube") {
          const vid = youTubeIdFromUrl(src.url);
          videoBlock = vid
            ? `<div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12)">
                 <iframe title="YouTube" src="https://www.youtube-nocookie.com/embed/${esc(vid)}"
                   style="position:absolute;inset:0;width:100%;height:100%;border:0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowfullscreen></iframe>
               </div>`
            : `<div class="adBox">Hibás YouTube URL</div>`;
        } else if (src.type === "mp4") {
          videoBlock =
            `<video controls style="width:100%;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:#000">
               <source src="${esc(src.url)}" type="video/mp4" />
             </video>`;
        } else if (src.type === "hls") {
          videoBlock = `<div class="adBox">HLS: következő körben (hls.js). Most placeholder.</div>`;
        } else {
          videoBlock = `<div class="adBox">Ismeretlen forrás típus.</div>`;
        }
      }

      const last = getLastAdAt();
      const leftMs = Math.max(0, AD_COOLDOWN_MS - (Date.now() - last));
      const leftMin = Math.ceil(leftMs / 60000);

      $app.innerHTML = pageWrap(`
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <div class="h2">Lejátszó</div>
            <div class="small" style="margin-top:4px">${esc(label)}</div>
          </div>
          <div class="small" style="opacity:.9">
            Reklám státusz: ${getPremium() ? "Premium (nincs)" : (leftMs > 0 ? `cooldown ~${leftMin} perc` : "a következő epizódnál felugorhat")}
          </div>
        </div>

        <div class="card" style="margin-top:12px;overflow:hidden">
          <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,.12)">
            <div style="font-weight:900">Videó</div>
            <div class="small" style="margin-top:6px">Reklám csak epizód indításkor, 90 percenként.</div>
          </div>
          <div style="padding:16px">
            ${videoBlock}
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
              <a class="btn" href="#/ani/${esc(anilistId)}">Vissza</a>
              ${getPremium() ? "" : `<a class="btn" href="#/account">Premium</a>`}
            </div>
          </div>
        </div>
      `);
    };

    // Itt történik a reklámkapu — KIZÁRÓLAG lejátszás előtt
    gateEpisodePlayback(doRender);
  }

  // ---------- router ----------
  function render() {
    setNavActive();
    hideOverlay();

    const { path } = route();

    if (path === "/" || path === "") {
      const auth = getAuth();
      if (!auth) { nav("/login"); return; }
      if (!getActiveProfileId()) { nav("/profiles"); return; }
      nav("/browse"); return;
    }

    if (path === "/login") return pageLogin();
    if (path === "/profiles") return pageProfiles();
    if (path === "/browse") return pageBrowse();
    if (path === "/discover") return pageDiscover();
    if (path === "/my-list") return pageMyList();
    if (path === "/account") return pageAccount();

    const mAni = path.match(/^\/ani\/(\d+)$/);
    if (mAni) return pageAniDetails(mAni[1]);

    const mWatchAni = path.match(/^\/watch\/ani\/(\d+)\/(.+)$/);
    if (mWatchAni) return pageWatchAni(mWatchAni[1], decodeURIComponent(mWatchAni[2]));

    nav("/");
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    hideOverlay();
    clearAuth();
    nav("/login");
  });

  window.addEventListener("hashchange", render);

  // boot
  if (!location.hash) location.hash = "#/";
  render();
})();
