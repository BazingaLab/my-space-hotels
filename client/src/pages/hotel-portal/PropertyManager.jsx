import { useState, useEffect } from "react";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Save, ToggleLeft, ToggleRight, Coffee } from "lucide-react";

const TAGS = ["Heritage", "Beachfront", "Luxury", "Boutique", "Mountain", "City"];
const AMENITIES = ["WiFi", "Pool", "Spa", "Restaurant", "Bar", "Parking", "Gym", "Beach Access", "Room Service", "Laundry", "Airport Transfer", "Pet Friendly", "Fireplace", "Garden", "Rooftop", "Yoga Deck", "Bicycles", "Library", "Trekking", "Boat Tours"];

export default function PropertyManager() {
  const { myHotel, refreshHotel } = useHotelPortal();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (myHotel) {
      setForm({
        ...myHotel,
        amenities: myHotel.amenities || [],
        breakfast_available: myHotel.breakfast_available || false,
        breakfast_price: myHotel.breakfast_price || 0,
      });
    }
  }, [myHotel]);

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try {
      await adminApi.updateHotel(myHotel.id, {
        name: form.name,
        city: form.city,
        state: form.state,
        description: form.description,
        short_description: form.short_description,
        price: Number(form.price),
        rooms: Number(form.rooms),
        tag: form.tag,
        amenities: form.amenities,
        available: form.available,
        breakfast_available: !!form.breakfast_available,
        breakfast_price: Number(form.breakfast_price) || 0,
      });
      await refreshHotel();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = { width: "100%", padding: "12px 16px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 14, color: theme.INK, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" };
  const lbl = { fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 };

  if (!form) return (
    <HotelPortalLayout>
      <div style={{ padding: 40, color: theme.MUTED }}>No property found.</div>
    </HotelPortalLayout>
  );

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Edit</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>My Property</h1>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* Main form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Basic info */}
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32 }}>
              <h2 className="serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 24 }}>Basic Information</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={lbl}>Property Name</label>
                  <input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={lbl}>City</label>
                    <input style={inp} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>State</label>
                    <input style={inp} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Property Type</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {TAGS.map(t => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, tag: t })} style={{
                        padding: "8px 18px", border: `1px solid ${form.tag === t ? theme.INK : theme.SAND}`,
                        background: form.tag === t ? theme.INK : "transparent",
                        color: form.tag === t ? theme.CREAM : theme.INK,
                        fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Short Description</label>
                  <input style={inp} value={form.short_description || ""} onChange={e => setForm({ ...form, short_description: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Full Description</label>
                  <textarea style={{ ...inp, minHeight: 140, resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32 }}>
              <h2 className="serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 20 }}>Amenities</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {AMENITIES.map(a => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                    padding: "8px 16px", border: `1px solid ${form.amenities.includes(a) ? theme.SEA : theme.SAND}`,
                    background: form.amenities.includes(a) ? `${theme.SEA}15` : "transparent",
                    color: form.amenities.includes(a) ? theme.SEA_DARK : theme.INK,
                    fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                  }}>{a}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 12 }}>{form.amenities.length} amenities selected</div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Availability toggle */}
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24 }}>
              <h3 className="serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 16 }}>Availability</h3>
              <button type="button" onClick={() => setForm({ ...form, available: !form.available })} style={{
                width: "100%", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: form.available ? "#E8F5F3" : "#FFF0F0",
                border: `1px solid ${form.available ? theme.SEA + "33" : "#fcc"}`,
                cursor: "pointer", fontSize: 14, color: form.available ? theme.SEA_DARK : "#a33",
              }}>
                <span style={{ fontWeight: 600 }}>{form.available ? "● Live — Accepting bookings" : "● Paused — Not accepting"}</span>
                {form.available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
              <p style={{ fontSize: 12, color: theme.MUTED, marginTop: 10, lineHeight: 1.6 }}>
                Pause your listing temporarily without losing your page or reviews.
              </p>
            </div>

            {/* Pricing */}
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24 }}>
              <h3 className="serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 16 }}>Pricing</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Price per Night (₹)</label>
                <input type="number" min="500" style={inp} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div style={{ marginBottom: form.breakfast_available ? 16 : 0 }}>
                <label style={lbl}>Number of Rooms</label>
                <input type="number" min="1" style={inp} value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} />
              </div>

              <div style={{ paddingTop: 16, borderTop: `1px solid ${theme.SAND}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.breakfast_available ? 14 : 0 }}>
                  <input type="checkbox" id="breakfastToggle" checked={form.breakfast_available} onChange={e => setForm({ ...form, breakfast_available: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <label htmlFor="breakfastToggle" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <Coffee size={14} color={theme.SEA} /> Offer Room + Breakfast
                  </label>
                </div>
                {form.breakfast_available && (
                  <div>
                    <label style={lbl}>Breakfast Price (₹ / night)</label>
                    <input type="number" min="0" style={inp} value={form.breakfast_price} onChange={e => setForm({ ...form, breakfast_price: e.target.value })} placeholder="e.g. 300" />
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <div>
              {error && <div style={{ color: "#a33", padding: 12, background: "#fff5f5", border: "1px solid #fcc", fontSize: 13, marginBottom: 12 }}>{error}</div>}
              {saved && <div style={{ color: theme.SEA_DARK, padding: 12, background: "#E8F5F3", border: `1px solid ${theme.SEA}33`, fontSize: 13, marginBottom: 12 }}>✓ Changes saved!</div>}
              <button type="submit" disabled={saving} className="cta-btn" style={{
                width: "100%", background: theme.SEA_DEEP, color: theme.CREAM, border: "none",
                padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
                <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </HotelPortalLayout>
  );
}