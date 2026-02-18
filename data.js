/* global window */
/**
 * Jogtiszta videók forrásai IDE kerülnek (YouTube embed / saját MP4 stb.)
 * A katalógus (AniList) mindenkinek reklámmentes.
 *
 * FIGYELEM: Ez csak METADATA + JOGTISZTA forrás linkek. Ne tegyél be jogsértő tartalmat.
 */
window.ANIMEFLIX_DATA = window.ANIMEFLIX_DATA || {
  legalContent: {
    /*
      Példa:
      "15125": {
        noteHu: "YouTube jogtiszta forrás.",
        seasons: [
          { season: 1, episodes: [
            { id: "ep1", title: "1. rész", type: "youtube", src: "https://www.youtube.com/embed/..." }
          ]}
        ]
      }
    */

    // Death Note (AniList ID: 1535) – Videa beágyazás
    "1535": {
      noteHu: "Videa beágyazás (jogtiszta forrás / saját felelősségre).",
      seasons: [
        { season: 1, episodes: [
          { id: "ep1", title: "1. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-01-zwAQAo6Vow5md7AT" },
          { id: "ep2", title: "2. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
        ]}
      ]
    }
  }
};
