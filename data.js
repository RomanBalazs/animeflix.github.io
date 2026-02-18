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
        { id: "ep3", title: "3. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep4", title: "4. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep5", title: "5. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep6", title: "6. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep7", title: "7. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep8", title: "8. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep9", title: "9. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep10", title: "10. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep11", title: "11. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep12", title: "12. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep13", title: "13. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep14", title: "14. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep15", title: "15. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep16", title: "16. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep17", title: "17. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep18", title: "18. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep19", title: "19. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep20", title: "20. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep21", title: "21. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep22", title: "22. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep23", title: "23. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep24", title: "24. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep25", title: "25. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep26", title: "26. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep27", title: "27. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep28", title: "28. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep29", title: "29. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep30", title: "30. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep31", title: "31. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep32", title: "32. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep33", title: "33. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep34", title: "34. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep35", title: "35. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep36", title: "36. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        { id: "ep37", title: "37. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        
      ]
    }
  ]
};

// extra biztosíték: globál név is legyen (régi kódok miatt)
var ANIMEFLIX_DATA = window.ANIMEFLIX_DATA;
