import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { theme } from "../../lib/theme.js";
import { LayoutDashboard, Building2, Image, CalendarCheck, Wallet, LogOut, Sparkles, ChevronRight, ExternalLink, PlusCircle, Check } from "lucide-react";

const navItems = [
  { path: "/hotel-portal", label: "Dashboard", icon: LayoutDashboard },
  { path: "/hotel-portal/property", label: "My Property", icon: Building2 },
  { path: "/hotel-portal/photos", label: "Photo Manager", icon: Image },
  { path: "/hotel-portal/bookings", label: "Bookings", icon: CalendarCheck },
  { path: "/hotel-portal/wallet", label: "Wallet", icon: Wallet },
];

export default function HotelPortalLayout({ children }) {
  const { user, signOut } = useAuth();
  const { myHotel, myHotels, activeHotelId, setActiveHotelId, isHotelier, loading } = useHotelPortal();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading screen while checking role
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F5F5F0" }}>
      <div className="serif" style={{ fontSize: 28, color: theme.MUTED }}>Loading…</div>
    </div>
  );

  // Not logged in → redirect to hotel portal login
  if (!user) return <Navigate to="/hotel-portal/login" replace />;

  // Logged in but NOT a hotel admin → show access denied, not a blank page
  if (!isHotelier) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F0", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 480, background: "#fff", padding: 48, border: `1px solid ${theme.SAND}` }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 16 }}>Access Denied</h2>
        <p style={{ color: theme.MUTED, marginBottom: 12, lineHeight: 1.7 }}>
          This portal is for approved hotel partners only. Regular guest accounts cannot access this area.
        </p>
        <p style={{ color: theme.MUTED, marginBottom: 32, fontSize: 13, lineHeight: 1.7 }}>
          If you'd like to list your property, submit an application and our team will review it within 48 hours.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/list-property" style={{ background: theme.SEA, color: theme.CREAM, padding: "14px 24px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Apply as Partner
          </Link>
          <Link to="/" style={{ background: "transparent", border: `1px solid ${theme.INK}`, color: theme.INK, padding: "14px 24px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Back to Site
          </Link>
        </div>
      </div>
    </div>
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/hotel-portal/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F5F0" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: theme.SEA_DEEP, color: theme.CREAM,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "32px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: theme.CREAM }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "grid", placeItems: "center" }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>My Space</div>
              <div style={{ fontSize: 8, letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>HOTEL PORTAL</div>
            </div>
          </Link>
        </div>

        {/* Property switcher */}
        {myHotels && myHotels.length > 0 && (
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 10 }}>
              {myHotels.length > 1 ? `Managing ${myHotels.length} Properties` : "Managing"}
            </div>

            {myHotels.length > 1 ? (
              <select
                value={activeHotelId || ""}
                onChange={(e) => setActiveHotelId(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", marginBottom: 10,
                  background: "rgba(255,255,255,0.1)", color: theme.CREAM,
                  border: "1px solid rgba(255,255,255,0.2)", fontSize: 13,
                  fontFamily: "Inter, sans-serif", cursor: "pointer", borderRadius: 2,
                }}
              >
                {myHotels.map(h => (
                  <option key={h.id} value={h.id} style={{ color: theme.INK }}>{h.name} — {h.city}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{myHotel?.name}</div>
            )}

            {myHotel && (
              <>
                {myHotels.length === 1 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{myHotel.city}, {myHotel.state}</div>}
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: myHotel.available ? "#4ade80" : "#f87171" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{myHotel.available ? "Live" : "Paused"}</span>
                </div>
              </>
            )}

            <Link to="/hotel-portal/add-property" style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 14,
              padding: "10px 12px", textDecoration: "none",
              color: theme.CREAM, background: "rgba(255,255,255,0.12)",
              fontSize: 13, borderRadius: 2, border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <PlusCircle size={16} /> Add Another Property
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "24px 16px" }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", marginBottom: 4, textDecoration: "none",
                color: active ? theme.CREAM : "rgba(255,255,255,0.6)",
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                fontSize: 14, borderRadius: 2, transition: "all 0.2s",
              }}>
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </Link>
            );
          })}

          {myHotel && (
            <a href={`/hotels/${myHotel.id}`} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", marginTop: 8, textDecoration: "none",
              color: "rgba(255,255,255,0.5)", fontSize: 13, borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <ExternalLink size={16} /> View Live Listing
            </a>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{user?.user_metadata?.full_name || user?.email}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{user?.email}</div>
          <button onClick={handleSignOut} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.6)", padding: "8px 16px", fontSize: 12,
            cursor: "pointer", width: "100%", fontFamily: "Inter, sans-serif",
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 260, flex: 1, padding: "40px 40px" }}>
        {children}
      </main>
    </div>
  );
}