import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState({});

  const load = () => Promise.all([adminApi.getUsers(), adminApi.getHotels()])
    .then(([u, h]) => { setUsers(u.users || []); setHotels(h.hotels || []); })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handlePromote = async (userId, role) => {
    setPromoting(userId);
    await adminApi.promoteUser({ user_id: userId, role, hotel_id: selectedHotel[userId] || null });
    load();
    setPromoting(null);
  };

  const roleColor = r => ({ super_admin: { bg: "#E8F0FF", color: "#3B5BDB" }, hotel_admin: { bg: "#E8F5F3", color: theme.SEA_DARK }, guest: { bg: theme.SAND, color: theme.MUTED } }[r] || {});

  return (
    <AdminLayout requireSuper>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Manage</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Hotel Owners</h1>
      </div>
      <div style={{ background: "#E8F5F3", border: `1px solid ${theme.SEA}33`, padding: 20, marginBottom: 32, fontSize: 14 }}>
        <strong>How it works:</strong> Users sign up normally on the site. Find them here and promote to <strong>hotel_admin</strong> to give them access to the Hotel Admin dashboard. Assign them a hotel so they only see their own bookings.
      </div>
      {loading ? <div style={{ color: theme.MUTED }}>Loading…</div> : (
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}`, background: theme.SAND }}>
              {["User", "Joined", "Current Role", "Assign Hotel", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map(u => {
                const rc = roleColor(u.role);
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{u.full_name || "—"}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: theme.MUTED, fontSize: 13 }}>
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: rc.bg, color: rc.color, padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <select value={selectedHotel[u.id] || ""} onChange={e => setSelectedHotel({ ...selectedHotel, [u.id]: e.target.value })}
                        style={{ padding: "8px 12px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 13, fontFamily: "Inter, sans-serif", maxWidth: 200 }}>
                        <option value="">Select hotel…</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {u.role !== "hotel_admin" && u.role !== "super_admin" && (
                          <button onClick={() => handlePromote(u.id, "hotel_admin")} disabled={promoting === u.id}
                            style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "8px 14px", fontSize: 12, cursor: "pointer", letterSpacing: "0.1em" }}>
                            {promoting === u.id ? "…" : "Make Admin"}
                          </button>
                        )}
                        {u.role === "hotel_admin" && (
                          <button onClick={() => handlePromote(u.id, "guest")} disabled={promoting === u.id}
                            style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
                            {promoting === u.id ? "…" : "Revoke"}
                          </button>
                        )}
                      </div>
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