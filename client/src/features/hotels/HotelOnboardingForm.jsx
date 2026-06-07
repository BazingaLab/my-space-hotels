import { useState } from "react";
import { theme } from "../../lib/theme.js";
import { adminApi } from "../../lib/api.js";
import { Save, Building2, User, FileText, MapPin, Clock, IndianRupee, Landmark, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabase.js";
import { useAuth } from "../../context/AuthContext.jsx";

const HOTEL_TYPES = ["Budget", "Premium", "Resort"];
const TAGS = ["Heritage", "Beachfront", "Luxury", "Boutique", "Mountain", "City"];
const AMENITIES = ["WiFi", "AC", "Parking", "Pool", "Spa", "Restaurant", "Bar", "Gym", "Room Service", "Laundry", "Airport Transfer", "Power Backup", "CCTV", "Elevator"];

const empty = {
  name: "", hotel_type: "Budget", owner_name: "", contact_number: "", owner_email: "",
  gst_number: "", pan_number: "", property_address: "", city: "", state: "", pincode: "",
  google_map_link: "", description: "", short_description: "", checkin_time: "14:00", checkout_time: "11:00",
  amenities: [], rooms: 1, price: 0, tag: "Boutique", cover_image: "", hotel_status: "active",
  agreement_start_date: "", agreement_end_date: "", commission_percent: 0,
  bank_account_name: "", bank_account_number: "", bank_ifsc: "", bank_name: "",
  referred_by_name: "",
};

export default function HotelOnboardingForm({ initial = null, onSaved }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState(initial ? { ...empty, ...initial, ...(initial.bank_details || {}) } : empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  // Upload a cover image to Supabase Storage and store its public URL
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Only image files allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Max file size is 5MB."); return; }
    setUploading(true); setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user?.id || "admin"}/onboarding/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("hotel-photos").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("hotel-photos").getPublicUrl(path);
      set("cover_image", publicUrl);
    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };
  const toggleAmenity = (a) => setF(s => ({ ...s, amenities: s.amenities.includes(a) ? s.amenities.filter(x => x !== a) : [...s.amenities, a] }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setOk(false);
    try {
      const payload = {
        name: f.name, hotel_type: f.hotel_type, owner_name: f.owner_name, contact_number: f.contact_number,
        owner_email: f.owner_email, gst_number: f.gst_number, pan_number: f.pan_number,
        property_address: f.property_address, city: f.city, state: f.state, pincode: f.pincode,
        google_map_link: f.google_map_link, description: f.description, short_description: f.short_description,
        checkin_time: f.checkin_time || null, checkout_time: f.checkout_time || null,
        amenities: f.amenities, rooms: Number(f.rooms), price: Number(f.price), tag: f.tag,
        cover_image: f.cover_image, hotel_status: f.hotel_status,
        agreement_start_date: f.agreement_start_date || null, agreement_end_date: f.agreement_end_date || null,
        commission_percent: Number(f.commission_percent),
        bank_details: { bank_account_name: f.bank_account_name, bank_account_number: f.bank_account_number, bank_ifsc: f.bank_ifsc, bank_name: f.bank_name },
      };
      if (initial?.id) await adminApi.updateHotel(initial.id, payload);
      else await adminApi.createHotel(payload);
      setOk(true);
      if (onSaved) onSaved();
      if (!initial) setF(empty);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const inp = { width: "100%", padding: "11px 14px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 14, color: theme.INK, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };
  const card = { background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28, marginBottom: 20 };
  const sectionTitle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
  const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 };

  const Section = ({ icon: Icon, title, children }) => (
    <div style={card}>
      <div style={sectionTitle}><Icon size={18} color={theme.SEA} /><h3 className="serif" style={{ fontSize: 20, fontWeight: 400 }}>{title}</h3></div>
      {children}
    </div>
  );
  const Field = ({ label, k, type = "text", ph = "", req = false }) => (
    <div><label style={lbl}>{label}{req && " *"}</label><input type={type} required={req} style={inp} placeholder={ph} value={f[k] ?? ""} onChange={e => set(k, e.target.value)} /></div>
  );

  return (
    <form onSubmit={submit}>
      <Section icon={Building2} title="Property Details">
        <div style={{ marginBottom: 16 }}><Field label="Hotel Name" k="name" ph="The Heritage Verandah" req /></div>
        <div style={grid3}>
          <div><label style={lbl}>Hotel Type *</label><select style={inp} value={f.hotel_type} onChange={e => set("hotel_type", e.target.value)}>{HOTEL_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={lbl}>Category Tag</label><select style={inp} value={f.tag} onChange={e => set("tag", e.target.value)}>{TAGS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={lbl}>Status</label><select style={inp} value={f.hotel_status} onChange={e => set("hotel_status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
        <div style={{ ...grid3, marginTop: 16 }}>
          <Field label="Total Rooms" k="rooms" type="number" />
          <Field label="Price / Night (₹)" k="price" type="number" req />
          <div>
            <label style={lbl}>Cover Image</label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div>
                <input id="coverUpload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                <label htmlFor="coverUpload" style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", border: `1px dashed ${theme.SEA}`, background: `${theme.SEA}10`, color: theme.SEA_DARK, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Upload size={15} /> {uploading ? "Uploading…" : "Upload Image"}
                </label>
              </div>
              {f.cover_image ? (
                <img src={f.cover_image} alt="cover" style={{ width: 90, height: 60, objectFit: "cover", border: `1px solid ${theme.SAND}` }} />
              ) : (
                <div style={{ width: 90, height: 60, border: `1px solid ${theme.SAND}`, display: "grid", placeItems: "center", color: theme.MUTED }}><ImageIcon size={20} /></div>
              )}
            </div>
            <input style={{ ...inp, marginTop: 10 }} placeholder="…or paste an image URL" value={f.cover_image || ""} onChange={e => set("cover_image", e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}><Field label="Short Description" k="short_description" /></div>
        <div style={{ marginTop: 16 }}><label style={lbl}>Full Description</label><textarea style={{ ...inp, minHeight: 90, resize: "vertical" }} value={f.description} onChange={e => set("description", e.target.value)} /></div>
      </Section>

      <Section icon={User} title="Owner & Contact">
        <div style={grid2}>
          <Field label="Owner Name" k="owner_name" req />
          <Field label="Contact Number" k="contact_number" ph="+91..." req />
          <Field label="Owner Email" k="owner_email" type="email" />
          <Field label="Referred By" k="referred_by_name" />
        </div>
      </Section>

      <Section icon={FileText} title="Legal & Tax">
        <div style={grid2}>
          <Field label="GST Number" k="gst_number" />
          <Field label="PAN Number" k="pan_number" />
        </div>
      </Section>

      <Section icon={MapPin} title="Location">
        <div style={{ marginBottom: 16 }}><Field label="Property Address" k="property_address" req /></div>
        <div style={grid3}>
          <Field label="City" k="city" req />
          <Field label="State" k="state" req />
          <Field label="Pincode" k="pincode" />
        </div>
        <div style={{ marginTop: 16 }}><Field label="Google Map Link" k="google_map_link" ph="https://maps.google.com/..." /></div>
      </Section>

      <Section icon={Clock} title="Timings & Amenities">
        <div style={grid2}>
          <Field label="Check-in Time" k="checkin_time" type="time" />
          <Field label="Check-out Time" k="checkout_time" type="time" />
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Amenities</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {AMENITIES.map(a => (
              <button type="button" key={a} onClick={() => toggleAmenity(a)} style={{ padding: "7px 14px", border: `1px solid ${f.amenities.includes(a) ? theme.SEA : theme.SAND}`, background: f.amenities.includes(a) ? `${theme.SEA}15` : "transparent", color: f.amenities.includes(a) ? theme.SEA_DARK : theme.INK, fontSize: 13, cursor: "pointer" }}>{a}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={IndianRupee} title="Agreement & Commission">
        <div style={grid3}>
          <Field label="Agreement Start" k="agreement_start_date" type="date" />
          <Field label="Agreement End" k="agreement_end_date" type="date" />
          <Field label="Commission %" k="commission_percent" type="number" />
        </div>
      </Section>

      <Section icon={Landmark} title="Bank Details">
        <div style={grid2}>
          <Field label="Account Holder Name" k="bank_account_name" />
          <Field label="Account Number" k="bank_account_number" />
          <Field label="IFSC Code" k="bank_ifsc" />
          <Field label="Bank Name" k="bank_name" />
        </div>
      </Section>

      {error && <div style={{ color: "#a33", padding: 14, background: "#fff5f5", border: "1px solid #fcc", marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {ok && <div style={{ color: theme.SEA_DARK, padding: 14, background: "#E8F5F3", border: `1px solid ${theme.SEA}33`, marginBottom: 16, fontSize: 13 }}>✓ Hotel saved successfully</div>}

      <button type="submit" disabled={saving} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: "16px 40px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        <Save size={16} /> {saving ? "Saving…" : initial ? "Update Hotel" : "Create Hotel"}
      </button>
    </form>
  );
}