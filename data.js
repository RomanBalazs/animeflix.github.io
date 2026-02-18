/* global window */
window.ANIMEFLIX_DATA = {
  /**
   * Jogtiszta streaming tartalom, amit TE csatolsz.
   * Kulcs: AniList Media ID (string).
   *
   * Példa:
   * legalContent: {
   *   "21": {
   *     noteHu: "Jogtiszta forrás: saját licenc / hivatalos embed.",
   *     seasons: [{
   *       season: 1,
   *       episodes: [{
   *         id: "e1",
   *         titleHu: "1. rész",
   *         durationMin: 24,
   *         sources: [{ type:"mp4", url:"https://example.com/video.mp4" }]
   *       }]
   *     }]
   *   }
   * }
   */
  legalContent: {
    // ide töltöd fel
  }
};
legalContent: {
  "20": {
    noteHu: "Jogtiszta forrás: saját licenc / hivatalos embed.",
    seasons: [{
      season: 1,
      episodes: [{
        id: "e1",
        titleHu: "1. rész",
        durationMin: 24,
        sources: [{ type:"mp4", url:"https://www.youtube.com/watch?v=dnHhcgT5mQM" }]
      }]
    }]
  }
}

