import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { adminApi, pendingApi } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { theme } from "../../lib/theme.js";
import { CalendarCheck, TrendingUp, Star, ArrowRight, MapPin, Clock } from "lucide-react";

export default function HotelOwnerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [myHotels, setMyHotels] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      adminApi.getOwnerBookings(user.id),
      adminApi.getHotels(),
      pendingApi.getMine(user.id),
    ]).then(([b, h, s]) => {
      setBookings(b.bookings || []);
      // Filter hotels owned by this user
      setMyHotels((h.hotels || []).filter(hotel => hotel.owner_id === user.id));
      setSubmissions(s.submissions || []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

  const totalRevenue = bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + Number(b.total_price), 0);
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;

  const formatDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const statusColor = s => ({ confirmed: { bg: "#E8F5F3", color: theme.SEA_DARK }, pending: { bg: "#FFF8E6", color: "#A0700A" }, cancelled: { bg: "#FFF0F0", color: "#a33" } }[s] || {});

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Welcome back</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>
          {user?.user_metadata?.full_name?.split(" ")[0] || "Hotel Owner"}'s Dashboard
        </h1>
      </div>

      {loading ? <div style={{ color: theme.MUTED }}>Loading…</div> : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
            {[
              { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: theme.SEA },
              { label: "Confirmed Bookings", value: confirmedBookings, icon: CalendarCheck, color: "#7C6AF5" },
              { label: "Pending Bookings", value: pendingBookings, icon: Clock, color: "#F5A623" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", padding: 28, border: `1px solid ${theme.SAND}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${s.color}15`, display: "grid", placeItems: "center" }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                </div>
                <div className="serif" style={{ fontSize: 36, fontWeight: 500 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* My Hotels */}
          {myHotels.length > 0 && (
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32, marginBottom: 32 }}>
              <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 24 }}>My Properties</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {myHotels.map(h => (
                  <div key={h.id} style={{ display: "flex", gap: 16, padding: 20, border: `1px solid ${theme.SAND}` }}>
                    <img src={h.cover_image} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED, display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                        <MapPin size={11} /> {h.city}, {h.state}
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        <span style={{ color: theme.SEA_DARK }}>₹{Number(h.price).toLocaleString("en-IN")}/night</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={11} fill={theme.SEA} stroke={theme.SEA} /> {h.rating || "New"}
                        </span>
                        <span style={{ color: h.available ? theme.SEA_DARK : "#a33" }}>
                          {h.available ? "● Live" : "● Paused"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending submissions */}
          {submissions.length > 0 && (
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32, marginBottom: 32 }}>
              <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 24 }}>My Submissions</h2>
              {submissions.map(s => {
                const sc = { pending: { bg: "#FFF8E6", color: "#A0700A" }, approved: { bg: "#E8F5F3", color: theme.SEA_DARK }, rejected: { bg: "#FFF0F0", color: "#a33" } }[s.status];
                return (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${theme.SAND}` }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED }}>{s.city}, {s.state} · Submitted {formatDate(s.submitted_at)}</div>
                      {s.rejection_reason && <div style={{ fontSize: 12, color: "#a33", marginTop: 4 }}>Reason: {s.rejection_reason}</div>}
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.status}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* No hotels yet */}
          {myHotels.length === 0 && submissions.length === 0 && (
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 60, textAlign: "center", marginBottom: 32 }}>
              <div className="serif" style={{ fontSize: 32, marginBottom: 12 }}>No properties yet</div>
              <p style={{ color: theme.MUTED, marginBottom: 28 }}>Submit your property for review to get started.</p>
              <Link to="/list-property" className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
                List Your Property <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Recent Bookings */}
          {bookings.length > 0 && (
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32 }}>
              <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 24 }}>Recent Bookings</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}` }}>
                  {["Guest", "Hotel", "Check-in", "Check-out", "Total", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {bookings.slice(0, 8).map(b => {
                    const sc = statusColor(b.status);
                    return (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontWeight: 500 }}>{b.guest_name}</div>
                          <div style={{ fontSize: 12, color: theme.MUTED }}>{b.guest_email}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>{b.hotels?.name || "—"}</td>
                        <td style={{ padding: "14px 16px", color: theme.MUTED }}>{formatDate(b.check_in)}</td>
                        <td style={{ padding: "14px 16px", color: theme.MUTED }}>{formatDate(b.check_out)}</td>
                        <td style={{ padding: "14px 16px" }} className="serif">₹{Number(b.total_price).toLocaleString("en-IN")}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{b.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}