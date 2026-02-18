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
  }
};

// extra biztosíték: globál név is legyen (régi kódok miatt)
var ANIMEFLIX_DATA = window.ANIMEFLIX_DATA;
