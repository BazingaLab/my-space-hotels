import { Link } from "react-router-dom";
import logoImg from "../assets/my_space_hotels_logo.png";
import { theme } from "../lib/theme.js";

// Uses the real brand asset — replaces every hand-drawn placeholder icon
// across the app. `chip` wraps the logo in a small white backing card —
// use it on dark backgrounds (hotel-portal sidebar, dark login panels) in
// case the artwork itself isn't designed to sit directly on a dark surface.
// Omit `chip` on light backgrounds (Footer, form panels).
export default function Logo({ to = "/", height = 40, subtitle = null, subtitleColor = theme.SEA, chip = false }) {
  const img = <img src={logoImg} alt="My Space Hotels" style={{ height, width: "auto", display: "block" }} />;
  return (
    <Link to={to} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      {chip ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: "6px 10px", display: "inline-flex", alignItems: "center" }}>{img}</div>
      ) : img}
      {subtitle && (
        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: subtitleColor, textTransform: "uppercase" }}>{subtitle}</div>
      )}
    </Link>
  );
}