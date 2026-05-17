import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminApi } from "../../lib/api.js";
import { useAdmin } from "../../context/AdminContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { theme } from "../../lib/theme.js";

export default function AdminBookings() {
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = isAdmin ? adminApi.getBookings() : adminApi.getOwnerBookings(user.id);
    fetch.then(d => setBookings(d.bookings || [])).finally(() => setLoading(false));
  }, [isAdmin, user]);

  const formatDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const statusColor = s => ({ confirmed: { bg: "#E8F5F3", color: theme.SEA_DARK }, pending: { bg: "#FFF8E6", color: "#A0700A" }, cancelled: { bg: "#FFF0F0", color: "#a33" } }[s] || { bg: theme.SAND, color: theme.MUTED });

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>{isAdmin ? "All Bookings" : "My Hotel Bookings"}</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Bookings <span style={{ fontSize: 24, color: theme.MUTED }}>({bookings.length})</span></h1>
      </div>
      {loading ? <div style={{ color: theme.MUTED }}>Loading…</div> : bookings.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <div className="serif" style={{ fontSize: 28, color: theme.MUTED }}>No bookings yet</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}`, background: theme.SAND }}>
              {["Guest", "Hotel", "Check-in", "Check-out", "Nights", "Guests", "Total", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {bookings.map(b => {
                const sc = statusColor(b.status);
                return (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{b.guest_name}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED }}>{b.guest_email}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 500 }}>{b.hotels?.name || "—"}</td>
                    <td style={{ padding: "14px 16px", color: theme.MUTED }}>{formatDate(b.check_in)}</td>
                    <td style={{ padding: "14px 16px", color: theme.MUTED }}>{formatDate(b.check_out)}</td>
                    <td style={{ padding: "14px 16px" }}>{b.nights}</td>
                    <td style={{ padding: "14px 16px" }}>{b.guests}</td>
                    <td style={{ padding: "14px 16px" }} className="serif">₹{Number(b.total_price).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{b.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}