import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { pendingApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Building2, Send, CheckCircle2, Upload, Image as ImageIcon, Coffee, Clock, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase.js";
import AddressInput from "../../shared/components/AddressInput.jsx";

const TAGS = ["Heritage", "Beachfront", "Boutique", "Hotel", "Resort", "BnB"];
// Same amenity list used on ListProperty.jsx / PropertyManager.jsx — kept
// identical across every creation surface so a property looks the same
// regardless of which form an owner used to add it.
const AMENITIES = ["WiFi", "Pool", "Spa", "Restaurant", "Bar", "Parking", "Gym", "Beach Access", "Room Service", "Laundry", "Airport Transfer", "Pet Friendly", "Fireplace", "Garden", "Rooftop", "Yoga Deck", "Bicycles", "Library", "Trekking", "Boat Tours"];

export default function AddProperty() {
  const { user } = useAuth();
  const { refreshHotel } = useHotelPortal();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", city: "", state: "", description: "", short_description: "",
    price: "", rooms: 1, tag: "Boutique", cover_image: "",
    contact_number: "", property_address: "", pincode: "", google_map_link: "",
    // AddressInput reads these — previously undefined, which made those
    // fields start uncontrolled and flip to controlled on first keystroke.
    // Initializing them here as empty strings fixes that.
    building: "", street: "", landmark: "", post_office: "", district: "",
    amenities: [],
    bedrooms: 1, beds: 1, bathrooms: 1, max_guests: 4, house_rules: "",
    free_cancellation_hours: 24,
    breakfast_available: false, breakfast_price: "",
    hourly_available: false, hourly_price_4h: "", hourly_price_6h: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const uploadCover = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Only image files allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Max file size is 5MB."); return; }
    setUploading(true); setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/new-property/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("hotel-photos").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("hotel-photos").getPublicUrl(path);
      set("cover_image", publicUrl);
    } catch (e) {
      setError(`Image upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!form.name || !form.city) { setError("Property name and city are required."); return; }
    setSubmitting(true);
    try {
      await pendingApi.submit({
        ...form,
        price: Number(form.price) || 0,
        rooms: Number(form.rooms) || 1,
        bedrooms: Number(form.bedrooms) || 1,
        beds: Number(form.beds) || 1,
        bathrooms: Number(form.bathrooms) || 1,
        max_guests: Number(form.max_guests) || 1,
        house_rules: form.house_rules || null,
        // Falls back to 24 if left blank — the same default used across
        // every other creation form, so a property's cancellation window
        // is never genuinely undefined regardless of which form made it.
        free_cancellation_hours: Number(form.free_cancellation_hours) || 24,
        breakfast_available: !!form.breakfast_available,
        breakfast_price: form.breakfast_available ? Number(form.breakfast_price) || 0 : 0,
        hourly_available: !!form.hourly_available,
        hourly_price_4h: form.hourly_available ? Number(form.hourly_price_4h) || 0 : 0,
        hourly_price_6h: form.hourly_available ? Number(form.hourly_price_6h) || 0 : 0,
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

          {/* Room details — same five fields as every other creation form,
              so a second property added here works identically to one
              added via the main onboarding form or ListProperty.jsx. */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>Bedrooms</label><input type="number" min="0" style={inp} value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} /></div>
            <div><label style={lbl}>Beds</label><input type="number" min="0" style={inp} value={form.beds} onChange={e => set("beds", e.target.value)} /></div>
            <div><label style={lbl}>Bathrooms</label><input type="number" min="0" style={inp} value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} /></div>
            <div><label style={lbl}>Max Guests</label><input type="number" min="1" style={inp} value={form.max_guests} onChange={e => set("max_guests", e.target.value)} /></div>
          </div>

          <div><label style={lbl}>Short Description</label><input style={inp} value={form.short_description} onChange={e => set("short_description", e.target.value)} placeholder="One-line summary" /></div>
          <div><label style={lbl}>Full Description</label><textarea style={{ ...inp, minHeight: 90 }} value={form.description} onChange={e => set("description", e.target.value)} /></div>
          <div>
            <label style={lbl}>House Rules (optional)</label>
            <textarea style={{ ...inp, minHeight: 70 }} placeholder="e.g. No smoking indoors, quiet hours after 10pm" value={form.house_rules} onChange={e => set("house_rules", e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Amenities</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AMENITIES.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                  padding: "7px 14px", border: `1px solid ${form.amenities.includes(a) ? theme.SEA : theme.SAND}`,
                  background: form.amenities.includes(a) ? `${theme.SEA}15` : "transparent",
                  color: form.amenities.includes(a) ? theme.SEA_DARK : theme.INK,
                  fontSize: 13, cursor: "pointer",
                }}>{a}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>Price / night (₹)</label><input type="number" style={inp} value={form.price} onChange={e => set("price", e.target.value)} /></div>
            <div><label style={lbl}>Rooms</label><input type="number" style={inp} value={form.rooms} onChange={e => set("rooms", e.target.value)} /></div>
          </div>

          {/* Cancellation window — its own card, matching the treatment
              this got in ListProperty.jsx and the owner/admin edit forms. */}
          <div style={{ padding: 18, border: `1px solid ${theme.SAND}`, background: theme.CREAM }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <ShieldCheck size={15} color={theme.SEA} />
              <label style={{ ...lbl, marginBottom: 0 }}>Free Cancellation Window</label>
            </div>
            <div style={{ maxWidth: 220 }}>
              <label style={lbl}>Hours before check-in</label>
              <input type="number" min="0" style={inp} placeholder="24" value={form.free_cancellation_hours} onChange={e => set("free_cancellation_hours", e.target.value)} />
            </div>
          </div>

          {/* Breakfast add-on — same toggle-plus-price pattern used
              everywhere else this feature appears. */}
          <div style={{ padding: 18, border: `1px solid ${theme.SAND}`, background: theme.CREAM }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.breakfast_available ? 12 : 0 }}>
              <input type="checkbox" id="ap_breakfast" checked={form.breakfast_available} onChange={e => set("breakfast_available", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <label htmlFor="ap_breakfast" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <Coffee size={15} color={theme.SEA} /> Offer a "Room + Breakfast" option
              </label>
            </div>
            {form.breakfast_available && (
              <div style={{ maxWidth: 220 }}>
                <label style={lbl}>Breakfast Surcharge (₹ / night)</label>
                <input type="number" min="0" style={inp} placeholder="e.g. 300" value={form.breakfast_price} onChange={e => set("breakfast_price", e.target.value)} />
              </div>
            )}
          </div>

          {/* Hourly bookings — same toggle-plus-two-prices pattern. */}
          <div style={{ padding: 18, border: `1px solid ${theme.SAND}`, background: theme.CREAM }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.hourly_available ? 12 : 0 }}>
              <input type="checkbox" id="ap_hourly" checked={form.hourly_available} onChange={e => set("hourly_available", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <label htmlFor="ap_hourly" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <Clock size={15} color={theme.SEA} /> Offer hourly / short-stay bookings
              </label>
            </div>
            {form.hourly_available && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 360 }}>
                <div><label style={lbl}>4-Hour Price (₹)</label><input type="number" min="0" style={inp} placeholder="e.g. 800" value={form.hourly_price_4h} onChange={e => set("hourly_price_4h", e.target.value)} /></div>
                <div><label style={lbl}>6-Hour Price (₹)</label><input type="number" min="0" style={inp} placeholder="e.g. 1200" value={form.hourly_price_6h} onChange={e => set("hourly_price_6h", e.target.value)} /></div>
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Cover Image</label>
            <div
              onClick={() => document.getElementById("coverDrop").click()}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(false); }}
              onDrop={e => { e.preventDefault(); setIsDragging(false); uploadCover(e.dataTransfer.files?.[0]); }}
              style={{
                border: `2px dashed ${isDragging ? theme.SEA : theme.SAND}`,
                background: isDragging ? `${theme.SEA}10` : "#fff",
                padding: 24, textAlign: "center", cursor: "pointer",
                transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 16,
                justifyContent: form.cover_image ? "flex-start" : "center",
              }}
            >
              <input id="coverDrop" type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadCover(e.target.files?.[0])} />
              {form.cover_image ? (
                <img src={form.cover_image} alt="cover" style={{ width: 90, height: 60, objectFit: "cover", border: `1px solid ${theme.SAND}` }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${theme.SEA}15`, display: "grid", placeItems: "center" }}>
                  {uploading ? <div style={{ width: 20, height: 20, border: `2px solid ${theme.SEA}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Upload size={20} color={theme.SEA} />}
                </div>
              )}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: isDragging ? theme.SEA_DARK : theme.INK }}>
                  {uploading ? "Uploading…" : isDragging ? "Drop image here" : form.cover_image ? "Image added — click to replace" : "Click or drag & drop cover image"}
                </div>
                <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>JPG, PNG, WebP · Max 5MB</div>
              </div>
            </div>
            <input style={{ ...inp, marginTop: 10 }} value={form.cover_image} onChange={e => set("cover_image", e.target.value)} placeholder="…or paste an image URL" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={lbl}>Contact Number</label><input style={inp} value={form.contact_number} onChange={e => set("contact_number", e.target.value)} /></div>
          </div>

          <AddressInput
            required
            value={{ building: form.building, street: form.street, landmark: form.landmark, pincode: form.pincode, post_office: form.post_office, city: form.city, district: form.district, state: form.state }}
            onChange={addr => setForm(f => ({ ...f, ...addr }))}
          />
          <div><label style={lbl}>Google Maps Link</label><input style={inp} value={form.google_map_link} onChange={e => set("google_map_link", e.target.value)} /></div>

          {error && <div style={{ color: "#a33", fontSize: 13, padding: 12, background: "#fff5f5", border: "1px solid #fcc" }}>{error}</div>}

          <button onClick={submit} disabled={submitting} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
            <Send size={16} /> {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </HotelPortalLayout>
  );
}