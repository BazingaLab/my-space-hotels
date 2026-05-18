import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, User, LogOut, ChevronDown, LayoutDashboard, Building2 } from "lucide-react";
import { theme } from "../lib/theme.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAdmin } from "../context/AdminContext.jsx";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin, isHotelAdmin } = useAdmin();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Account";

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "28px 6vw", borderBottom: `1px solid ${theme.SAND}`,
      background: theme.CREAM, position: "sticky", top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: theme.INK }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", color: theme.CREAM }}>
          <Sparkles size={16} />
        </div>
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: "0.5px" }}>My Space</div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: theme.SEA_DARK, marginTop: 2 }}>HOTELS</div>
        </div>
      </Link>

      {/* Nav links */}
      <div className="hide-mobile" style={{ display: "flex", gap: 36, fontSize: 13 }}>
        <Link to="/hotels" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Stays</Link>
        <Link to="/hotels" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Destinations</Link>
        <a href="#" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Experiences</a>
        <a href="#" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Journal</a>
        {/* Always show List Property */}
        <Link to="/list-property" className="link-underline" style={{ color: theme.SEA_DARK, textDecoration: "none", fontWeight: 500 }}>
          List Property
        </Link>
      </div>

      {/* Auth section */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "transparent", border: `1px solid ${theme.SAND}`,
                padding: "8px 16px", cursor: "pointer", fontSize: 13,
                color: theme.INK, fontFamily: "Inter, sans-serif",
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", color: theme.CREAM }}>
                <User size={14} />
              </div>
              {displayName}
              <ChevronDown size={14} style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }} />
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                background: "#fff", border: `1px solid ${theme.SAND}`,
                boxShadow: "0 12px 40px rgba(0,0,0,0.1)", minWidth: 220, zIndex: 200,
              }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.SAND}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.user_metadata?.full_name || "Guest"}</div>
                  <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{user?.email}</div>
                  {isHotelAdmin && (
                    <div style={{ fontSize: 10, color: theme.SEA, marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {isAdmin ? "Super Admin" : "Hotel Admin"}
                    </div>
                  )}
                </div>

                {/* My Bookings — for regular users */}
                <Link to="/my-bookings" onClick={() => setDropdownOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", textDecoration: "none", color: theme.INK, fontSize: 13, borderBottom: `1px solid ${theme.SAND}` }}>
                  My Bookings
                </Link>

                {/* List Property — always visible */}
                <Link to="/list-property" onClick={() => setDropdownOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", textDecoration: "none", color: theme.INK, fontSize: 13, borderBottom: `1px solid ${theme.SAND}` }}>
                  <Building2 size={14} /> List Your Property
                </Link>

                {/* Hotel Admin Dashboard — only for hotel admins */}
                {isHotelAdmin && (
                  <Link to="/admin/my-dashboard" onClick={() => setDropdownOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", textDecoration: "none", color: theme.SEA_DARK, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${theme.SAND}` }}>
                    <LayoutDashboard size={14} /> Hotel Dashboard
                  </Link>
                )}

                {/* Super Admin — only for super admins */}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", textDecoration: "none", color: theme.SEA_DARK, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${theme.SAND}` }}>
                    <LayoutDashboard size={14} /> Super Admin
                  </Link>
                )}

                <button onClick={handleSignOut}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#a33", fontFamily: "Inter, sans-serif" }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="hide-mobile link-underline" style={{ fontSize: 13, color: theme.INK, textDecoration: "none" }}>
              Sign in
            </Link>
            <Link to="/signup" className="ghost-btn" style={{
              fontSize: 12, padding: "10px 20px", border: `1px solid ${theme.INK}`,
              color: theme.INK, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Join Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}