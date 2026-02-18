/* global window */
/**
 * Jogtiszta videók forrásai IDE kerülnek (YouTube embed / saját MP4 stb.)
 * A katalógus (AniList) mindenkinek reklámmentes.
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


"1535": {
        noteHu: "Videa jogtiszta forrás.",
        seasons: [
          { season: 1, episodes: [
            { id: "ep1", title: "1. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-01-zwAQAo6Vow5md7AT" }
          ]}
           seasons: [
          { season: 1, episodes: [
            { id: "ep2", title: "2. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
          ]}
        ]
      }
  
"1535": {
        noteHu: "Videa jogtiszta forrás.",
        seasons: [
          { season: 1, episodes: [
            { id: "ep2", title: "2. rész", type: "videa", src: "https://videa.hu/videok/film-animacio/death-note-02-TdmdJteMZelYWbPx" }
          ]}
        ]
      }
  
  }
};
// extra biztosíték: globál név is legyen (régi kódok miatt)
var ANIMEFLIX_DATA = window.ANIMEFLIX_DATA;
