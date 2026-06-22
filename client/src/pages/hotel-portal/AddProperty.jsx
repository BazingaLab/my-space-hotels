import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { pendingApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Building2, Send, CheckCircle2 } from "lucide-react";

const TAGS = ["Heritage", "Beachfront", "Luxury", "Boutique", "Mountain", "City"];

export default function AddProperty() {
  const { user } = useAuth();
  const { refreshHotel } = useHotelPortal();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", city: "", state: "", description: "", short_description: "",
    price: "", rooms: 1, tag: "Boutique", cover_image: "",
    contact_number: "", property_address: "", pincode: "", google_map_link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.name || !form.city) { setError("Property name and city are required."); return; }
    setSubmitting(true);
    try {
      await pendingApi.submit({
        ...form,
        price: Number(form.price) || 0,
        rooms: Number(form.rooms) || 1,
        owner_id: user.id,
        owner_email: user.email,
        owner_name: user.user_metadata?.full_name || "",
        status: "pending",
      });
      setDone(true);
      refreshHotel();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif", background: "#fff" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };

  if (done) return (
    <HotelPortalLayout>
      <div style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}`, padding: 48 }}>
        <CheckCircle2 size={56} color={theme.SEA} style={{ marginBottom: 20 }} />
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>Property Submitted</h1>
        <p style={{ color: theme.MUTED, lineHeight: 1.7, marginBottom: 28 }}>
          Your new property has been sent for review. Our team will verify the details and approve it — usually within 48 hours. Once approved, it'll appear in your portal automatically.
        </p>
        <button onClick={() => navigate("/hotel-portal")} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: "14px 28px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
          Back to Dashboard
        </button>
      </div>
    </HotelPortalLayout>
  );

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Expand</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Add a Property</h1>
        <p style={{ color: theme.MUTED, marginTop: 8 }}>Submit a new property to add to your portfolio. Our team reviews each submission before it goes live.</p>
      </div>

      <div style={{ maxWidth: 720, background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>Property Name *</label><input style={inp} value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div><label style={lbl}>Tag</label><select style={inp} value={form.tag} onChange={e => set("tag", e.target.value)}>{TAGS.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>City *</label><input style={inp} value={form.city} onChange={e => set("city", e.target.value)} /></div>
            <div><label style={lbl}>State</label><input style={inp} value={form.state} onChange={e => set("state", e.target.value)} /></div>
          </div>

          <div><label style={lbl}>Short Description</label><input style={inp} value={form.short_description} onChange={e => set("short_description", e.target.value)} placeholder="One-line summary" /></div>
          <div><label style={lbl}>Full Description</label><textarea style={{ ...inp, minHeight: 90 }} value={form.description} onChange={e => set("description", e.target.value)} /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>Price / night (₹)</label><input type="number" style={inp} value={form.price} onChange={e => set("price", e.target.value)} /></div>
            <div><label style={lbl}>Rooms</label><input type="number" style={inp} value={form.rooms} onChange={e => set("rooms", e.target.value)} /></div>
          </div>

          <div><label style={lbl}>Cover Image URL</label><input style={inp} value={form.cover_image} onChange={e => set("cover_image", e.target.value)} placeholder="https://… (you can add more photos after approval)" /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>Contact Number</label><input style={inp} value={form.contact_number} onChange={e => set("contact_number", e.target.value)} /></div>
            <div><label style={lbl}>Pincode</label><input style={inp} value={form.pincode} onChange={e => set("pincode", e.target.value)} /></div>
          </div>

          <div><label style={lbl}>Property Address</label><input style={inp} value={form.property_address} onChange={e => set("property_address", e.target.value)} /></div>
          <div><label style={lbl}>Google Maps Link</label><input style={inp} value={form.google_map_link} onChange={e => set("google_map_link", e.target.value)} /></div>

          {error && <div style={{ color: "#a33", fontSize: 13, padding: 12, background: "#fff5f5", border: "1px solid #fcc" }}>{error}</div>}

          <button onClick={submit} disabled={submitting} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
            <Send size={16} /> {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </div>
    </HotelPortalLayout>
  );
}