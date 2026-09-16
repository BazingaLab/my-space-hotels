import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  MapPin, Star, ArrowRight, Check, X, ChevronLeft, ChevronRight, Share2,
  Wifi, Snowflake, Car, Waves, Sparkles, UtensilsCrossed, Wine,
  Dumbbell, BellRing, Shirt, PlaneTakeoff, BatteryCharging, Camera, ArrowUpDown,
  FileText, ClipboardList, ShieldCheck, Flag,
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
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    api.getHotelById(id)
      .then(setHotel)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Only fetched (and only ever shown) when real dates are known — the
  // canonical backend calculation, not hotel.rooms (Section 14).
  useEffect(() => {
    if (!checkIn || !checkOut) { setAvailability(null); return; }
    api.getHotelAvailability(id, { check_in: checkIn, check_out: checkOut })
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [id, checkIn, checkOut]);

  const images = hotel?.images?.length ? hotel.images : hotel?.cover_image ? [hotel.cover_image] : [];

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

  const handleShare = async () => {
    const shareData = { title: hotel?.name, text: `Check out ${hotel?.name} on My Space Hotels`, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user cancelled — not an error */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (loading) return <div style={{ padding: "120px 6vw", color: theme.MUTED }}>Loading…</div>;
  if (error) return <div style={{ padding: "120px 6vw", color: "#a33" }}>Couldn't load hotel: {error}</div>;
  if (!hotel) return <div style={{ padding: "120px 6vw" }}>Hotel not found.</div>;

  const thumbnails = images.slice(1, 5);
  const extraCount = images.length - 5;
  const hasReviews = (hotel.review_count || 0) > 0;

  return (
    <main style={{ padding: "60px 6vw 100px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: theme.MUTED, marginBottom: 32, letterSpacing: "0.05em" }}>
        <Link to="/" style={{ color: theme.MUTED, textDecoration: "none" }}>Home</Link> / <Link to="/hotels" style={{ color: theme.MUTED, textDecoration: "none" }}>Stays</Link> / <span style={{ color: theme.INK }}>{hotel.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>{hotel.tag}</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em" }}>{hotel.name}</h1>
        </div>
        <button onClick={handleShare} style={{
          display: "flex", alignItems: "center", gap: 8, background: "transparent",
          border: `1px solid ${theme.SAND}`, padding: "10px 18px", cursor: "pointer",
          fontSize: 13, color: theme.INK, fontFamily: "inherit", marginTop: 8,
        }}>
          <Share2 size={15} /> {shareCopied ? "Link copied" : "Share"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, color: theme.MUTED, flexWrap: "wrap", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={14} /> {hotel.city}, {hotel.state}
        </div>
      </div>

      {/* Photo mosaic */}
      {images.length > 0 && (
        <div className="grid-1-mobile" style={{
          display: "grid",
          gridTemplateColumns: thumbnails.length > 0 ? "2fr 1fr" : "1fr",
          gap: 12, marginBottom: 24, height: 480,
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

      {/* Quick facts row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 14, color: theme.INK, marginBottom: 56, paddingBottom: 32, borderBottom: `1px solid ${theme.SAND}` }}>
        <span>{hotel.max_guests || 4} guests</span>
        <span style={{ color: theme.SAND }}>·</span>
        <span>{hotel.bedrooms || 1} bedroom{(hotel.bedrooms || 1) !== 1 ? "s" : ""}</span>
        <span style={{ color: theme.SAND }}>·</span>
        <span>{hotel.beds || 1} bed{(hotel.beds || 1) !== 1 ? "s" : ""}</span>
        <span style={{ color: theme.SAND }}>·</span>
        <span>{hotel.bathrooms || 1} bathroom{(hotel.bathrooms || 1) !== 1 ? "s" : ""}</span>
        <span style={{ color: theme.SAND }}>·</span>
        {hasReviews ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={14} fill={theme.SEA} stroke={theme.SEA} /> {hotel.rating} ({hotel.review_count} reviews)
          </span>
        ) : (
          <span style={{ color: theme.MUTED }}>No reviews yet</span>
        )}
      </div>

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
              <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 20 }}>Where you'll be</h3>
              <div style={{ marginBottom: 12 }}>
                <MapPreview latitude={hotel.latitude} longitude={hotel.longitude} interactive height={380} />
              </div>
              <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 40 }}>{hotel.city}, {hotel.state}</div>
            </>
          )}

          <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 20 }}>Things to know</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
            <div>
              <FileText size={18} color={theme.SEA_DARK} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Cancellation policy</div>
              <p style={{ fontSize: 13, color: theme.MUTED, lineHeight: 1.6, marginBottom: 8 }}>Free cancellation up to 48 hours before check-in.</p>
              <Link to="/cancellation-policy" style={{ fontSize: 12, color: theme.SEA_DARK, textDecoration: "underline" }}>Learn more</Link>
            </div>
            <div>
              <ClipboardList size={18} color={theme.SEA_DARK} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>House rules</div>
              <p style={{ fontSize: 13, color: theme.MUTED, lineHeight: 1.6 }}>
                {hotel.house_rules || "No specific house rules listed. Contact the property directly with questions."}
              </p>
            </div>
            <div>
              <ShieldCheck size={18} color={theme.SEA_DARK} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Safety & property</div>
              <p style={{ fontSize: 13, color: theme.MUTED, lineHeight: 1.6, marginBottom: 8 }}>Our commitment to guest safety across every partner property.</p>
              <Link to="/trust-safety" style={{ fontSize: 12, color: theme.SEA_DARK, textDecoration: "underline" }}>Learn more</Link>
            </div>
          </div>
        </div>

        {/* Booking card */}
        <aside style={{ alignSelf: "start", background: "#fff", padding: 32, border: `1px solid ${theme.SAND}`, boxShadow: "0 12px 40px rgba(15, 74, 67, 0.08)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>From</div>
          <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: theme.SEA_DARK, marginBottom: 4 }}>
            ₹{Number(hotel.price).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 28 }}>per night — GST calculated at checkout</div>

          {availability && (
            <div style={{
              padding: "10px 14px", marginBottom: 20, fontSize: 13,
              background: availability.available > 0 ? "#E8F5F3" : "#FFF0F0",
              color: availability.available > 0 ? theme.SEA_DARK : "#a33",
            }}>
              {availability.available > 0
                ? `${availability.available} of ${availability.total} rooms available for these dates`
                : "Sold out for these dates"}
            </div>
          )}

          <Link to={`/book/${hotel.id}${checkIn && checkOut ? `?check_in=${checkIn}&check_out=${checkOut}` : ""}`} className="cta-btn" style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 10,
            background: theme.SEA, color: theme.CREAM, padding: 18, textDecoration: "none",
            fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500, marginBottom: 20,
          }}>
            Reserve Now <ArrowRight size={14} />
          </Link>

          <div style={{ fontSize: 12, color: theme.MUTED, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
            Free cancellation up to 48 hours before check-in.
          </div>

          <div style={{ paddingTop: 20, borderTop: `1px solid ${theme.SAND}`, display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 20 }}>
            {/* Total capacity, not "available" — this hotel's real
                availability for specific dates is the banner above,
                only ever shown once dates are actually known. */}
            <span style={{ color: theme.MUTED }}>Total rooms</span>
            <span style={{ fontWeight: 600 }}>{hotel.rooms}</span>
          </div>

          <a
            href={`mailto:support@myspacehotels.in?subject=${encodeURIComponent(`Reporting listing: ${hotel.name} (${hotel.id})`)}`}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: theme.MUTED, textDecoration: "underline" }}
          >
            <Flag size={12} /> Report this listing
          </a>
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