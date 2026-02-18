/* global window */
/**
 * FONTOS:
 * - Ez a fájl opcionális: a katalógus (AniList) nélküle is működik.
 * - Itt csak a TE jogtiszta videóforrásaidat add meg.
 */
window.ANIMEFLIX_DATA = window.ANIMEFLIX_DATA || {
  legalContent: {}
};

// Biztonság kedvéért: legyen "valódi" globál változó is
// (ha valahol a névfeloldás szigorúbb)
var ANIMEFLIX_DATA = window.ANIMEFLIX_DATA;
