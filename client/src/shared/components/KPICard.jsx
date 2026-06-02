const t = { SAND: "#F0EAE0", MUTED: "#6B7670", INK: "#15201E" };
export default function KPICard({ label, value, icon: Icon, color = "#2E8B7F", trend, sublabel }) {
  return (
    <div style={{ background: "#fff", padding: 24, border: `1px solid ${t.SAND}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: t.MUTED, textTransform: "uppercase" }}>{label}</div>
        {Icon && <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}15`, display: "grid", placeItems: "center" }}><Icon size={18} color={color} /></div>}
      </div>
      <div className="serif" style={{ fontSize: 32, fontWeight: 500, color: t.INK, lineHeight: 1.2 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: t.MUTED, marginTop: 4 }}>{sublabel}</div>}
      {trend && <div style={{ marginTop: 8, fontSize: 12, color: trend.startsWith("-") ? "#a33" : color, fontWeight: 500 }}>{trend}</div>}
    </div>
  );
}
