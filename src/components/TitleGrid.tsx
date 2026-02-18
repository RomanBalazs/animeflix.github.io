import React from "react";
import { Link } from "react-router-dom";
import type { Title } from "../lib/data";

export function TitleGrid({ items }: { items: Title[] }) {
  return (
    <div className="grid cols2 cols3 cols5">
      {items.map(t => (
        <Link key={t.id} to={`/title/${t.id}`} style={{ textDecoration: "none" }}>
          <div className="tile">
            <div className="tilePoster" />
            <div className="tileInfo">
              <div style={{ fontWeight: 900 }}>{t.name}</div>
              <div className="small" style={{ marginTop: 4 }}>{t.year} • {t.studio}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
