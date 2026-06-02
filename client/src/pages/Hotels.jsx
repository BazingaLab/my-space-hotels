import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { theme } from "../lib/theme.js";
import { api } from "../lib/api.js";
import HotelCard from "../components/HotelCard.jsx";

export default function Hotels() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTag, setFilterTag] = useState(searchParams.get("tag") || "");

  const city = searchParams.get("city") || "";

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (city) params.city = city;
    if (filterTag) params.tag = filterTag;

    api.getHotels(params)
      .then(data => setHotels(data.hotels || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [city, filterTag]);

  const tags = ["", "Heritage", "Beachfront", "Luxury", "Boutique", "Mountain"];

  return (
    <main style={{ padding: "60px 6vw 100px", minHeight: "70vh" }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— Our Collection</div>
        <h1 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em", marginBottom: 16 }}>
          {city ? <>Stays in <em style={{ color: theme.SEA }}>{city}</em></> : <>All <em style={{ color: theme.SEA }}>stays</em>.</>}
        </h1>
        <p style={{ fontSize: 16, color: theme.MUTED, maxWidth: 600 }}>
          {loading ? "Loading…" : `${hotels.length} ${hotels.length === 1 ? "property" : "properties"} curated for you.`}
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
        {tags.map(t => (
          <button key={t || "all"} onClick={() => setFilterTag(t)} style={{
            padding: "10px 22px",
            background: filterTag === t ? theme.INK : "transparent",
            color: filterTag === t ? theme.CREAM : theme.INK,
            border: `1px solid ${theme.INK}`,
            fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.3s",
          }}>
            {t || "All"}
          </button>
        ))}
        {city && (
          <button onClick={() => { setSearchParams({}); setFilterTag(""); }}
            style={{ padding: "10px 22px", background: "transparent", color: theme.SEA_DARK, border: `1px solid ${theme.SEA}`, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            Clear "{city}" ✕
          </button>
        )}
      </div>

      {error && <div style={{ color: "#a33", padding: 20, background: "#fff", border: "1px solid #fcc" }}>Couldn't load: {error}</div>}

      {loading ? (
        <div style={{ color: theme.MUTED }}>Loading stays…</div>
      ) : hotels.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: theme.SAND }}>
          <h3 className="serif" style={{ fontSize: 32, marginBottom: 12 }}>No stays found</h3>
          <p style={{ color: theme.MUTED }}>Try a different city or filter.</p>
        </div>
      ) : (
        <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {hotels.map(h => <HotelCard key={h.id} hotel={h} />)}
        </div>
      )}
    </main>
  );
}
