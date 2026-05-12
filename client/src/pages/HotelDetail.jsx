import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star, ArrowRight, Wifi, Coffee, Waves } from "lucide-react";
import { theme } from "../lib/theme.js";
import { api } from "../lib/api.js";

export default function HotelDetail() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getHotelById(id)
      .then(setHotel)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: "120px 6vw", color: theme.MUTED }}>Loading…</div>;
  if (error) return <div style={{ padding: "120px 6vw", color: "#a33" }}>Couldn't load hotel: {error}</div>;
  if (!hotel) return <div style={{ padding: "120px 6vw" }}>Hotel not found.</div>;

  const images = hotel.images?.length ? hotel.images : [hotel.cover_image];

  return (
    <main style={{ padding: "60px 6vw 100px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: theme.MUTED, marginBottom: 32, letterSpacing: "0.05em" }}>
        <Link to="/" style={{ color: theme.MUTED, textDecoration: "none" }}>Home</Link> / <Link to="/hotels" style={{ color: theme.MUTED, textDecoration: "none" }}>Stays</Link> / <span style={{ color: theme.INK }}>{hotel.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>{hotel.tag}</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em", marginBottom: 16 }}>{hotel.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, color: theme.MUTED, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} /> {hotel.city}, {hotel.state}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={14} fill={theme.SEA} stroke={theme.SEA} /> {hotel.rating} ({hotel.review_count} reviews)
            </div>
          </div>
        </div>
      </div>

      {/* Image gallery */}
      <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: images.length > 1 ? "2fr 1fr" : "1fr", gap: 12, marginBottom: 60, height: 480 }}>
        <img src={images[0]} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {images.length > 1 && (
          <div style={{ display: "grid", gridTemplateRows: `repeat(${Math.min(images.length - 1, 2)}, 1fr)`, gap: 12 }}>
            {images.slice(1, 3).map((img, i) => (
              <img key={i} src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 60 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 24 }}>About this stay</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#4A5856", marginBottom: 40 }}>{hotel.description}</p>

          <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 20 }}>Amenities</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 40 }}>
            {(hotel.amenities || []).map(a => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: theme.INK, padding: 14, border: `1px solid ${theme.SAND}`, background: "#fff" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.SEA }}></div>
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Booking sidebar */}
        <aside style={{ position: "sticky", top: 100, alignSelf: "start", background: "#fff", padding: 32, border: `1px solid ${theme.SAND}`, boxShadow: "0 12px 40px rgba(15, 74, 67, 0.08)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>From</div>
          <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: theme.SEA_DARK, marginBottom: 4 }}>
            ₹{Number(hotel.price).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 28 }}>per night, taxes included</div>

          <Link to={`/book/${hotel.id}`} className="cta-btn" style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 10,
            background: theme.SEA, color: theme.CREAM, padding: 18, textDecoration: "none",
            fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500, marginBottom: 20,
          }}>
            Reserve Now <ArrowRight size={14} />
          </Link>

          <div style={{ fontSize: 12, color: theme.MUTED, textAlign: "center", lineHeight: 1.6 }}>
            Free cancellation up to 48 hours before check-in.
          </div>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${theme.SAND}`, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: theme.MUTED }}>Rooms available</span>
            <span style={{ fontWeight: 600 }}>{hotel.rooms}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
