import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAdmin } from "../../context/AdminContext.jsx";
import { theme } from "../../lib/theme.js";
import { LayoutDashboard, Hotel, CalendarCheck, Users, BarChart3, LogOut, Sparkles, ChevronRight } from "lucide-react";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { path: "/admin/hotels", label: "Hotels", icon: Hotel, adminOnly: false },
  { path: "/admin/bookings", label: "Bookings", icon: CalendarCheck, adminOnly: false },
  { path: "/admin/owners", label: "Owners", icon: Users, adminOnly: true },
  { path: "/admin/pending", label: "Pending", icon: Hotel, adminOnly: true },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3, adminOnly: true },
];

export default function AdminLayout({ children, requireSuper = false }) {
  const { user, signOut } = useAuth();
  const { role, isAdmin, isHotelAdmin, loading } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: theme.MUTED }}><div className="serif" style={{ fontSize: 28 }}>Loading…</div></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isHotelAdmin) return <Navigate to="/admin/login" replace />;
  if (requireSuper && !isAdmin) return <div style={{ padding: 80, textAlign: "center" }}><h2 className="serif" style={{ fontSize: 36, color: "#a33" }}>Access Denied</h2></div>;

  const handleSignOut = async () => { await signOut(); navigate("/admin/login"); };
  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F5F0" }}>
      <aside style={{ width: 260, background: theme.INK, color: theme.CREAM, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
        <div style={{ padding: "32px 24px", borderBottom: "1px solid #2A3835" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: theme.CREAM }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center" }}><Sparkles size={16} /></div>
            <div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>My Space</div>
              <div style={{ fontSize: 8, letterSpacing: "0.3em", color: theme.SEA, marginTop: 2 }}>{isAdmin ? "SUPER ADMIN" : "HOTEL ADMIN"}</div>
            </div>
          </Link>
        </div>
        <nav style={{ flex: 1, padding: "24px 16px" }}>
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 4, textDecoration: "none", color: active ? theme.CREAM : "#8A9994", background: active ? theme.SEA_DEEP : "transparent", fontSize: 14, borderRadius: 2, transition: "all 0.2s" }}>
                <item.icon size={18} />{item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "20px 24px", borderTop: "1px solid #2A3835" }}>
          <div style={{ fontSize: 12, color: "#8A9994", marginBottom: 4 }}>{user?.email}</div>
          <div style={{ fontSize: 11, color: theme.SEA, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>{role}</div>
          <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #3A4845", color: "#8A9994", padding: "8px 16px", fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "Inter, sans-serif" }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 260, flex: 1, padding: "40px 40px" }}>{children}</main>
    </div>
  );
}