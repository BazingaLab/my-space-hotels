const STATUS_STYLES = {
  confirmed: { bg: "#E8F5F3", color: "#1F6B61" }, pending: { bg: "#FFF8E6", color: "#A0700A" },
  cancelled: { bg: "#FFF0F0", color: "#a33" }, completed: { bg: "#E8F0FF", color: "#3B5BDB" },
  open: { bg: "#FFF0F0", color: "#a33" }, in_progress: { bg: "#FFF8E6", color: "#A0700A" },
  resolved: { bg: "#E8F5F3", color: "#1F6B61" }, closed: { bg: "#F0EAE0", color: "#6B7670" },
  low: { bg: "#F0EAE0", color: "#6B7670" }, medium: { bg: "#FFF8E6", color: "#A0700A" },
  high: { bg: "#FFE8DC", color: "#C04A00" }, urgent: { bg: "#FFE0E0", color: "#a33" }, critical: { bg: "#FFE0E0", color: "#a33" },
  super_admin: { bg: "#E8F0FF", color: "#3B5BDB" }, hotel_admin: { bg: "#E8F5F3", color: "#1F6B61" }, guest: { bg: "#F0EAE0", color: "#6B7670" },
  active: { bg: "#E8F5F3", color: "#1F6B61" }, inactive: { bg: "#FFF0F0", color: "#a33" },
  approved: { bg: "#E8F5F3", color: "#1F6B61" }, rejected: { bg: "#FFF0F0", color: "#a33" },
};
export default function StatusBadge({ value, fallback }) {
  if (!value) return fallback || <span style={{ color: "#6B7670" }}>—</span>;
  const s = STATUS_STYLES[String(value).toLowerCase()] || { bg: "#F0EAE0", color: "#6B7670" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" }}>{String(value).replace(/_/g, " ")}</span>;
}
