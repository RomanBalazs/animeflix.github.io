(function(){
  const A=document.getElementById('app');
  const O=document.getElementById('overlayRoot');
  const END='https://graphql.anilist.co';
  const SKIP=10;
  const COOLDOWN=90*60*1000;
  const DATA=(window.ANIMEFLIX_DATA&&typeof window.ANIMEFLIX_DATA==='object')?window.ANIMEFLIX_DATA:{legalContent:{}};
  const K={auth:'af:auth',profiles:'af:profiles',activeProfile:'af:activeProfile',premium:'af:premium',watchlist:'af:watchlist',cache:'af:cache:v1',lastAdAtPrefix:'af:lastAdAt:'};

  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const strip=h=>String(h??'').replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'\"');
  const wrap=html=>`<div class="container" style="padding:18px 16px 26px">${html}</div>`;
  const nav=t=>location.hash='#'+t;
  const route=()=>{const raw=(location.hash||'#/').slice(1);return{path:(raw.split('?')[0]||'/')}};

  const getAuth=()=>{const r=localStorage.getItem(K.auth);return r?JSON.parse(r):null};
  const setAuth=email=>localStorage.setItem(K.auth,JSON.stringify({email:email||'demo@local',t:Date.now()}));
  const clearAuth=()=>{localStorage.removeItem(K.auth);localStorage.removeItem(K.activeProfile)};

  const prem=()=>localStorage.getItem(K.premium)==='1';
  const setPrem=v=>localStorage.setItem(K.premium,v?'1':'0');

  const profiles=()=>{const r=localStorage.getItem(K.profiles);if(r)return JSON.parse(r);
    const d=[{id:'p1',name:'Balázs',avatar:'🦊'},{id:'p2',name:'Vendég',avatar:'🐺'}];
    localStorage.setItem(K.profiles,JSON.stringify(d));
    return d;
  };
  const pid=()=>localStorage.getItem(K.activeProfile);
  const setPid=id=>localStorage.setItem(K.activeProfile,id);

  const needAuth=()=>{if(!getAuth()){nav('/login');return false}return true};
  const needProf=()=>{if(!needAuth())return false; if(!pid()){nav('/profiles');return false}return true};

  const wl=()=>{const r=localStorage.getItem(K.watchlist);return r?JSON.parse(r):[]};
  const wlToggle=k=>{const s=new Set(wl()); s.has(k)?s.delete(k):s.add(k); localStorage.setItem(K.watchlist,JSON.stringify([...s]));};

  const cGet=k=>{const r=localStorage.getItem(K.cache);const c=r?JSON.parse(r):{};const e=c[k];
    if(!e) return null; if(Date.now()-e.t>6*60*60*1000) return null; return e.v;};
  const cSet=(k,v)=>{const r=localStorage.getItem(K.cache);const c=r?JSON.parse(r):{};c[k]={t:Date.now(),v};localStorage.setItem(K.cache,JSON.stringify(c));};
  const hKey=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function gql(query,variables){
    const payload=JSON.stringify({query,variables:variables||{}});
    const key='anilist:'+hKey(payload);
    const cached=cGet(key);
    if(cached) return cached;
    let attempt=0,wait=650;
    while(attempt<4){
      attempt++;
      const res=await fetch(END,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:payload});
      if(res.ok){const js=await res.json();cSet(key,js);return js;}
      if(res.status===429){const ra=Number(res.headers.get('Retry-After')||'60');await sleep(Math.max(1000,ra*1000));continue;}
      if(res.status>=500){await sleep(wait);wait*=2;continue;}
      throw new Error('AniList HTTP '+res.status);
    }
    throw new Error('AniList: túl sok kérés / hálózati hiba.');
  }

  const Q_TR=`query($page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(type:ANIME,sort:TRENDING_DESC,isAdult:false){id siteUrl title{romaji english native} coverImage{extraLarge large} seasonYear averageScore genres description(asHtml:false)}}}`;
  const Q_PO=`query($page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){id siteUrl title{romaji english native} coverImage{extraLarge large} seasonYear averageScore genres description(asHtml:false)}}}`;
  const Q_SE=`query($page:Int,$perPage:Int,$search:String,$genreIn:[String]){Page(page:$page,perPage:$perPage){pageInfo{currentPage lastPage} media(type:ANIME,search:$search,genre_in:$genreIn,sort:POPULARITY_DESC,isAdult:false){id siteUrl title{romaji english native} coverImage{extraLarge large} seasonYear averageScore genres description(asHtml:false)}}}`;
  const Q_ID=`query($id:Int){Media(id:$id,type:ANIME){id siteUrl title{romaji english native} coverImage{extraLarge large} seasonYear averageScore genres description(asHtml:false)}}`;
  const Q_G=`query{GenreCollection}`;

  const GHU={Action:'Akció',Adventure:'Kaland',Comedy:'Vígjáték',Drama:'Dráma',Fantasy:'Fantasy',Horror:'Horror',Mystery:'Rejtély',Psychological:'Pszichológiai',Romance:'Romantika','Sci-Fi':'Sci-Fi','Slice of Life':'Életkép',Sports:'Sport',Supernatural:'Természetfeletti',Thriller:'Thriller',Ecchi:'Ecchi',Mecha:'Mecha',Music:'Zene','Mahou Shoujo':'Mágikus lány',Shounen:'Shounen',Shoujo:'Shoujo',Seinen:'Seinen',Josei:'Josei'};
  const gHu=g=>GHU[g]||g;

  const title=m=>m?.title?.english||m?.title?.romaji||m?.title?.native||('AniList #'+m?.id);
  const poster=m=>m?.coverImage?.extraLarge||m?.coverImage?.large||'';
  const pStyle=u=>u?`style="background-image:url('${esc(u)}')"`:'';

  const grid=items=>`<div class="grid cols2 cols3 cols5">${items.map(m=>`<a href="#/ani/${esc(m.id)}" style="text-decoration:none"><div class="tile"><div class="tilePoster" ${pStyle(m.poster)}></div><div class="tileInfo"><div style="font-weight:900">${esc(m.title)}</div><div class="small" style="margin-top:4px">${esc(m.year||'')}</div></div></div></a>`).join('')}</div>`;

  const getLegal=id=>{const lc=DATA?.legalContent||{};return lc[String(id)]||null};
  const firstKey=lc=>{const s=(lc?.seasons||[])[0];const e=(s?.episodes||[])[0];return s&&e?`s${s.season}:${e.id}`:null};

  const lastAd=()=>{const p=pid()||'anon';const raw=localStorage.getItem(K.lastAdAtPrefix+p);const v=Number(raw||'0');return Number.isFinite(v)?v:0};
  const setLastAd=t=>{const p=pid()||'anon';localStorage.setItem(K.lastAdAtPrefix+p,String(t||Date.now()))};
  const shouldAd=()=>{if(prem())return false;const l=lastAd();return !l||(Date.now()-l)>=COOLDOWN};

  let adTimer=null;
  const hide=()=>{O.innerHTML=''};
  const showAd=cont=>{
    let left=SKIP;
    clearInterval(adTimer);
    O.innerHTML=`<div class="modalBack"><div class="modal"><div class="modalHead"><div style="font-weight:900">Hirdetés</div><div class="p">Epizód indítása előtt. Utána 90 percig nem jelenik meg újra.</div></div><div class="modalBody"><div class="adBox">Popup hirdetés helye</div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:12px"><div class="small" id="adTxt">Átugorható: ${left}s</div><button class="btn primary" id="adBtn" disabled>Folytatás</button></div></div></div></div>`;
    const T=document.getElementById('adTxt');
    const B=document.getElementById('adBtn');
    adTimer=setInterval(()=>{
      left--;
      if(T)T.textContent=left<=0?'Most folytatható':`Átugorható: ${left}s`;
      if(B)B.disabled=left>0;
      if(left<=0){clearInterval(adTimer);adTimer=null;}
    },1000);
    B.addEventListener('click',()=>{if(left>0)return;hide();setLastAd(Date.now());cont();});
  };
  const gate=cont=>{if(!shouldAd())return cont();showAd(cont)};

  function navActive(){
    const {path}=route();
    document.querySelectorAll('.navLink[data-route]').forEach(a=>{
      const p=a.getAttribute('data-route');
      p && path.startsWith(p) ? a.classList.add('active') : a.classList.remove('active');
    });
    const plan=document.getElementById('planBtn');
    if(plan){plan.textContent=prem()?'Premium':'Free';plan.classList.toggle('primary',prem());}
    const pb=document.getElementById('profileBtn');
    if(pb) pb.textContent=pid()?'Profil':'Válassz profilt';
    const lo=document.getElementById('logoutBtn');
    if(lo) lo.style.display=getAuth()?'inline-flex':'none';
  }

  function pageLogin(){
    document.querySelector('header.nav').style.display='none';
    A.innerHTML=wrap(`<div style="min-height:calc(100vh - 56px);display:flex;align-items:center;justify-content:center;padding:30px 0"><div class="card" style="width:min(520px,100%);padding:18px"><div style="font-size:20px;font-weight:950">AnimeFlix</div><div class="p">Bejelentkezés (lokális demo)</div><div style="margin-top:18px"><div class="small">Email</div><input id="email" class="input" placeholder="pelda@email.hu" /></div><div style="margin-top:14px"><button class="btn primary" style="width:100%" id="loginBtn">Belépés</button></div></div></div>`);
    document.getElementById('loginBtn').onclick=()=>{setAuth(document.getElementById('email').value||'demo@local');nav('/profiles')};
  }

  function pageProfiles(){
    if(!needAuth())return;
    document.querySelector('header.nav').style.display='block';
    const ps=profiles();
    A.innerHTML=wrap(`<div class="h1">Profil kiválasztása</div><div class="grid cols2 cols3" style="margin-top:16px">${ps.map(p=>`<button class="card" style="padding:16px;text-align:left;cursor:pointer" data-pid="${esc(p.id)}"><div style="font-size:34px">${esc(p.avatar)}</div><div style="margin-top:10px;font-weight:900">${esc(p.name)}</div></button>`).join('')}</div>`);
    document.querySelectorAll('button[data-pid]').forEach(b=>b.addEventListener('click',()=>{setPid(b.getAttribute('data-pid'));nav('/browse')}));
  }

  async function pageBrowse(){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    A.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`);
    try{
      const [tr,pop]=await Promise.all([gql(Q_TR,{page:1,perPage:20}),gql(Q_PO,{page:1,perPage:20})]);
      const T=(tr?.data?.Page?.media||[]).map(m=>({id:String(m.id),title:title(m),poster:poster(m),year:m.seasonYear||''}));
      const P=(pop?.data?.Page?.media||[]).map(m=>({id:String(m.id),title:title(m),poster:poster(m),year:m.seasonYear||''}));
      A.innerHTML=`<div class="hero"><div class="container heroInner"><div class="small" style="font-weight:900">Katalógus (AniList) – reklámmentes</div><h1 class="h1" style="margin-top:8px">AnimeFlix</h1><div class="p">Reklám csak epizód indításkor, 90 perc cooldown.</div></div></div><div class="container" style="padding:16px 16px 26px"><section><div class="h2">Trending</div><div style="margin-top:10px">${grid(T)}</div></section><section style="margin-top:16px"><div class="h2">Népszerű</div><div style="margin-top:10px">${grid(P)}</div></section></div>`;
    }catch(e){
      A.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Nem sikerült betölteni</div><div class="p">Rate limit / hálózati/CORS gond lehetséges.</div><div class="small" style="margin-top:8px">${esc(e.message||e)}</div></div>`);
    }
  }

  async function pageDiscover(){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    A.innerHTML=wrap(`<div class="h1">Keresés</div><div class="card" style="padding:16px;margin-top:12px"><div class="row"><input id="q" class="input" style="flex:1;min-width:220px" placeholder="Pl.: Naruto, Bleach, Frieren…" /><select id="genre" class="select" style="flex:1;min-width:220px"><option value="">Műfaj: bármely</option></select></div><div class="row" style="margin-top:10px"><button class="btn primary" id="go">Keresés</button><button class="btn" id="clr">Törlés</button></div><div class="small" style="margin-top:10px" id="meta"></div></div><div style="margin-top:12px" id="results"></div><div style="margin-top:12px" id="pager"></div>`);
    const Q=document.getElementById('q');
    const G=document.getElementById('genre');
    const M=document.getElementById('meta');
    const R=document.getElementById('results');
    const P=document.getElementById('pager');

    try{const gj=await gql(Q_G,{});(gj?.data?.GenreCollection||[]).slice().sort().forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=gHu(n);G.appendChild(o)})}catch(_){ }

    let st={page:1,perPage:24,lastPage:1};
    async function run(page){
      st.page=page;
      M.textContent='Betöltés…';
      R.innerHTML=`<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`;
      P.innerHTML='';
      try{
        const s=(Q.value||'').trim()||null;
        const gi=G.value?[G.value]:null;
        const js=await gql(Q_SE,{page:st.page,perPage:st.perPage,search:s,genreIn:gi});
        const info=js?.data?.Page?.pageInfo;
        const items=(js?.data?.Page?.media||[]).map(m=>({id:String(m.id),title:title(m),poster:poster(m),year:m.seasonYear||''}));
        st.lastPage=info?.lastPage||1;
        M.textContent=`Találatok: ${items.length} • Oldal: ${st.page}/${st.lastPage}`;
        R.innerHTML=items.length?grid(items):`<div class="small">Nincs találat.</div>`;
        P.innerHTML=`<div class="row" style="justify-content:space-between"><button class="btn" id="prev" ${st.page<=1?'disabled':''}>Előző</button><div class="small">Oldal: ${st.page}/${st.lastPage}</div><button class="btn" id="next" ${st.page>=st.lastPage?'disabled':''}>Következő</button></div>`;
        document.getElementById('prev').onclick=()=>run(Math.max(1,st.page-1));
        document.getElementById('next').onclick=()=>run(Math.min(st.lastPage,st.page+1));
      }catch(e){
        M.textContent='Hiba: '+(e.message||e);
        R.innerHTML='';
      }
    }

    document.getElementById('go').onclick=()=>run(1);
    document.getElementById('clr').onclick=()=>{Q.value='';G.value='';run(1)};
    run(1);
  }

  async function pageGenres(){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    A.innerHTML=wrap(`<div class="h1">Műfajok</div><div class="card" style="padding:16px;margin-top:12px"><div id="chips" class="chips"></div></div><div style="margin-top:12px" id="results"></div>`);
    const C=document.getElementById('chips');
    const R=document.getElementById('results');
    let genres=[];
    try{const gj=await gql(Q_G,{});genres=(gj?.data?.GenreCollection||[]).slice().sort()}catch(e){R.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Nem sikerült betölteni</div><div class="small">${esc(e.message||e)}</div></div>`);return;}

    C.innerHTML=genres.map((g,i)=>`<button class="chip ${i===0?'active':''}" data-g="${esc(g)}">${esc(gHu(g))}</button>`).join('');

    async function load(g){
      R.innerHTML=`<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`;
      try{const js=await gql(Q_SE,{page:1,perPage:24,search:null,genreIn:[g]});
        const items=(js?.data?.Page?.media||[]).map(m=>({id:String(m.id),title:title(m),poster:poster(m),year:m.seasonYear||''}));
        R.innerHTML=`<div class="h2">${esc(gHu(g))}</div><div style="margin-top:10px">${grid(items)}</div>`;
      }catch(e){R.innerHTML=`<div class="card" style="padding:16px"><div style="font-weight:900">Hiba</div><div class="small">${esc(e.message||e)}</div></div>`;}
    }

    document.querySelectorAll('button[data-g]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('button[data-g]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      load(b.getAttribute('data-g'));
    }));

    if(genres[0]) load(genres[0]);
  }

  async function pageAni(id){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    A.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Betöltés…</div></div>`);
    try{
      const js=await gql(Q_ID,{id:Number(id)});
      const m=js?.data?.Media;
      if(!m) throw new Error('Nincs adat.');
      const t=title(m);
      const p=poster(m);
      const d=strip(m.description||'');
      const inList=new Set(wl()).has('ani:'+id);
      const legal=getLegal(id);
      const key=firstKey(legal);

      A.innerHTML=`<div class="hero"><div class="container heroInner"><div class="small" style="font-weight:900">AniList adatlap</div><h1 class="h1" style="margin-top:8px">${esc(t)}</h1><div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">${key?`<a class="btn primary" href="#/watch/ani/${esc(id)}/${esc(key)}">Lejátszás</a>`:`<button class="btn primary" disabled>Lejátszás (nincs jogtiszta forrás)</button>`}<button class="btn" id="wl">${inList?'Listában':'Listához'}</button><a class="btn" href="#/discover">Vissza</a></div></div></div><div class="container" style="padding:16px 16px 26px"><div class="grid cols2 cols3" style="align-items:start"><div class="card" style="padding:16px"><div style="font-weight:900">Borító</div><div style="margin-top:10px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12)"><img src="${esc(p)}" alt="${esc(t)}" style="width:100%;display:block" loading="lazy" /></div></div><div class="card" style="padding:16px"><div style="font-weight:900">Leírás (EN – forrás)</div><div class="p" style="margin-top:10px;white-space:pre-wrap">${esc(d||'—')}</div></div></div></div>`;
      document.getElementById('wl').onclick=()=>{wlToggle('ani:'+id);nav('/ani/'+id)};
    }catch(e){
      A.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Nem sikerült betölteni</div><div class="small" style="margin-top:8px">${esc(e.message||e)}</div></div>`);
    }
  }

  function pageWatch(id,ep){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    const legal=getLegal(id);
    if(!legal){A.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Nincs csatolt jogtiszta forrás</div><div class="p">Add hozzá a data.js-ben.</div></div>`);return;}
    gate(()=>{A.innerHTML=wrap(`<div class="card" style="padding:16px"><div style="font-weight:900">Lejátszó (demo)</div><div class="p">Itt lesz a jogtiszta videóforrás.</div><div class="small" style="margin-top:8px">Epizód: ${esc(ep)}</div><div style="margin-top:12px"><a class="btn" href="#/ani/${esc(id)}">Vissza</a></div></div>`);});
  }

  function pageList(){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    const list=wl();
    A.innerHTML=wrap(`<div class="h1">Saját listám</div><div class="card" style="padding:16px;margin-top:12px"><div class="small">Elemek: ${list.length}</div><button class="btn" id="clear" style="margin-top:10px">Lista ürítése</button></div><div style="margin-top:12px">${list.length?list.map(k=>{if(!k.startsWith('ani:'))return'';const id=k.split(':')[1];return`<a class="card" style="display:block;padding:14px;margin-top:10px" href="#/ani/${esc(id)}"><div style="font-weight:900">AniList #${esc(id)}</div><div class="small" style="margin-top:4px">Megnyitás</div></a>`}).join(''):`<div class="small">Még üres.</div>`}</div>`);
    document.getElementById('clear').onclick=()=>{localStorage.setItem(K.watchlist,JSON.stringify([]));nav('/my-list')};
  }

  function pageAccount(){
    if(!needProf())return;
    document.querySelector('header.nav').style.display='block';
    A.innerHTML=wrap(`<div class="h1">Fiók</div><div class="card" style="padding:16px;margin-top:12px"><div style="font-weight:900">Csomag: ${prem()?'Premium':'Free'}</div><div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" id="toggle">${prem()?'Premium kikapcsolása':'Váltás Premiumra (demo)'}</button><button class="btn" id="reset">Reklám cooldown reset</button></div></div>`);
    document.getElementById('toggle').onclick=()=>{setPrem(!prem());hide();render()};
    document.getElementById('reset').onclick=()=>{setLastAd(0);render()};
  }

  function render(){
    navActive();hide();
    const {path}=route();
    if(path==='/'||path===''){
      const a=getAuth();
      if(!a){nav('/login');return;}
      if(!pid()){nav('/profiles');return;}
      nav('/browse');return;
    }
    if(path==='/login') return pageLogin();
    if(path==='/profiles') return pageProfiles();
    if(path==='/browse') return pageBrowse();
    if(path==='/discover') return pageDiscover();
    if(path==='/genres') return pageGenres();
    if(path==='/my-list') return pageList();
    if(path==='/account') return pageAccount();
    const m1=path.match(/^\/ani\/(\d+)$/);
    if(m1) return pageAni(m1[1]);
    const m2=path.match(/^\/watch\/ani\/(\d+)\/(.+)$/);
    if(m2) return pageWatch(m2[1], decodeURIComponent(m2[2]));
    nav('/browse');
  }

  document.getElementById('logoutBtn').addEventListener('click',()=>{hide();clearAuth();nav('/login')});
  window.addEventListener('hashchange',render);
  if(!location.hash) location.hash='#/';
  render();
})();
