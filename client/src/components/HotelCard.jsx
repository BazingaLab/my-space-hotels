import { Link } from "react-router-dom";
import { MapPin, Star, Wifi, Coffee, Waves, ArrowUpRight } from "lucide-react";
import { theme } from "../lib/theme.js";

export default function HotelCard({ hotel }) {
  return (
    <Link to={`/hotels/${hotel.id}`} className="card hover-lift" style={{
      textDecoration: "none", color: theme.INK, background: theme.CREAM, display: "block",
    }}>
      <div style={{ width: "100%", height: 320, overflow: "hidden", position: "relative" }}>
        <img src={hotel.cover_image} alt={hotel.name} className="img-zoom"
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", top: 16, left: 16, background: theme.CREAM, padding: "6px 14px",
          fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
          color: theme.SEA_DARK, fontWeight: 600,
        }}>{hotel.tag}</div>
      </div>
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginBottom: 6, lineHeight: 1.1 }}>{hotel.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.MUTED }}>
              <MapPin size={12} /> {hotel.city}, {hotel.state}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <Star size={12} fill={theme.SEA} stroke={theme.SEA} />
            <span style={{ fontWeight: 600 }}>{hotel.rating}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 18, marginBottom: 22, color: theme.MUTED }}>
          <Wifi size={14} /><Coffee size={14} /><Waves size={14} />
          <span style={{ fontSize: 11, marginLeft: "auto" }}>{hotel.review_count} reviews</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, borderTop: `1px solid ${theme.SAND}` }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: theme.MUTED, textTransform: "uppercase" }}>From</div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 500, color: theme.SEA_DARK }}>
              ₹{Number(hotel.price).toLocaleString("en-IN")} <span style={{ fontSize: 12, color: theme.MUTED, fontFamily: "Inter, sans-serif" }}>/ night</span>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${theme.INK}`, display: "grid", placeItems: "center" }}>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
}
