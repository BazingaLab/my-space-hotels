import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { TrendingUp, CalendarCheck, Clock, Star, ArrowRight, MapPin, Users } from "lucide-react";

export default function HotelPortalDashboard() {
  const { myHotel } = useHotelPortal();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      adminApi.getOwnerBookings(user.id)
        .then(d => setBookings(d.bookings || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const confirmed = bookings.filter(b => b.status === "confirmed");
  const pending = bookings.filter(b => b.status === "pending");
  const totalRevenue = confirmed.reduce((s, b) => s + Number(b.total_price), 0);
  const avgRating = myHotel?.rating || 0;

  const formatDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const statusColor = s => ({ confirmed: { bg: "#E8F5F3", color: theme.SEA_DARK }, pending: { bg: "#FFF8E6", color: "#A0700A" }, cancelled: { bg: "#FFF0F0", color: "#a33" } }[s] || {});

  if (!myHotel && !loading) return (
    <HotelPortalLayout>
      <div style={{ padding: 60, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
        <div className="serif" style={{ fontSize: 40, marginBottom: 16 }}>No property yet</div>
        <p style={{ color: theme.MUTED, marginBottom: 32 }}>Your application may still be under review, or you haven't submitted one yet.</p>
        <Link to="/list-property" className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
          List Your Property <ArrowRight size={14} />
        </Link>
      </div>
    </HotelPortalLayout>
  );

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Overview</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Dashboard</h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: theme.SEA },
          { label: "Confirmed", value: confirmed.length, icon: CalendarCheck, color: "#7C6AF5" },
          { label: "Pending", value: pending.length, icon: Clock, color: "#F5A623" },
          { label: "Rating", value: avgRating ? `${avgRating} ★` : "New", icon: Star, color: "#E87C4E" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", padding: 24, border: `1px solid ${theme.SAND}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${s.color}15`, display: "grid", placeItems: "center" }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
            <div className="serif" style={{ fontSize: 32, fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        {/* Recent bookings */}
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 400 }}>Recent Bookings</h2>
            <Link to="/hotel-portal/bookings" style={{ fontSize: 12, color: theme.SEA_DARK, textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? <div style={{ color: theme.MUTED }}>Loading…</div> : bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.MUTED }}>No bookings yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {bookings.slice(0, 6).map(b => {
                const sc = statusColor(b.status);
                return (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${theme.SAND}` }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{b.guest_name}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>
                        {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.guests} guest{b.guests > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="serif" style={{ fontSize: 16, color: theme.SEA_DARK }}>₹{Number(b.total_price).toLocaleString("en-IN")}</div>
                      <span style={{ background: sc.bg, color: sc.color, padding: "2px 8px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Property card */}
        {myHotel && (
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, overflow: "hidden" }}>
            <img src={myHotel.cover_image} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 className="serif" style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>{myHotel.name}</h3>
                  <div style={{ fontSize: 12, color: theme.MUTED, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={11} /> {myHotel.city}, {myHotel.state}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: myHotel.available ? "#E8F5F3" : "#FFF0F0" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: myHotel.available ? "#4ade80" : "#f87171" }} />
                  <span style={{ fontSize: 11, color: myHotel.available ? theme.SEA_DARK : "#a33" }}>{myHotel.available ? "Live" : "Paused"}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, marginBottom: 20 }}>
                <span style={{ color: theme.SEA_DARK, fontWeight: 600 }}>₹{Number(myHotel.price).toLocaleString("en-IN")}/night</span>
                <span style={{ color: theme.MUTED, display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> {myHotel.rooms} rooms</span>
              </div>
              <Link to="/hotel-portal/property" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: theme.SEA_DEEP, color: theme.CREAM, textDecoration: "none", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Manage Property <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </HotelPortalLayout>
  );
}
