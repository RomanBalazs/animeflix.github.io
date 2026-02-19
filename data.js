/* global window */
/**
 * Jogtiszta videók forrásai IDE kerülnek (YouTube embed / saját MP4 stb.)
 * A katalógus (AniList) mindenkinek reklámmentes.
 */
window.ANIMEFLIX_DATA = window.ANIMEFLIX_DATA || { legalContent: {} };

// Ide add hozzá a jogtiszta epizódforrásokat AniList ID alapján.
// Példa (Death Note AniList ID: 1535) – jelenleg Videa linkkel (embed lehet tiltott).
window.ANIMEFLIX_DATA.legalContent["1535"] = {
  noteHu: "Forrás: külső videó link. Ha az oldal tiltja a beágyazást, a lejátszó ad 'Megnyitás új lapon' linket.",
  seasons: [
    {
      season: 1,
      episodes: [
        { id: "ep1", title: "1. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-01-zwAQAo6Vow5md7AT" },
        { id: "ep2", title: "2. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
      ]
    }
  ]
};

// extra biztosíték: globál név is legyen (régi kódok miatt)
var ANIMEFLIX_DATA = window.ANIMEFLIX_DATA;
