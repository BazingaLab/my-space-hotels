import { Link } from "react-router-dom";
import logoImg from "../assets/my_space_hotels_logo.png";
import { theme } from "../lib/theme.js";

// Uses the real brand asset — replaces the generic Sparkles-icon placeholder
// that Footer.jsx, Login.jsx, and HotelPortalLayout.jsx were each using.
export default function Logo({ to = "/", height = 40, subtitle = null, subtitleColor = theme.SEA }) {
  return (
    <Link to={to} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <img src={logoImg} alt="My Space Hotels" style={{ height, width: "auto", display: "block" }} />
      {subtitle && (
        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: subtitleColor, textTransform: "uppercase" }}>{subtitle}</div>
      )}
    </Link>
  );
}