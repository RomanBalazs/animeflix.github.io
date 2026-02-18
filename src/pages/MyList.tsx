import React, { useMemo } from "react";
import { TITLES } from "../lib/data";
import { getWatchlist } from "../lib/storage";
import { TitleGrid } from "../components/TitleGrid";

export function MyListPage() {
  const items = useMemo(() => {
    const ids = new Set(getWatchlist());
    return TITLES.filter(t => ids.has(t.id));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 18, paddingBottom: 26 }}>
      <div className="h1">Saját listám</div>
      <div className="p">Elmentett animék.</div>

      <div style={{ marginTop: 12 }}>
        {items.length ? <TitleGrid items={items} /> : <div className="small">Még üres. Nyiss meg egy animét és add hozzá.</div>}
      </div>
    </div>
  );
}
