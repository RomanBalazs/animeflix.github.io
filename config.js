/* global window */
/**
 * AnimeFlix konfiguráció (GitHub Pages / statikus oldal)
 *
 * Itt add meg a Revolut adatokat az előfizetés oldalhoz.
 * - Ha van Revtag (pl. @romanbalazs), add meg a revtag mezőben.
 * - Ha IBAN-t használsz, add meg az iban mezőben.
 */
window.ANIMEFLIX_CONFIG = {
  premiumPriceHuf: 3500,
  premiumPeriodHu: "hó",
  revolut: {
    beneficiaryName: "Balázs Román",
    revtag: "@balzstl0y",
    iban: "LT72 3250 0312 0803 0730",
    swift: "REVOLT21",
    note: "Közleménybe a felhasználónevet írd."
  },
  contact: {
    // opcionális: ha szeretnél automatikus email sablont a visszaigazoláshoz
    email: ""
  }
};
