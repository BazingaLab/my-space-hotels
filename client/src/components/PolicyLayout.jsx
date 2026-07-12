import { Link } from "react-router-dom";
import { theme } from "../lib/theme.js";

export default function PolicyLayout({ eyebrow, title, accent, intro, sections, footer }) {
  return (
    <main style={{ padding: "80px 6vw 100px", background: theme.CREAM }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: theme.MUTED, marginBottom: 32, letterSpacing: "0.05em" }}>
          <Link to="/" style={{ color: theme.MUTED, textDecoration: "none" }}>Home</Link> / <span style={{ color: theme.INK }}>{title}</span>
        </div>

        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 16, textTransform: "uppercase" }}>{eyebrow}</div>
        <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 400, lineHeight: 1.05, marginBottom: 28, color: theme.INK }}>
          {title} {accent && <em style={{ color: theme.SEA }}>{accent}</em>}
        </h1>

        {intro && <p style={{ fontSize: 17, lineHeight: 1.8, color: "#4A5856", marginBottom: 48, fontWeight: 300 }}>{intro}</p>}

        {sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 44 }}>
            <h2 className="serif" style={{ fontSize: 26, fontWeight: 400, marginBottom: 16, color: theme.INK, borderBottom: `1px solid ${theme.SAND}`, paddingBottom: 12 }}>
              {s.heading}
            </h2>
            {s.paragraphs?.map((p, j) => (
              <p key={j} style={{ fontSize: 15, lineHeight: 1.8, color: "#4A5856", marginBottom: 14 }}>{p}</p>
            ))}
            {s.list && (
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
                {s.list.map((item, j) => (
                  <li key={j} style={{ display: "flex", gap: 10, fontSize: 15, color: "#4A5856", lineHeight: 1.7, marginBottom: 10 }}>
                    <span style={{ color: theme.SEA, flexShrink: 0 }}>—</span> {item}
                  </li>
                ))}
              </ul>
            )}
            {s.sub?.map((sub, k) => (
              <div key={k} style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.SEA_DARK, marginBottom: 8 }}>{sub.heading}</h3>
                {sub.paragraphs?.map((p, j) => <p key={j} style={{ fontSize: 15, lineHeight: 1.8, color: "#4A5856", marginBottom: 10 }}>{p}</p>)}
                {sub.list && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
                    {sub.list.map((item, j) => (
                      <li key={j} style={{ display: "flex", gap: 10, fontSize: 14, color: "#4A5856", lineHeight: 1.7, marginBottom: 8 }}>
                        <span style={{ color: theme.SEA, flexShrink: 0 }}>—</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ))}

        <div style={{ marginTop: 60, padding: 36, background: "#fff", border: `1px solid ${theme.SAND}`, textAlign: "center" }}>
          {footer}
        </div>
      </div>
    </main>
  );
}