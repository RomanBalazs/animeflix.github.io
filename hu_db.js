/* global window */
/**
 * Magyar leírások – saját, eredeti szövegek (nem másolt fordítás).
 * Kulcsok:
 *  - ids: AniList ID alapján (ha van)
 *  - titles: normalizált cím alapján (kisbetű, írásjelek nélkül)
 */
(function(){
  window.ANIMEFLIX_HU_DB = window.ANIMEFLIX_HU_DB || { ids:{}, titles:{} };

  const T = {
    // --- Korábban kért / tipikus címek (HU, saját összefoglaló) ---
    "attack on titan": "Az emberiség falak mögé szorul, miközben titokzatos óriások fenyegetik a túlélést. Eren és társai katonának állnak, de a falakon túl sokkal sötétebb igazságok várnak rájuk.",
    "shingeki no kyojin": "Az emberiség falak mögé szorul, miközben titokzatos óriások fenyegetik a túlélést. Eren és társai katonának állnak, de a falakon túl sokkal sötétebb igazságok várnak rájuk.",
    "fullmetal alchemist brotherhood": "Edward és Alphonse tiltott alkímiával próbálja visszahozni édesanyját, és súlyos árat fizet érte. A Bölcsek Kövét keresve háborús titkok és összeesküvések hálójába keverednek.",
    "death note": "Egy zseniális diák halálos jegyzetfüzetre bukkan, amellyel bárkit megölhet a neve leírásával. Igazságot akar szolgáltatni, de a különc nyomozó, L azonnal a nyomába ered.",
    "one piece": "Luffy a legendás One Piece kincset keresi, hogy a kalózok királya legyen. Barátokat gyűjt, birodalmi titkokra lel, és epikus ellenfelekkel csap össze – rengeteg humorral.",
    "naruto": "Naruto, a kitaszított ninja arról álmodik, hogy Hokage lesz. Küldetéseken bizonyít, barátokat szerez, és lassan a falu sorsának kulcsszereplőjévé válik.",
    "naruto shippuden": "Naruto visszatér, hogy megmentse barátját és szembeszálljon egy világméretű összeesküvéssel. A tétek magasabbak, a múlt titkai is felszínre kerülnek.",
    "bleach": "Ichigo megkapja egy Halálisten erejét, és a lelkek védelmezőjeként harcol túlvilági szörnyek ellen. A Soul Society intrikái és háborúi is magukkal rántják.",
    "demon slayer": "Tanjiro családját démonok pusztítják el, húga pedig részben démonná válik. A fiú démonvadász lesz, hogy gyógyírt találjon és megvédje az embereket.",
    "kimetsu no yaiba": "Tanjiro családját démonok pusztítják el, húga pedig részben démonná válik. A fiú démonvadász lesz, hogy gyógyírt találjon és megvédje az embereket.",
    "jujutsu kaisen": "Yuji egy átokkal terhelt tárgy miatt a démoni átkok világába csöppen. Varázslóiskolában tanul harcolni, miközben egy ősi lény erejét is hordozza.",
    "my hero academia": "Egy szuperképességekkel teli világban Izuku képesség nélkül is hős akar lenni. Esélyt kap egy legendás erőre, és bejut a hősakadémiára.",
    "boku no hero academia": "Egy szuperképességekkel teli világban Izuku képesség nélkül is hős akar lenni. Esélyt kap egy legendás erőre, és bejut a hősakadémiára.",
    "spy x family": "Egy kém fedősztorihoz családot alapít, de a feleség bérgyilkos, a gyerek gondolatolvasó. A titkok közben valódi kötelékek alakulnak ki.",
    "chainsaw man": "Denji démonvadászból láncfűrészes hibriddé válik, és egy állami egységnél dolgozik. Egyre rémisztőbb démonokkal néz szembe, miközben az élete is szétesik.",
    "one punch man": "Saitama olyan erős, hogy egyetlen ütéssel legyőz bárkit – ettől pedig unatkozik. Hősként mégis értelmet próbál találni a mindennapokban.",
    "steins gate": "Egy különc társaság rájön, hogyan lehet üzenni a múltba. Az időparadoxonok ára egyre magasabb, és minden döntés lavinát indít.",
    "rezero": "Subaru egy fantasy világban halál után visszatér egy korábbi pillanathoz. Az „újrakezdés” képessége azonban egyre nagyobb lelki terhet jelent.",
    "sword art online": "Egy VR-játékban a kijutás a végigjátszás, a halál pedig valós következmény. Kirito a túlélésért és mások megmentéséért küzd.",
    "haikyuu": "Hinata röplabdázni kezd, hogy bebizonyítsa: a magasság nem minden. Egy tehetséges irányítóval együtt újraépítik az iskola csapatát.",
    "vinland saga": "Egy fiatal harcos bosszút esküszik, majd a viking világ kegyetlenségében felnőtté válik. A csaták mellett a megváltás és a célkeresés is központi téma.",
    "tokyo ghoul": "Kaneki félig ghoul-lá válik, és két világ között reked: az emberek és az emberevő lények között. Identitásválság és brutális konfliktusok kísérik.",
    "the promised neverland": "Egy idilli árvaházban a gyerekek felfedezik a hely valódi titkát, és megszökni próbálnak. Az idő ellenük dolgozik, így csak az eszükre támaszkodhatnak.",
    "cowboy bebop": "Űrbéli fejvadászok utaznak bolygóról bolygóra, miközben múltjuk utoléri őket. Noir hangulat, jazz és melankólia elegáns sci-fi köntösben.",
    "code geass": "Egy száműzött herceg képességet kap, amellyel másokat irányíthat. Forradalmat indít az elnyomás ellen, de a hatalom ára egyre nagyobb.",
    "frieren beyond journeys end": "A nagy küldetés véget ér, de Frierennek az idő máshogy telik. Útra kel, hogy megértse társai jelentőségét és pótolja a kimondatlan dolgokat.",
    "sousou no frieren": "A nagy küldetés véget ér, de Frierennek az idő máshogy telik. Útra kel, hogy megértse társai jelentőségét és pótolja a kimondatlan dolgokat.",
    "solo leveling": "Kapuk nyílnak a világban, és vadászok küzdenek szörnyek ellen. Jinwoo a leggyengébbek közül indul, majd egy különleges „rendszerrel” robbanásszerűen fejlődik.",
    "hunter x hunter": "Gon apját keresi, a legendás vadászt. Útja során barátokra lel, és egyre veszélyesebb kihívásokba keveredik kreatív szabályrendszerekkel.",
    "your name": "Két tinédzser időnként testet cserél, és a zűrzavaros hétköznapokból mély kapcsolat születik. Egy fordulat után az idő és a távolság is ellenséggé válik.",
    "spirited away": "Chihiro szellemvilágba kerül, ahol a szülei átok alá esnek. Egy különös fürdőházban dolgozva próbálja visszaszerezni a szabadságát.",
    "howl's moving castle": "Sophie átok miatt idős testbe kerül, és Howl mozgó kastélyában menedéket talál. Háború, varázslat és bátorság keveredik egy mesés világban.",
    "dr stone": "Az emberiség kővé válik, majd Senku felébred és a tudomány erejével akarja újraépíteni a civilizációt. Találékonyság, stratégia és humor posztapokaliptikus keretben.",
    "overlord": "Egy játék leáll, de a főhős bennragad a karakterében, és a világ valóságossá válik. Hatalmával új rendet épít, miközben a morális határok elmosódnak.",
    "tokyo revengers": "Takemichi visszakerül a múltba, és rájön: a jövő tragédiáit csak úgy akadályozhatja meg, ha megváltoztatja az eseményeket. Bandaháborúk és időutazós feszültség.",
    "the apothecary diaries": "Maomao udvari környezetbe kerül, ahol mérgezések, pletykák és titkok kavarognak. Gyógyszerészeti tudásával és éles eszével old meg rejtélyeket.",
    "kusuriya no hitorigoto": "Maomao udvari környezetbe kerül, ahol mérgezések, pletykák és titkok kavarognak. Gyógyszerészeti tudásával és éles eszével old meg rejtélyeket.",
    "mushoku tensei": "Egy bukott férfi új esélyt kap egy fantasy világban, és elhatározza, hogy ezúttal értelmesen él. Fejlődés és fájdalmas tanulságok kísérik.",
    "mushoku tensei jobless reincarnation": "Egy bukott férfi új esélyt kap egy fantasy világban, és elhatározza, hogy ezúttal értelmesen él. Fejlődés és fájdalmas tanulságok kísérik.",
    "that time i got reincarnated as a slime": "Egy férfi nyálkaként ébred, és különleges képességeivel gyorsan erőre kap. Szövetségeket épít, várost alapít, és új rendet teremt.",
    "tensei shitara slime datta ken": "Egy férfi nyálkaként ébred, és különleges képességeivel gyorsan erőre kap. Szövetségeket épít, várost alapít, és új rendet teremt.",
    "konosuba": "Kazuma és társai fantasy világban próbálnak boldogulni, de minden lépésük katasztrófába torkollik. Abszurd humor és paródia.",
    "kono subarashii sekai ni shukufuku wo": "Kazuma és társai fantasy világban próbálnak boldogulni, de minden lépésük katasztrófába torkollik. Abszurd humor és paródia.",
    "the eminence in shadow": "A főhős titkos háttérfőnök akar lenni, és „árnyék-szervezetet” épít – miközben a világ tényleg tele van összeesküvéssel. Paródia és akció keveréke.",
    "kage no jitsuryokusha ni naritakute": "A főhős titkos háttérfőnök akar lenni, és „árnyék-szervezetet” épít – miközben a világ tényleg tele van összeesküvéssel. Paródia és akció keveréke.",
    "blue lock": "Egy kíméletlen program a világ legjobb csatárát akarja kinevelni. A résztvevők egymást is ellenfélnek tekintik – csak egy lehet a nyertes.",
    "classroom of the elite": "Egy elit iskolában a diákok pontokért és státuszért küzdenek. A csendes Ayanokouji a háttérből mozgatja a szálakat, miközben a rendszer könyörtelen.",
    "fire force": "Az emberek spontán lángra kaphatnak, és „égőkké” válnak. Egy speciális egység nemcsak olt, hanem a jelenség mögötti titkot is üldözi.",
    "enen no shouboutai": "Az emberek spontán lángra kaphatnak, és „égőkké” válnak. Egy speciális egység nemcsak olt, hanem a jelenség mögötti titkot is üldözi.",
    "violet evergarden": "Violet leveleket ír mások helyett, miközben megpróbálja megérteni a saját érzéseit és a „szeretlek” jelentését. Megható epizódok és gyönyörű animáció.",
    "a silent voice": "Egy fiú bűntudattal él a múltbeli bántások miatt, és megpróbál jóvátenni egy régi hibát egy hallássérült lánnyal szemben. Őszinte történet megbocsátásról és újrakezdésről.",
    "koe no katachi": "Egy fiú bűntudattal él a múltbeli bántások miatt, és megpróbál jóvátenni egy régi hibát egy hallássérült lánnyal szemben. Őszinte történet megbocsátásról és újrakezdésről.",
    "your lie in april": "Egy tehetséges zongorista a trauma miatt elveszti a zenét, míg egy energikus hegedűs lány vissza nem húzza a színpadra. Zene, szerelem és fájdalmas szépség.",
    "shigatsu wa kimi no uso": "Egy tehetséges zongorista a trauma miatt elveszti a zenét, míg egy energikus hegedűs lány vissza nem húzza a színpadra. Zene, szerelem és fájdalmas szépség.",
    "fate zero": "Mágusok háborúja a Szent Grálért, legendás hősök idézésével. Morális szürkezóna, tragikus döntések és brutális következmények.",
    "fate stay night unlimited blade works": "Titkos mágus-háború a Szent Grálért, ahol Shirou szövetségei és döntései mindenkire hatnak. Látványos összecsapások és drámai dilemmák.",

    // --- plusz: amiket legutóbb folytatásként kérted ---
    "dragon ball": "Goku gyerekként indul útnak a Sárkánygömbökért, miközben harcművészekkel, banditákkal és különc mesterekkel találkozik. Klasszikus kaland humorral és csatákkal.",
    "dragon ball super": "A béke után isteni ellenfelek és univerzumok közti tornák borítják fel a világot. Goku új erőszinteket ér el, miközben a tét már nem csak a Föld.",
    "bleach thousand year blood war": "A Soul Society új, mindent felforgató ellenséggel néz szembe. A harcok brutálisabbak, a múlt titkai előkerülnek, és Ichigo sorsa új szintre lép."
  };

  // normalizálás (app.js ugyanilyet használ)
  const norm = (s)=>String(s||"")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóöőúüű\s\-']/g," ")
    .replace(/\s+/g," ")
    .trim();

  Object.keys(T).forEach(k=>{
    window.ANIMEFLIX_HU_DB.titles[norm(k)] = T[k];
  });
})();
