import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminHotels() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => adminApi.getHotels().then(d => setHotels(d.hotels || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hotel? This cannot be undone.")) return;
    await adminApi.deleteHotel(id); load();
  };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Manage</div>
          <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Hotels</h1>
        </div>
        <button onClick={() => navigate("/admin/hotels/new")} className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "14px 24px", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={16} /> Add Hotel
        </button>
      </div>

      {loading ? <div style={{ color: theme.MUTED }}>Loading…</div> : (
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}`, background: theme.SAND }}>
              {["Hotel", "Location", "Price", "Rating", "Tag", "Featured", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {hotels.map(h => (
                <tr key={h.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img src={h.cover_image} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 2 }} />
                      <div style={{ fontWeight: 500, maxWidth: 180 }}>{h.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: theme.MUTED }}>{h.city}, {h.state}</td>
                  <td style={{ padding: "14px 16px" }} className="serif">₹{Number(h.price).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "14px 16px" }}>⭐ {h.rating}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ background: theme.SAND, padding: "4px 10px", fontSize: 11, letterSpacing: "0.1em" }}>{h.tag}</span></td>
                  <td style={{ padding: "14px 16px" }}>{h.featured ? "✓" : "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => navigate(`/admin/hotels/${h.id}/edit`, { state: { hotel: h } })} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 10px", cursor: "pointer", color: theme.SEA_DARK }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(h.id)} style={{ background: "transparent", border: "1px solid #fcc", padding: "6px 10px", cursor: "pointer", color: "#a33" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}