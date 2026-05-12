import { Sparkles, ArrowRight, Instagram, Facebook, Twitter } from "lucide-react";
import { theme } from "../lib/theme.js";

export default function Footer() {
  const cols = [
    { title: "Discover", links: ["All Stays", "Destinations", "Experiences", "Gift Cards"] },
    { title: "Company", links: ["Our Story", "Press", "Careers", "Sustainability"] },
    { title: "Support", links: ["Help Centre", "Contact", "Cancellations", "Trust & Safety"] },
  ];

  return (
    <footer style={{ background: theme.INK, color: theme.CREAM, padding: "80px 6vw 32px" }}>
      <div className="grid-1-mobile" style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1.2fr",
        gap: 60, paddingBottom: 60, borderBottom: "1px solid #2A3835",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center" }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1 }}>My Space</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: theme.SEA, marginTop: 2 }}>HOTELS</div>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#8A9994", maxWidth: 280, fontWeight: 300 }}>
            A curated collection of independent hotels and retreats, chosen for their soul, not their stars.
          </p>
        </div>

        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 11, letterSpacing: "0.25em", color: theme.SEA, textTransform: "uppercase", marginBottom: 24, fontWeight: 600 }}>{col.title}</div>
            {col.links.map(l => (
              <a key={l} href="#" className="link-underline" style={{ display: "block", color: "#C8D4D1", fontSize: 13, marginBottom: 14, textDecoration: "none", width: "fit-content" }}>{l}</a>
            ))}
          </div>
        ))}

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: theme.SEA, textTransform: "uppercase", marginBottom: 24, fontWeight: 600 }}>Stay in touch</div>
          <p style={{ fontSize: 13, color: "#8A9994", marginBottom: 18, lineHeight: 1.6, fontWeight: 300 }}>Quiet missives — a postcard once a month, never more.</p>
          <div style={{ display: "flex", borderBottom: "1px solid #3A4845", paddingBottom: 8, marginBottom: 24 }}>
            <input placeholder="your@email.com" style={{ background: "transparent", border: "none", outline: "none", color: theme.CREAM, fontSize: 13, flex: 1 }} />
            <button style={{ background: "transparent", border: "none", color: theme.SEA, cursor: "pointer" }}><ArrowRight size={16} /></button>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="ghost-btn" style={{ width: 36, height: 36, border: "1px solid #3A4845", display: "grid", placeItems: "center", color: "#C8D4D1", textDecoration: "none" }}><Icon size={14} /></a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 32, fontSize: 12, color: "#6B7670", flexWrap: "wrap", gap: 12 }}>
        <div>© 2026 My Space Hotels — Crafted with care in India.</div>
        <div style={{ display: "flex", gap: 28 }}>
          <a href="#" style={{ color: "#6B7670", textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ color: "#6B7670", textDecoration: "none" }}>Terms</a>
          <a href="#" style={{ color: "#6B7670", textDecoration: "none" }}>Cookies</a>
        </div>
      </div>
    </footer>
  );
}
