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
    beneficiaryName: "Ide írd a kedvezményezett nevét",
    revtag: "@ide_ird_a_revtagot",
    iban: "",
    note: "Közleménybe a felhasználónevet írd."
  },
  contact: {
    // opcionális: ha szeretnél automatikus email sablont a visszaigazoláshoz
    email: ""
  }
};
