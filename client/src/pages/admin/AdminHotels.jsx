import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const emptyHotel = { name: "", city: "", state: "", description: "", short_description: "", cover_image: "", price: "", rating: "", review_count: 0, tag: "Boutique", amenities: "", rooms: 1, featured: false, available: true };

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyHotel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => adminApi.getHotels().then(d => setHotels(d.hotels || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyHotel); setEditing(null); setShowForm(true); setError(null); };
  const openEdit = (h) => { setForm({ ...h, amenities: (h.amenities || []).join(", ") }); setEditing(h.id); setShowForm(true); setError(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = { ...form, price: Number(form.price), rating: Number(form.rating), rooms: Number(form.rooms), review_count: Number(form.review_count), amenities: form.amenities.split(",").map(a => a.trim()).filter(Boolean) };
    try {
      if (editing) { await adminApi.updateHotel(editing, payload); }
      else { await adminApi.createHotel(payload); }
      setShowForm(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hotel? This cannot be undone.")) return;
    await adminApi.deleteHotel(id); load();
  };

  const tags = ["Heritage", "Beachfront", "Luxury", "Boutique", "Mountain", "City"];
  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" };
  const lbl = { fontSize: 11, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Manage</div>
          <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Hotels</h1>
        </div>
        <button onClick={openAdd} className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "14px 24px", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={16} /> Add Hotel
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000066", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: theme.CREAM, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h2 className="serif" style={{ fontSize: 32, fontWeight: 400 }}>{editing ? "Edit Hotel" : "Add Hotel"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Hotel Name *</label><input required style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label style={lbl}>City *</label><input required style={inp} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                <div><label style={lbl}>State *</label><input required style={inp} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
                <div><label style={lbl}>Price / Night (₹) *</label><input required type="number" style={inp} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div><label style={lbl}>Rating (0-5)</label><input type="number" step="0.1" min="0" max="5" style={inp} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></div>
                <div><label style={lbl}>Rooms</label><input type="number" style={inp} value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} /></div>
                <div><label style={lbl}>Tag</label>
                  <select style={inp} value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}>
                    {tags.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Cover Image URL *</label><input required style={inp} value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })} /></div>
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Short Description</label><input style={inp} value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} /></div>
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Full Description *</label><textarea required style={{ ...inp, minHeight: 100, resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Amenities (comma separated)</label><input style={inp} placeholder="Pool, WiFi, Spa, Restaurant" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                  <label htmlFor="featured" style={{ fontSize: 14 }}>Featured hotel</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="available" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                  <label htmlFor="available" style={{ fontSize: 14 }}>Available for booking</label>
                </div>
              </div>
              {error && <div style={{ color: "#a33", padding: 12, background: "#fff5f5", border: "1px solid #fcc", fontSize: 13 }}>{error}</div>}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={saving} className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "14px 28px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <Check size={16} /> {saving ? "Saving…" : "Save Hotel"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: "transparent", border: `1px solid ${theme.INK}`, padding: "14px 28px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hotels table */}
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
                      <button onClick={() => openEdit(h)} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 10px", cursor: "pointer", color: theme.SEA_DARK }}><Pencil size={14} /></button>
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