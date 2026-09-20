import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, customersApi } from "../lib/api.js";
import { theme } from "../lib/theme.js";
import { User, Mail, Phone, Gift, Star, Calendar, ArrowRight } from "lucide-react";

const CLASS_STYLE = {
  Premium: { bg: "#FFF4E0", color: "#B8860B" },
  Regular: { bg: "#E8F5F3", color: "#1F6B61" },
  Basic: { bg: "#F0EAE0", color: "#6B7670" },
};

// Guest-facing account/profile page. Deliberately light — the full booking
// list with cancel/review/complaint actions already lives at /my-bookings;
// this page is profile info, loyalty standing, and a short recent-stays
// preview that links there, not a second copy of that UI.
export default function Account() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      customersApi.me().catch(() => null),
      api.getBookingsByUser(user.id).catch(() => ({ bookings: [] })),
    ]).then(([profileData, bookingsData]) => {
      setProfile(profileData);
      setBookings((bookingsData?.bookings || []).slice(0, 3));
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const displayName = profile?.name || user.user_metadata?.full_name || user.email;
  const tierStyle = CLASS_STYLE[profile?.classification] || CLASS_STYLE.Basic;
  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 6vw 100px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>My Account</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>{displayName}</h1>
      </div>

      {loading ? (
        <div style={{ color: theme.MUTED }}>Loading…</div>
      ) : (
        <>
          {/* Profile info */}
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28, marginBottom: 24 }}>
            <h3 className="serif" style={{ fontSize: 22, marginBottom: 18 }}>Profile</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: theme.INK }}>
                <User size={16} color={theme.SEA_DARK} /> {displayName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: theme.INK }}>
                <Mail size={16} color={theme.SEA_DARK} /> {user.email}
              </div>
              {profile?.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: theme.INK }}>
                  <Phone size={16} color={theme.SEA_DARK} /> {profile.phone}
                </div>
              )}
            </div>
          </div>

          {/* Loyalty */}
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28, marginBottom: 24 }}>
            <h3 className="serif" style={{ fontSize: 22, marginBottom: 18 }}>Loyalty</h3>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 6 }}>Tier</div>
                <span style={{ background: tierStyle.bg, color: tierStyle.color, padding: "4px 14px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                  {profile?.classification || "Basic"}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 6 }}>Points</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 20 }} className="serif">
                  <Gift size={16} color={theme.SEA} /> {profile?.loyalty_points || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 6 }}>Total Stays</div>
                <div style={{ fontSize: 20 }} className="serif">{profile?.total_bookings || 0}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: theme.MUTED, marginTop: 16 }}>
              Points are earned automatically on completed stays — redeeming points at checkout isn't available yet.
            </p>
          </div>

          {/* Recent stays */}
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 className="serif" style={{ fontSize: 22 }}>Recent Stays</h3>
              <Link to="/my-bookings" style={{ fontSize: 13, color: theme.SEA_DARK, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {bookings.length === 0 ? (
              <div style={{ color: theme.MUTED, fontSize: 14 }}>No bookings yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {bookings.map(b => (
                  <Link key={b.id} to={`/my-bookings/${b.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, border: `1px solid ${theme.SAND}`, textDecoration: "none", color: theme.INK }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{b.hotels?.name || "—"}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <Calendar size={12} /> {fmt(b.check_in)} → {fmt(b.check_out)}
                      </div>
                    </div>
                    <ArrowRight size={14} color={theme.MUTED} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
