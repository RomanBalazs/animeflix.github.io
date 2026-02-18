/* global window, document */
(function () {
  const $app = document.getElementById("app");
  const $overlay = document.getElementById("overlayRoot");

  const DATA = (window.ANIMEFLIX_DATA && typeof window.ANIMEFLIX_DATA === "object")
    ? window.ANIMEFLIX_DATA
    : { legalContent: {} };

  const HU_DB = (window.ANIMEFLIX_HU_DB && typeof window.ANIMEFLIX_HU_DB === "object")
    ? window.ANIMEFLIX_HU_DB
    : { ids: {}, titles: {} };

  const ANILIST_ENDPOINT = "https://graphql.anilist.co";

  // Reklám: csak lejátszás előtt (watch route), 90 perc cooldown / profil
  const AD_SKIP_SECONDS = 10;
  const AD_COOLDOWN_MS = 90 * 60 * 1000;

  const K = {
    auth: "af:auth",
    profiles: "af:profiles",
    activeProfile: "af:activeProfile",
    premium: "af:premium",
    watchlist: "af:watchlist",
    cache: "af:cache:v2",
    lastAdAtPrefix: "af:lastAdAt:"
  };

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

  const normalizeTitle = (t) =>
    String(t ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9áéíóöőúüű\s\-']/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const GENRE_HU = {
    "Action":"Akció","Adventure":"Kaland","Comedy":"Vígjáték","Drama":"Dráma","Fantasy":"Fantasy",
    "Horror":"Horror","Mystery":"Rejtély","Psychological":"Pszichológiai","Romance":"Romantika",
    "Sci-Fi":"Sci-Fi","Slice of Life":"Életkép","Sports":"Sport","Supernatural":"Természetfeletti",
    "Thriller":"Thriller","Ecchi":"Ecchi","Mecha":"Mecha","Music":"Zene",
    "Mahou Shoujo":"Mágikus lány","Shounen":"Shounen","Shoujo":"Shoujo","Seinen":"Seinen","Josei":"Josei"
  };
  const genreHu = (g) => GENRE_HU[g] || g;

  const STATUS_HU = {
    FINISHED: "Befejezett",
    RELEASING: "Fut",
    NOT_YET_RELEASED: "Még nem indult",
    CANCELLED: "Törölve",
    HIATUS: "Szünetel"
  };
  const statusHu = (s) => STATUS_HU[s] || (s || "—");

  const FORMAT_HU = {
    TV: "TV",
    TV_SHORT: "TV (rövid)",
    MOVIE: "Film",
    OVA: "OVA",
    ONA: "ONA",
    SPECIAL: "Special",
    MUSIC: "Music"
  };
  const formatHu = (f) => FORMAT_HU[f] || (f || "—");

  const SEASON_HU = { WINTER: "Tél", SPRING: "Tavasz", SUMMER: "Nyár", FALL: "Ősz" };
  const seasonHu = (s) => SEASON_HU[s] || (s || "—");

  const mediaTitle = (m) => m?.title?.english || m?.title?.romaji || m?.title?.native || ("AniList #" + m?.id);
  const mediaPoster = (m) => m?.coverImage?.extraLarge || m?.coverImage?.large || "";
  const formatDate = (d) => {
    if (!d || !d.year) return "—";
    const mm = String(d.month || 1).padStart(2, "0");
    const dd = String(d.day || 1).padStart(2, "0");
    return `${d.year}-${mm}-${dd}`;
  };

  function getHungarianDescription(media) {
    const id = String(media?.id ?? "");
    if (id && HU_DB?.ids && HU_DB.ids[id]) {
      return { text: HU_DB.ids[id], source: "id", key: id };
    }
    const candidates = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
    for (const c of candidates) {
      const key = normalizeTitle(c);
      if (HU_DB?.titles && HU_DB.titles[key]) return { text: HU_DB.titles[key], source: "title", key };
    }
    return { text: "", source: "none", key: "" };
  }

  function autoHuFromMeta(media) {
    const title = mediaTitle(media);
    const year = media?.startDate?.year || media?.seasonYear || "";
    const st = statusHu(media?.status);
    const fmt = formatHu(media?.format);
    const eps = media?.episodes ? String(media.episodes) : (media?.status === "RELEASING" ? "?" : "—");
    const score = media?.averageScore ? String(media.averageScore) + "/100" : "—";
    const genres = (media?.genres || []).slice(0, 4).map(genreHu).join(", ");

    const parts = [];
    parts.push(`„${title}” ${genres ? " (" + genres + ")" : ""} ${year ? "– " + year : ""}.`);
    parts.push(`Formátum: ${fmt}. Epizódok: ${eps}. Státusz: ${st}.`);
    parts.push(`AniList pontszám: ${score}.`);
    parts.push(`Részletes magyar leírás ehhez a címhez még nincs a HU adatbázisban.`);
    return parts.join(" ");
  }

  const pageWrap = (content) => `<div class="container" style="padding:18px 16px 26px">${content}</div>`;
  const nav = (to) => (location.hash = "#" + to);
  const route = () => {
    const raw = (location.hash || "#/").slice(1);
    const [path] = raw.split("?");
    return { path: path || "/" };
  };

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

  const getWatchlist = () => {
    const raw = localStorage.getItem(K.watchlist);
    return raw ? JSON.parse(raw) : [];
  };
  const toggleWatchlist = (key) => {
    const set = new Set(getWatchlist());
    if (set.has(key)) set.delete(key); else set.add(key);
    localStorage.setItem(K.watchlist, JSON.stringify([...set]));
  };

  const cacheGet = (key) => {
    const raw = localStorage.getItem(K.cache);
    const c = raw ? JSON.parse(raw) : {};
    const e = c[key];
    if (!e) return null;
    // 6 óra
    if (Date.now() - e.t > 6 * 60 * 60 * 1000) return null;
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
        media(type: ANIME, sort: TRENDING_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          format status episodes
          startDate { year month day }
          seasonYear averageScore genres
          description(asHtml:false)
        }
      }
    }
  `;

  const Q_POPULAR = `
    query ($page:Int,$perPage:Int) {
      Page(page:$page, perPage:$perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          format status episodes
          startDate { year month day }
          seasonYear averageScore genres
          description(asHtml:false)
        }
      }
    }
  `;

  const Q_TOP_RATED = `
    query ($page:Int,$perPage:Int) {
      Page(page:$page, perPage:$perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          format status episodes season seasonYear
          startDate { year month day }
          averageScore genres
        }
      }
    }
  `;

  const Q_NEW = `
    query ($page:Int,$perPage:Int) {
      Page(page:$page, perPage:$perPage) {
        media(type: ANIME, sort: START_DATE_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          format status episodes season seasonYear
          startDate { year month day }
          averageScore genres
        }
      }
    }
  `;

  const Q_SEARCH = `
    query ($page:Int,$perPage:Int,$search:String,$genreIn:[String]) {
      Page(page:$page, perPage:$perPage) {
        pageInfo { currentPage lastPage }
        media(type: ANIME, search:$search, genre_in:$genreIn, sort: POPULARITY_DESC, isAdult:false) {
          id siteUrl
          title { romaji english native }
          coverImage { extraLarge large }
          format status episodes
          startDate { year month day }
          seasonYear averageScore genres
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
        format status episodes
        startDate { year month day }
        endDate { year month day }
        seasonYear averageScore genres
        description(asHtml:false)
        characters(page:1, perPage:12, sort:[ROLE, RELEVANCE]) {
          edges {
            role
            node { id name { full native } image { large } }
            voiceActors(language:JAPANESE, sort:[RELEVANCE]) { id name { full native } image { large } }
          }
        }
      }
    }
  `;

  const Q_GENRES = `query { GenreCollection }`;

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
                <div class="small" style="margin-top:4px">${esc(m.meta || "")}</div>
              </div>
            </div>
          </a>
        `).join("")}
      </div>
    `;
  }

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
    if (!shouldShowAdNow()) return onContinue();
    showAd(onContinue);
  }

  function getLegal(anilistId) {
    const lc = DATA?.legalContent || {};
    return lc[String(anilistId)] || null;
  }
  function firstEpisodeKey(lc) {
    const s = (lc?.seasons || [])[0];
    const e = (s?.episodes || [])[0];
    return s && e ? `s${s.season}:${e.id}` : null;
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
    `);

    document.querySelectorAll("button[data-pid]").forEach(btn => {
      btn.addEventListener("click", () => {
        setActiveProfileId(btn.getAttribute("data-pid"));
        nav("/browse");
      });
    });
  }

  async function pageBrowse() {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    $app.innerHTML =
      `<div class="heroBanner"><div class="container heroInnerN">
        <div class="heroKicker">Most népszerű</div>
        <div class="heroTitle">Betöltés…</div>
        <div class="heroMeta">Katalógus: AniList • reklámmentes</div>
        <div class="heroDesc">Az epizódoknál jelenik meg hirdetés (90 percenként), Premiumban nincs.</div>
        <div class="heroActions">
          <button class="btn primary" disabled>Lejátszás</button>
          <button class="btn ghost" disabled>Részletek</button>
        </div>
      </div></div>
      <div class="container" style="padding:16px 16px 26px">
        <div class="card" style="padding:16px;margin-top:12px"><div style="font-weight:900">Betöltés…</div></div>
      </div>`;

    function rail(title, items) {
      return `
        <section class="rail">
          <div class="railHead">
            <h2 class="railTitle">${esc(title)}</h2>
            <span></span>
          </div>
          <div class="railList">
            ${items.map(m => `
              <a class="railCard" href="#/ani/${esc(m.id)}">
                <div class="railPoster" style="background-image:url('${esc(m.poster)}')"></div>
                <div class="railName">${esc(m.title)}</div>
              </a>
            `).join("")}
          </div>
        </section>
      `;
    }

    try {
      const [tr, pop, top, nw] = await Promise.all([
        anilistQuery(Q_TRENDING, { page: 1, perPage: 20 }),
        anilistQuery(Q_POPULAR, { page: 1, perPage: 20 }),
        anilistQuery(Q_TOP_RATED, { page: 1, perPage: 20 }),
        anilistQuery(Q_NEW, { page: 1, perPage: 20 })
      ]);

      const map = (arr) => (arr || []).map(x => ({
        id: String(x.id),
        title: mediaTitle(x),
        poster: mediaPoster(x),
        meta: [
          (x.startDate?.year || x.seasonYear || ""),
          (x.season ? seasonHu(x.season) : ""),
          (x.episodes ? `${x.episodes} ep` : (x.status === "RELEASING" ? "? ep" : "")),
          statusHu(x.status)
        ].filter(Boolean).join(" • "),
        genres: (x.genres || []).slice(0, 3).map(genreHu).join(", "),
        raw: x
      }));

      const trending = map(tr?.data?.Page?.media);
      const popular  = map(pop?.data?.Page?.media);
      const topRated = map(top?.data?.Page?.media);
      const newest   = map(nw?.data?.Page?.media);

      const featured = trending[0] || popular[0] || topRated[0] || newest[0];

      const legal = featured ? getLegal(featured.id) : null;
      const playableKey = featured ? firstEpisodeKey(legal) : null;

      const featuredDesc =
        featured
          ? (() => {
              const hu = getHungarianDescription(featured.raw);
              const descHu = hu.text || autoHuFromMeta(featured.raw);
              const t = String(descHu || "").trim();
              return t.length > 260 ? (t.slice(0, 260).trim() + "…") : t;
            })()
          : "";

      const heroBg = featured?.poster ? `style="background-image:url('${esc(featured.poster)}')"` : "";

      $app.innerHTML =
        `<div class="heroBanner" ${heroBg}>
          <div class="container heroInnerN">
            <div class="heroKicker">Most népszerű</div>
            <h1 class="heroTitle">${esc(featured?.title || "AnimeFlix")}</h1>
            <div class="heroMeta">${esc(featured?.meta || "Katalógus: AniList • reklámmentes")}${featured?.genres ? ` • ${esc(featured.genres)}` : ""}</div>
            <div class="heroDesc">${esc(featuredDesc || "Kattints a részletekre, vagy indíts epizódot jogtiszta forrásból.")}</div>
            <div class="heroActions">
              ${
                playableKey
                ? `<a class="btn primary" href="#/watch/ani/${esc(featured.id)}/${esc(playableKey)}">Lejátszás</a>`
                : `<a class="btn primary" href="#/ani/${esc(featured?.id || "")}">Részletek</a>`
              }
              <a class="btn ghost" href="#/ani/${esc(featured?.id || "")}">További infó</a>
              <a class="btn" href="#/year/2025">2025</a>
              <a class="btn" href="#/discover">Keresés</a>
            </div>
          </div>
        </div>` +
        `<div class="container" style="padding:16px 16px 26px">
          ${rail("Trending most", trending)}
          ${rail("Népszerű az AnimeFlixen", popular)}
          ${rail("Legjobbra értékelt", topRated)}
          ${rail("Új megjelenések", newest)}
        </div>`;
    } catch (e) {
      $app.innerHTML = pageWrap(`
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Nem sikerült betölteni</div>
          <div class="small" style="margin-top:8px">${esc(e.message || e)}</div>
        </div>
      `);
    }
  }

  async function pageDiscover(prefillGenre) {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    $app.innerHTML = pageWrap(`
      <div class="h1">Keresés</div>
      <div class="p">A katalógus reklámmentes. Reklám csak lejátszás előtt.</div>

      <div class="card" style="padding:16px;margin-top:12px">
        <div class="row">
          <input id="q" class="input" style="flex:1;min-width:220px" placeholder="Pl.: Naruto, Bleach, Frieren…" />
          <select id="genre" class="select" style="flex:1;min-width:220px">
            <option value="">Műfaj: bármely</option>
          </select>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn primary" id="go">Keresés</button>
          <button class="btn" id="clr">Törlés</button>
        </div>
        <div class="small" style="margin-top:10px" id="meta"></div>
      </div>

      <div style="margin-top:12px" id="results"></div>
      <div style="margin-top:12px" id="pager"></div>
    `);

    const $q = document.getElementById("q");
    const $g = document.getElementById("genre");
    const $meta = document.getElementById("meta");
    const $results = document.getElementById("results");
    const $pager = document.getElementById("pager");

    try {
      const gj = await anilistQuery(Q_GENRES, {});
      const gl = (gj?.data?.GenreCollection || []).slice().sort();
      for (const name of gl) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = genreHu(name);
        $g.appendChild(opt);
      }
      if (prefillGenre) $g.value = prefillGenre;
    } catch (_) {}

    let state = { page: 1, perPage: 24, lastPage: 1 };

    async function run(page) {
      state.page = page;
      $meta.textContent = "Betöltés…";
      $results.innerHTML = `<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`;
      $pager.innerHTML = "";

      try {
        const search = ($q.value || "").trim() || null;
        const genreIn = $g.value ? [$g.value] : null;

        const js = await anilistQuery(Q_SEARCH, { page: state.page, perPage: state.perPage, search, genreIn });
        const info = js?.data?.Page?.pageInfo;
        const items = (js?.data?.Page?.media || []).map(m => ({
          id: String(m.id),
          title: mediaTitle(m),
          poster: mediaPoster(m),
          meta: [
            (m.startDate?.year || m.seasonYear || ""),
            (m.episodes ? `${m.episodes} ep` : (m.status === "RELEASING" ? "? ep" : "")),
            statusHu(m.status)
          ].filter(Boolean).join(" • ")
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
    document.getElementById("clr").onclick = () => { $q.value = ""; $g.value = prefillGenre || ""; run(1); };
    run(1);
  }

  async function pageGenres() {
    if (!requireProfile()) return;
    document.querySelector("header.nav").style.display = "block";

    $app.innerHTML = pageWrap(`
      <div class="h1">Műfajok</div>
      <div class="p">Kattints egy műfajra, és átvisz a kereséshez előszűrve.</div>
      <div class="card" style="padding:16px;margin-top:12px">
        <div class="small" id="gMeta">Betöltés…</div>
        <div class="chips" id="gChips" style="margin-top:12px"></div>
      </div>
    `);

    try {
      const gj = await anilistQuery(Q_GENRES, {});
      const gl = (gj?.data?.GenreCollection || []).slice().sort();
      document.getElementById("gMeta").textContent = `Műfajok: ${gl.length}`;
      const wrap = document.getElementById("gChips");
      wrap.innerHTML = gl.map(g => `<button class="chip" data-g="${esc(g)}">${esc(genreHu(g))}</button>`).join("");
      wrap.querySelectorAll("button[data-g]").forEach(b=>{
        b.addEventListener("click", ()=>{
          nav("/discover?g=" + encodeURIComponent(b.getAttribute("data-g")));
        });
      });
    } catch (e) {
      document.getElementById("gMeta").textContent = "Nem sikerült betölteni.";
    }
  }

  function buildEpisodesHtml(anilistId) {
    const legal = getLegal(anilistId);
    if (!legal || !(legal.seasons || []).length) {
      return `<div class="p">Ehhez a címhez nincs csatolt jogtiszta forrás. (data.js → legalContent)</div>`;
    }
    return `
      ${(legal.seasons || []).map(s => `
        <div style="margin-top:10px">
          <div style="font-weight:900">Évad ${esc(s.season)}</div>
          <div class="chips" style="margin-top:8px">
            ${(s.episodes || []).map(ep => `
              <a class="chip" href="#/watch/ani/${esc(anilistId)}/s${esc(s.season)}:${esc(ep.id)}" style="text-decoration:none">
                ${esc(ep.title || ep.id)}
              </a>
            `).join("")}
          </div>
        </div>
      `).join("")}
    `;
  }
  function renderCast(media) {
    const edges = media?.characters?.edges || [];
    if (!edges.length) return `<div class="p">Nincs elérhető szereplőlista.</div>`;

    const rows = edges.slice(0, 24).map(ed => {
      const ch = ed?.node;
      const va = (ed?.voiceActors || [])[0];

      const chName = ch?.name?.full || ch?.name?.native || "—";
      const chImg = ch?.image?.large || "";

      const role = String(ed?.role || "");
      const roleHu = role === "MAIN" ? "Főszereplő" : (role === "SUPPORTING" ? "Mellékszereplő" : (role ? role : "—"));

      const vaName = va?.name?.full || va?.name?.native || "—";
      const vaImg = va?.image?.large || "";

      return `
        <div class="castRow">
          <div class="castCell">
            ${chImg ? `<img class="castImg" src="${esc(chImg)}" alt="${esc(chName)}" loading="lazy" />` : `<div class="castImg"></div>`}
            <div class="castInfo">
              <div class="castName">${esc(chName)}</div>
              <div class="castMeta"><span class="pill">${esc(roleHu)}</span></div>
            </div>
          </div>
          <div class="castCell rightCell">
            ${vaImg ? `<img class="castImg" src="${esc(vaImg)}" alt="${esc(vaName)}" loading="lazy" />` : `<div class="castImg"></div>`}
            <div class="castInfo">
              <div class="castName">${esc(vaName)}</div>
              <div class="castMeta"><span class="pill">Japanese</span></div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `<div class="castWrap"><div class="castTable">${rows}</div></div>`;
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

      const year = m?.startDate?.year || m?.seasonYear || "—";
      const st = statusHu(m?.status);
      const fmt = formatHu(m?.format);
      const eps = m?.episodes ? String(m.episodes) : (m?.status === "RELEASING" ? "?" : "—");
      const start = formatDate(m?.startDate);
      const end = (m?.endDate && m.endDate.year) ? formatDate(m.endDate) : "—";
      const score = m?.averageScore ? (m.averageScore + "/100") : "—";
      const genres = (m?.genres || []).slice(0, 10);

      // HU leírás: DB -> ha nincs, auto meta HU
      const hu = getHungarianDescription(m);
      const descHu = hu.text || autoHuFromMeta(m);

      // EN forrás leírás: rejtve (opcionális)
      const descEn = stripHtml(m?.description || "");

      const inList = new Set(getWatchlist()).has("ani:" + anilistId);

      const legal = getLegal(anilistId);
      const playableKey = firstEpisodeKey(legal);

      $app.innerHTML =
        `<div class="hero"><div class="container heroInner">
          <div class="small" style="font-weight:900">AniList adatlap (meta) + HU leírás</div>
          <h1 class="h1" style="margin-top:8px">${esc(title)}</h1>
          <div class="p">${esc(year)} • ${esc(st)} • ${esc(fmt)} • Epizód: ${esc(eps)} • Score: ${esc(score)}</div>
          <div class="chips" style="margin-top:10px">
            ${genres.slice(0,6).map(g=>`<span class="chip" style="cursor:default">${esc(genreHu(g))}</span>`).join("")}
          </div>

          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
            ${
              playableKey
              ? `<a class="btn primary" href="#/watch/ani/${esc(anilistId)}/${esc(playableKey)}">Lejátszás</a>`
              : `<button class="btn primary" disabled>Lejátszás (nincs jogtiszta forrás)</button>`
            }
            <button class="btn" id="wl">${inList ? "Listában" : "Listához"}</button>
            ${m.siteUrl ? `<a class="btn" target="_blank" rel="noreferrer" href="${esc(m.siteUrl)}">AniList</a>` : ""}
            <a class="btn" href="#/discover">Vissza</a>
          </div>

          <div class="small" style="margin-top:12px;opacity:.9">
            Katalógus: reklámmentes • Epizód reklám: ${getPremium() ? "nincs (Premium)" : "van (90 perc)"} • Kezdés: ${esc(start)} • Befejezés: ${esc(end)}
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
              <div style="font-weight:900">Leírás (HU)</div>
              <div class="p" style="margin-top:10px;white-space:pre-wrap">${esc(descHu)}</div>

              <details style="margin-top:12px">
                <summary class="small" style="cursor:pointer;opacity:.9">Forrás leírás (EN) megnyitása</summary>
                <div class="p" style="margin-top:10px;white-space:pre-wrap">${esc(descEn || "—")}</div>
              </details>
            </div>

            <div class="card" style="padding:16px">
              <div style="font-weight:900">Szereplők + szinkronhangok (JP)</div>
              ${renderCast(m)}
            </div>

            <div class="card" style="padding:16px">
              <div style="font-weight:900">Epizódok (jogtiszta forrás)</div>
              ${buildEpisodesHtml(anilistId)}
              ${legal ? `<div class="small" style="margin-top:10px;opacity:.85">${esc(legal.noteHu || "")}</div>` : ""}
            </div>
          </div>
        </div>`;

      document.getElementById("wl").onclick = () => { toggleWatchlist("ani:" + anilistId); nav("/ani/" + anilistId); };
    } catch (e) {
      $app.innerHTML = pageWrap(`
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Nem sikerült betölteni</div>
          <div class="small" style="margin-top:8px">${esc(e.message || e)}</div>
        </div>
      `);
    }
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

    function parseEpisodeKey(key) {
      const s = String(key || "");
      const m = s.match(/^s(\d+):(.+)$/i);
      if (!m) return null;
      return { season: Number(m[1]), epId: m[2] };
    }

    function findEpisode(lc, key) {
      const p = parseEpisodeKey(key);
      if (!p) return null;
      const seasonObj = (lc?.seasons || []).find(x => Number(x.season) === p.season) || (lc?.seasons || [])[0];
      if (!seasonObj) return null;
      const epObj = (seasonObj?.episodes || []).find(e => String(e.id) === String(p.epId));
      if (!epObj) return null;
      return { seasonObj, epObj };
    }

    function youtubeEmbedUrl(url) {
      const s = String(url || "").trim();
      try {
        const u = new URL(s);
        if (u.hostname.includes("youtu.be")) {
          const id = u.pathname.replace("/", "");
          return id ? `https://www.youtube.com/embed/${id}` : s;
        }
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
        if (u.pathname.includes("/embed/")) return s;
        return s;
      } catch {
        return s;
      }
    }

    function videaTokenFromUrl(u) {
      const s = String(u || "");
      try {
        const url = new URL(s);
        const v = url.searchParams.get("v");
        if (v) return v;
        const last = url.pathname.split("/").filter(Boolean).pop() || "";
        const parts = last.split("-");
        return parts[parts.length - 1] || "";
      } catch {
        const parts = s.split("-");
        return parts[parts.length - 1] || "";
      }
    }

    function renderPlayer(ep) {
      const type = String(ep?.type || "").toLowerCase();
      const src = String(ep?.src || "").trim();
      if (!src) return `<div class="p">Hiányzó forrás.</div>`;

      if (type === "youtube") {
        const embed = youtubeEmbedUrl(src);
        return `
          <div class="playerFrame"><iframe src="${esc(embed)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
          <div class="small" style="margin-top:10px"><a href="${esc(src)}" target="_blank" rel="noopener">Megnyitás új lapon</a></div>
        `;
      }

      if (type === "videa") {
        const token = videaTokenFromUrl(src);
        const embed = token ? `https://videa.hu/player?v=${encodeURIComponent(token)}` : src;
        return `
          <div class="playerFrame"><iframe src="${esc(embed)}" allow="autoplay" allowfullscreen></iframe></div>
          <div class="small" style="margin-top:10px">Ha üres: valószínűleg tiltott beágyazás. <a href="${esc(src)}" target="_blank" rel="noopener">Megnyitás új lapon</a></div>
        `;
      }

      if (type === "mp4" || type === "video") {
        return `
          <div class="playerFrame"><video controls playsinline src="${esc(src)}"></video></div>
          <div class="small" style="margin-top:10px"><a href="${esc(src)}" target="_blank" rel="noopener">Megnyitás új lapon</a></div>
        `;
      }

      // iframe / default
      return `
        <div class="playerFrame"><iframe src="${esc(src)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
        <div class="small" style="margin-top:10px"><a href="${esc(src)}" target="_blank" rel="noopener">Megnyitás új lapon</a></div>
      `;
    }

    const found = findEpisode(legal, epKey);

    const doRender = () => {
      const epTitle = found?.epObj?.title || found?.epObj?.id || "—";
      $app.innerHTML = pageWrap(`
        <div class="card" style="padding:16px">
          <div style="font-weight:900">Lejátszó</div>
          <div class="small" style="margin-top:8px">Epizód: <span class="kbd">${esc(epTitle)}</span> • kulcs: <span class="kbd">${esc(epKey)}</span></div>

          ${legal?.noteHu ? `<div class="small" style="margin-top:8px;opacity:.9">${esc(legal.noteHu)}</div>` : ""}

          <div style="margin-top:12px">
            ${found ? renderPlayer(found.epObj) : `<div class="p">Nem található epizód ehhez a kulcshoz. Ellenőrizd a data.js-ben.</div>`}
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
            <a class="btn" href="#/ani/${esc(anilistId)}">Vissza</a>
            ${getPremium() ? "" : `<a class="btn" href="#/account">Premium</a>`}
          </div>
        </div>
      `);
    };

    gateEpisodePlayback(doRender);
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
      <div class="p">A katalógus mindenkinek reklámmentes. Reklám csak epizód indításkor (90 perc).</div>

      <div class="card" style="padding:16px;margin-top:12px">
        <div style="font-weight:900">Csomag: ${getPremium() ? "Premium" : "Free"}</div>
        <div class="p" style="margin-top:6px">
          Epizód reklám: ${getPremium() ? "kikapcsolva" : "bekapcsolva"}.
          ${getPremium() ? "" : (leftMs > 0 ? ` Következő reklám kb. ${leftMin} perc múlva.` : " A következő epizódnál felugorhat.")}
        </div>

        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn primary" id="togglePremium">${getPremium() ? "Premium kikapcsolása" : "Váltás Premiumra (demo)"}</button>
          <button class="btn" id="resetAd">Reklám cooldown reset (teszt)</button>
        </div>
      </div>
    `);

    document.getElementById("togglePremium").onclick = () => { setPremium(!getPremium()); hideOverlay(); render(); };
    document.getElementById("resetAd").onclick = () => { setLastAdAt(0); render(); };
  }

  function render() {
    setNavActive();
    hideOverlay();

    const { path } = route();

    // query param a /discover-hez (műfaj)
    if (path.startsWith("/discover") && location.hash.includes("?g=")) {
      const g = decodeURIComponent((location.hash.split("?g=")[1] || "").split("&")[0] || "");
      return pageDiscover(g || "");
    }

    if (path === "/" || path === "") {
      const auth = getAuth();
      if (!auth) { nav("/login"); return; }
      if (!getActiveProfileId()) { nav("/profiles"); return; }
      nav("/browse"); return;
    }

    if (path === "/login") return pageLogin();
    if (path === "/profiles") return pageProfiles();
    if (path === "/browse") return pageBrowse();
    if (path === "/discover") return pageDiscover("");
    if (path === "/genres") return pageGenres();
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
  if (!location.hash) location.hash = "#/";
  render();
})();
