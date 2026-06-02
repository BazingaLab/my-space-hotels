import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { TrendingUp, CalendarCheck, Hotel, Users } from "lucide-react";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics().then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = analytics ? [
    { label: "Total Revenue", value: `₹${Number(analytics.summary.totalRevenue).toLocaleString("en-IN")}`, icon: TrendingUp, color: theme.SEA },
    { label: "Total Bookings", value: analytics.summary.totalBookings, icon: CalendarCheck, color: "#7C6AF5" },
    { label: "Total Hotels", value: analytics.summary.totalHotels, icon: Hotel, color: "#F5A623" },
    { label: "Avg Nights", value: analytics.summary.avgNights, icon: Users, color: "#E87C4E" },
  ] : [];

  return (
    <AdminLayout requireSuper>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Overview</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Dashboard</h1>
      </div>
      {loading ? <div style={{ color: theme.MUTED }}>Loading analytics…</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: "#fff", padding: 28, border: `1px solid ${theme.SAND}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${s.color}15`, display: "grid", placeItems: "center" }}><s.icon size={18} color={s.color} /></div>
                </div>
                <div className="serif" style={{ fontSize: 36, fontWeight: 500 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", padding: 32, border: `1px solid ${theme.SAND}`, marginBottom: 32 }}>
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 28 }}>Revenue — Last 6 Months</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200 }}>
              {analytics.monthlyRevenue.map((m, i) => {
                const max = Math.max(...analytics.monthlyRevenue.map(x => x.revenue)) || 1;
                const h = max > 0 ? (m.revenue / max) * 160 : 4;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, color: theme.MUTED }}>₹{(m.revenue / 1000).toFixed(0)}k</div>
                    <div style={{ width: "100%", height: h, background: theme.SEA, borderRadius: 2, minHeight: 4 }} />
                    <div style={{ fontSize: 11, color: theme.MUTED, textAlign: "center" }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "#fff", padding: 32, border: `1px solid ${theme.SAND}` }}>
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 24 }}>Hotels by Revenue</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}` }}>
                {["Hotel", "City", "Bookings", "Revenue"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {analytics.bookingsPerHotel.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 500 }}>{h.name}</td>
                    <td style={{ padding: "14px 16px", color: theme.MUTED }}>{h.city}</td>
                    <td style={{ padding: "14px 16px" }}>{h.bookings}</td>
                    <td style={{ padding: "14px 16px" }} className="serif">₹{Number(h.revenue).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}