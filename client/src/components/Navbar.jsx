import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { theme } from "../lib/theme.js";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "28px 6vw",
      borderBottom: `1px solid ${theme.SAND}`,
      background: theme.CREAM,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: theme.INK }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", color: theme.CREAM }}>
          <Sparkles size={16} />
        </div>
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: "0.5px" }}>My Space</div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: theme.SEA_DARK, marginTop: 2 }}>HOTELS</div>
        </div>
      </Link>

      <div className="hide-mobile" style={{ display: "flex", gap: 36, fontSize: 13 }}>
        <Link to="/hotels" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Stays</Link>
        <Link to="/hotels" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Destinations</Link>
        <a href="#" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Experiences</a>
        <a href="#" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>Journal</a>
        <a href="#" className="link-underline" style={{ color: theme.INK, textDecoration: "none" }}>About</a>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <a href="#" className="hide-mobile" style={{ fontSize: 13, color: theme.INK, textDecoration: "none" }}>Sign in</a>
        <Link to="/hotels" className="ghost-btn" style={{
          fontSize: 12, padding: "10px 20px", border: `1px solid ${theme.INK}`,
          color: theme.INK, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase",
        }}>Book a Stay</Link>
      </div>
    </nav>
  );
}
