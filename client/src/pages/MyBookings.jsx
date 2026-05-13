import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { theme } from "../lib/theme.js";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.email) {
      api.getBookings(user.email)
        .then(data => setBookings(data.bookings || []))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const statusColor = (status) => ({
    confirmed: { bg: "#E8F5F3", color: theme.SEA_DARK },
    pending: { bg: "#FFF8E6", color: "#A0700A" },
    cancelled: { bg: "#FFF0F0", color: "#A33" },
  }[status] || { bg: theme.SAND, color: theme.MUTED });

  return (
    <main style={{ padding: "60px 6vw 100px", minHeight: "70vh" }}>
      <div style={{ marginBottom: 56 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— Your Account</div>
        <h1 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 400, lineHeight: 1, marginBottom: 12 }}>
          My <em style={{ color: theme.SEA }}>Bookings</em>.
        </h1>
        <p style={{ fontSize: 15, color: theme.MUTED }}>
          Signed in as <strong style={{ color: theme.INK }}>{user?.user_metadata?.full_name || user?.email}</strong>
        </p>
      </div>

      {loading && (
        <div style={{ color: theme.MUTED, padding: 40, textAlign: "center" }}>
          <div className="serif" style={{ fontSize: 24 }}>Loading your stays…</div>
        </div>
      )}

      {error && (
        <div style={{ color: "#a33", padding: 20, background: "#fff5f5", border: "1px solid #fcc" }}>
          Couldn't load bookings: {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 40px", background: theme.SAND }}>
          <div className="serif" style={{ fontSize: 48, marginBottom: 16, color: theme.MUTED }}>✦</div>
          <h3 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>No bookings yet</h3>
          <p style={{ color: theme.MUTED, marginBottom: 32, fontSize: 15 }}>
            You haven't booked any stays yet. Let's fix that.
          </p>
          <Link to="/hotels" className="cta-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: theme.SEA, color: theme.CREAM, padding: "16px 32px",
            textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
          }}>
            Browse Stays <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {bookings.map(b => {
            const sc = statusColor(b.status);
            const hotel = b.hotels || {};
            return (
              <div key={b.id} style={{ background: "#fff", border: `1px solid ${theme.SAND}`, display: "grid", gridTemplateColumns: "200px 1fr auto", overflow: "hidden" }}>
                {/* Hotel image */}
                <div style={{ width: "100%", height: "100%", minHeight: 160, overflow: "hidden" }}>
                  {hotel.cover_image
                    ? <img src={hotel.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: theme.SAND, display: "grid", placeItems: "center", color: theme.MUTED }}>No image</div>
                  }
                </div>

                {/* Booking details */}
                <div style={{ padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3 className="serif" style={{ fontSize: 24, fontWeight: 500 }}>{hotel.name || "Hotel"}</h3>
                    <span style={{ fontSize: 11, padding: "4px 12px", background: sc.bg, color: sc.color, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                      {b.status}
                    </span>
                  </div>

                  {hotel.city && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.MUTED, marginBottom: 16 }}>
                      <MapPin size={12} /> {hotel.city}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 28, fontSize: 13, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>Check-in</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={12} color={theme.SEA} /> {formatDate(b.check_in)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>Check-out</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={12} color={theme.SEA} /> {formatDate(b.check_out)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>Guests</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={12} color={theme.SEA} /> {b.guests}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>Duration</div>
                      <div>{b.nights} night{b.nights > 1 ? "s" : ""}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, fontSize: 11, color: theme.MUTED, letterSpacing: "0.05em" }}>
                    Booking ID: <code style={{ color: theme.SEA_DARK }}>{b.id.slice(0, 8).toUpperCase()}</code>
                    {" · "}Booked on {formatDate(b.created_at)}
                  </div>
                </div>

                {/* Price */}
                <div style={{ padding: 28, borderLeft: `1px solid ${theme.SAND}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", minWidth: 160 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>Total</div>
                  <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: theme.SEA_DARK }}>
                    ₹{Number(b.total_price).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}