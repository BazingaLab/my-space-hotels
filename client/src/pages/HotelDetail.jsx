import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin, Star, ArrowRight, Check, X, ChevronLeft, ChevronRight,
  Wifi, Snowflake, Car, Waves, Sparkles, UtensilsCrossed, Wine,
  Dumbbell, BellRing, Shirt, PlaneTakeoff, BatteryCharging, Camera, ArrowUpDown,
} from "lucide-react";
import { theme } from "../lib/theme.js";
import { api } from "../lib/api.js";
import MapPreview from "../shared/components/MapPreview.jsx";

const AMENITY_ICONS = {
  WiFi: Wifi, AC: Snowflake, Parking: Car, Pool: Waves, Spa: Sparkles,
  Restaurant: UtensilsCrossed, Bar: Wine, Gym: Dumbbell, "Room Service": BellRing,
  Laundry: Shirt, "Airport Transfer": PlaneTakeoff, "Power Backup": BatteryCharging,
  CCTV: Camera, Elevator: ArrowUpDown,
};

export default function HotelDetail() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    api.getHotelById(id)
      .then(setHotel)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const images = hotel?.images?.length ? hotel.images : hotel?.cover_image ? [hotel.cover_image] : [];

  // Lightbox keyboard controls
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setLightboxIndex(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, images.length]);

  if (loading) return <div style={{ padding: "120px 6vw", color: theme.MUTED }}>Loading…</div>;
  if (error) return <div style={{ padding: "120px 6vw", color: "#a33" }}>Couldn't load hotel: {error}</div>;
  if (!hotel) return <div style={{ padding: "120px 6vw" }}>Hotel not found.</div>;

  const thumbnails = images.slice(1, 5);
  const extraCount = images.length - 5;

  return (
    <main style={{ padding: "60px 6vw 100px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: theme.MUTED, marginBottom: 32, letterSpacing: "0.05em" }}>
        <Link to="/" style={{ color: theme.MUTED, textDecoration: "none" }}>Home</Link> / <Link to="/hotels" style={{ color: theme.MUTED, textDecoration: "none" }}>Stays</Link> / <span style={{ color: theme.INK }}>{hotel.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
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

      {/* Photo mosaic — main image + up to 4 thumbnails, click any to open the lightbox */}
      {images.length > 0 && (
        <div className="grid-1-mobile" style={{
          display: "grid",
          gridTemplateColumns: thumbnails.length > 0 ? "2fr 1fr" : "1fr",
          gap: 12, marginBottom: 56, height: 480,
        }}>
          <div onClick={() => setLightboxIndex(0)} style={{ cursor: "pointer", overflow: "hidden", borderRadius: 4 }}>
            <img src={images[0]} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          {thumbnails.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 12 }}>
              {thumbnails.map((img, i) => {
                const isLast = i === thumbnails.length - 1;
                const showOverlay = isLast && extraCount > 0;
                return (
                  <div key={i} onClick={() => setLightboxIndex(i + 1)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", borderRadius: 4 }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {showOverlay && (
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(21, 32, 30, 0.55)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: theme.CREAM, fontSize: 15, fontWeight: 500,
                      }}>
                        +{extraCount} photos
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 60 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 24 }}>About this stay</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#4A5856", marginBottom: 40 }}>{hotel.description}</p>

          {(hotel.amenities || []).length > 0 && (
            <>
              <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 20 }}>Amenities</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 40 }}>
                {hotel.amenities.map(a => {
                  const Icon = AMENITY_ICONS[a] || Check;
                  return (
                    <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: theme.INK, padding: 14, border: `1px solid ${theme.SAND}`, background: "#fff" }}>
                      <Icon size={17} color={theme.SEA_DARK} />
                      {a}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {hotel.latitude && hotel.longitude && (
            <>
              <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 20 }}>Location</h3>
              <div style={{ marginBottom: 40 }}>
                <MapPreview latitude={hotel.latitude} longitude={hotel.longitude} />
              </div>
            </>
          )}
        </div>

        {/* Booking card — static flow, not sticky (see HotelDetail.jsx history:
            sticky was the one rule capable of overlapping the gallery above). */}
        <aside style={{ alignSelf: "start", background: "#fff", padding: 32, border: `1px solid ${theme.SAND}`, boxShadow: "0 12px 40px rgba(15, 74, 67, 0.08)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>From</div>
          <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: theme.SEA_DARK, marginBottom: 4 }}>
            ₹{Number(hotel.price).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 28 }}>per night, plus applicable GST</div>

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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(21, 32, 30, 0.92)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            style={{
              position: "absolute", top: 24, right: 24, background: "transparent", border: "none",
              color: theme.CREAM, cursor: "pointer", padding: 8,
            }}
          >
            <X size={28} />
          </button>

          <div style={{ position: "absolute", top: 28, left: 24, color: theme.CREAM, fontSize: 13, letterSpacing: "0.1em" }}>
            {lightboxIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}
              aria-label="Previous photo"
              style={{ position: "absolute", left: 24, background: "transparent", border: "none", color: theme.CREAM, cursor: "pointer", padding: 8 }}
            >
              <ChevronLeft size={36} />
            </button>
          )}

          <img
            src={images[lightboxIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "85vw", maxHeight: "85vh", objectFit: "contain" }}
          />

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}
              aria-label="Next photo"
              style={{ position: "absolute", right: 24, background: "transparent", border: "none", color: theme.CREAM, cursor: "pointer", padding: 8 }}
            >
              <ChevronRight size={36} />
            </button>
          )}
        </div>
      )}
    </main>
  );
}