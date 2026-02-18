export type Episode = { id: string; title: string; durationMin: number; synopsis: string; };
export type Season = { season: number; episodes: Episode[]; };
export type Title = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  genres: string[];
  moods: string[];
  studio: string;
  year: number;
  ageRating: string;
  featured?: boolean;
  seasons: Season[];
};

export const TITLES: Title[] = [
  {
    id: "kage-no-kishi",
    name: "Kage no Kishi",
    tagline: "Árnyak közt születik a legenda.",
    description: "Titkos rend, árulás, és egy birodalom peremén születő hős.",
    genres: ["Action","Fantasy","Adventure"],
    moods: ["Hype","Dark"],
    studio: "Studio Obsidian",
    year: 2025,
    ageRating: "16+",
    featured: true,
    seasons: [{ season: 1, episodes: [
      { id: "s1e1", title: "A kapu", durationMin: 24, synopsis: "A város falain megjelenik a rend jele." },
      { id: "s1e2", title: "A fogadalom", durationMin: 24, synopsis: "A hős dönt: árnyék marad vagy kilép a fényre." },
      { id: "s1e3", title: "Üldözés", durationMin: 24, synopsis: "Egy ellopott tekercs nyomában veszélyes szövetségek születnek." }
    ]}]
  },
  {
    id: "sakura-atelier",
    name: "Sakura Atelier",
    tagline: "Egy kis műhely, nagy álmok.",
    description: "Slice-of-life Tokióban: munka, barátok, és a kreativitás ára.",
    genres: ["Slice of Life","Drama"],
    moods: ["Cozy","Feelgood"],
    studio: "Hanami Works",
    year: 2024,
    ageRating: "12+",
    seasons: [{ season: 1, episodes: [
      { id: "s1e1", title: "Az első ecsetvonás", durationMin: 23, synopsis: "Új város, új megbízás." },
      { id: "s1e2", title: "Határidő", durationMin: 23, synopsis: "A nyomás alatt születik meg a legjobb ötlet." }
    ]}]
  },
  {
    id: "neon-noir-detective",
    name: "Neon Noir Detective",
    tagline: "Bűn, fény, eső – és igazság.",
    description: "Cyberpunk nyomozás eltűnt emberek után – és a saját emlékek sem biztosak.",
    genres: ["Mystery","Sci-Fi","Thriller"],
    moods: ["Dark","Mindblown"],
    studio: "Chromatic Noir",
    year: 2025,
    ageRating: "18+",
    seasons: [{ season: 1, episodes: [
      { id: "s1e1", title: "Eső a neonon", durationMin: 26, synopsis: "Egy ügy túl gyorsan vezet felfelé." },
      { id: "s1e2", title: "Hamis arcok", durationMin: 26, synopsis: "Az első gyanúsított valójában több ember egyszerre." }
    ]}]
  }
];
