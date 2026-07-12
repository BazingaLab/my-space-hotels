import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { pendingApi } from "../lib/api.js";
import { theme } from "../lib/theme.js";
import { ArrowRight, ArrowLeft, Check, Building2, FileText, ImageIcon, Eye, Upload, Coffee } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import AddressInput from "../shared/components/AddressInput.jsx";

const TAGS = ["Heritage", "Beachfront", "Boutique", "Hotel", "Resort", "BnB"];
const AMENITIES = ["WiFi", "Pool", "Spa", "Restaurant", "Bar", "Parking", "Gym", "Beach Access", "Room Service", "Laundry", "Airport Transfer", "Pet Friendly", "Fireplace", "Garden", "Rooftop", "Yoga Deck", "Bicycles", "Library", "Trekking", "Boat Tours"];

const empty = { name: "", city: "", state: "", district: "", pincode: "", building: "", street: "", landmark: "", post_office: "", tag: "Boutique", description: "", short_description: "", amenities: [], rooms: 1, price: "", cover_image: "", images: "", breakfast_available: false, breakfast_price: "" };

export default function ListProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({ cover: false, extra: false });
  const [isDragging, setIsDragging] = useState({ cover: false, extra: false });

  const steps = [
    { n: 1, label: "Basic Info", icon: Building2 },
    { n: 2, label: "Details", icon: FileText },
    { n: 3, label: "Pricing & Photos", icon: ImageIcon },
    { n: 4, label: "Review", icon: Eye },
  ];

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  // Upload an image to Supabase Storage and return its public URL
  const uploadImage = async (file, slot) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) { setError("Only image files allowed."); return null; }
    if (file.size > 5 * 1024 * 1024) { setError("Max file size is 5MB."); return null; }
    setUploading(u => ({ ...u, [slot]: true })); setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `public/list-property/${Date.now()}-${Math.random().toString(36).slice(-4)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("hotel-photos").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("hotel-photos").getPublicUrl(path);
      return publicUrl;
    } catch (e) { setError(`Upload failed: ${e.message}`); return null; }
    finally { setUploading(u => ({ ...u, [slot]: false })); }
  };

  const handleCoverUpload = async (file) => {
    const url = await uploadImage(file, "cover");
    if (url) setForm(f => ({ ...f, cover_image: url }));
  };

  const handleExtraUpload = async (files) => {
    const uploads = await Promise.all(Array.from(files).map(f => uploadImage(f, "extra")));
    const urls = uploads.filter(Boolean);
    if (urls.length) setForm(f => ({
      ...f,
      images: f.images ? f.images + ", " + urls.join(", ") : urls.join(", "),
    }));
  };

  const handleSubmit = async () => {
    if (!user) { setError("Please log in first."); return; }
    setSubmitting(true); setError(null);
    try {
      await pendingApi.submit({
        ...form,
        price: Number(form.price),
        rooms: Number(form.rooms),
        images: form.images ? form.images.split(",").map(s => s.trim()).filter(Boolean) : [],
        breakfast_available: !!form.breakfast_available,
        breakfast_price: form.breakfast_available ? Number(form.breakfast_price) || 0 : 0,
        owner_id: user.id,
        owner_email: user.email,
        owner_name: user.user_metadata?.full_name || "",
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = { width: "100%", padding: "14px 16px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 14, color: theme.INK, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" };
  const lbl = { fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 };

  if (!user) return (
    <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h2 className="serif" style={{ fontSize: 40, marginBottom: 16 }}>Sign in first</h2>
        <p style={{ color: theme.MUTED, marginBottom: 32 }}>You need an account to list your property.</p>
        <Link to="/signup" className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
          Create Account <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );

  if (success) return (
    <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", margin: "0 auto 32px", color: theme.CREAM }}>
          <Check size={36} />
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>Submitted</div>
        <h1 className="serif" style={{ fontSize: 52, fontWeight: 400, marginBottom: 20, lineHeight: 1.1 }}>
          Your property is<br /><em style={{ color: theme.SEA }}>under review.</em>
        </h1>
        <p style={{ fontSize: 16, color: theme.MUTED, lineHeight: 1.7, marginBottom: 40 }}>
          We'll review your submission and get back to you within 24–48 hours. Once approved, your property goes live and you'll get access to the hotel admin dashboard.
        </p>
        <Link to="/" className="cta-btn" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
          Back to Home <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );

  return (
    <main style={{ padding: "60px 6vw 100px" }}>
      {/* Header */}
      <div style={{ marginBottom: 56, maxWidth: 700 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— Partner With Us</div>
        <h1 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 400, lineHeight: 1, marginBottom: 16 }}>
          List your <em style={{ color: theme.SEA }}>property</em>.
        </h1>
        <p style={{ fontSize: 16, color: theme.MUTED, lineHeight: 1.7 }}>
          Join our curated collection of independent hotels. We review every submission personally — if your property has soul, it belongs here.
        </p>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 0, marginBottom: 56, maxWidth: 700 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center",
                background: step > s.n ? theme.SEA : step === s.n ? theme.INK : theme.SAND,
                color: step >= s.n ? theme.CREAM : theme.MUTED,
                transition: "all 0.3s",
              }}>
                {step > s.n ? <Check size={18} /> : <s.icon size={18} />}
              </div>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", color: step === s.n ? theme.INK : theme.MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>{s.label}</div>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: step > s.n ? theme.SEA : theme.SAND, margin: "0 8px", marginBottom: 24 }} />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ maxWidth: 700 }}>

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 8 }}>Basic Information</h2>
            <div>
              <label style={lbl}>Property Name *</label>
              <input required style={inp} placeholder="e.g. The Lake House" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <AddressInput
              required
              value={{ building: form.building, street: form.street, landmark: form.landmark, pincode: form.pincode, post_office: form.post_office, city: form.city, district: form.district, state: form.state }}
              onChange={addr => setForm(f => ({ ...f, ...addr }))}
            />
            <div>
              <label style={lbl}>Property Type</label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {TAGS.map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, tag: t })} style={{
                    padding: "10px 20px", border: `1px solid ${form.tag === t ? theme.INK : theme.SAND}`,
                    background: form.tag === t ? theme.INK : "transparent",
                    color: form.tag === t ? theme.CREAM : theme.INK,
                    fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Number of Rooms</label>
              <input type="number" min="1" style={{ ...inp, maxWidth: 160 }} value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} />
            </div>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 8 }}>Property Details</h2>
            <div>
              <label style={lbl}>One-line description *</label>
              <input required style={inp} placeholder="e.g. Lakefront heritage haveli with 12 curated suites" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Full Description *</label>
              <textarea required style={{ ...inp, minHeight: 160, resize: "vertical" }} placeholder="Tell us what makes your property special. Be evocative — describe the experience, not just the facilities." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Amenities</label>
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
              <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 8 }}>{form.amenities.length} selected</div>
            </div>
          </div>
        )}

        {/* Step 3 — Pricing & Photos */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 8 }}>Pricing & Photos</h2>
            <div>
              <label style={lbl}>Price per night (₹) *</label>
              <input required type="number" min="500" style={{ ...inp, maxWidth: 240 }} placeholder="e.g. 12000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 6 }}>This is the base price. You can adjust it later from your dashboard.</div>
            </div>

            <div style={{ padding: 20, border: `1px solid ${theme.SAND}`, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.breakfast_available ? 14 : 0 }}>
                <input type="checkbox" id="lp_breakfast" checked={form.breakfast_available} onChange={e => setForm({ ...form, breakfast_available: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                <label htmlFor="lp_breakfast" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <Coffee size={15} color={theme.SEA} /> Offer a "Room + Breakfast" option to guests
                </label>
              </div>
              {form.breakfast_available && (
                <div style={{ maxWidth: 260 }}>
                  <label style={lbl}>Breakfast Surcharge (₹ / night)</label>
                  <input type="number" min="0" style={inp} placeholder="e.g. 300" value={form.breakfast_price} onChange={e => setForm({ ...form, breakfast_price: e.target.value })} />
                </div>
              )}
            </div>

            <div>
              <label style={lbl}>Cover Image *</label>
              <div
                onClick={() => document.getElementById("lp_cover").click()}
                onDragEnter={e => { e.preventDefault(); setIsDragging(d => ({ ...d, cover: true })); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(d => ({ ...d, cover: true })); }}
                onDragLeave={e => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(d => ({ ...d, cover: false })); }}
                onDrop={e => { e.preventDefault(); setIsDragging(d => ({ ...d, cover: false })); handleCoverUpload(e.dataTransfer.files?.[0]); }}
                style={{ border: `2px dashed ${isDragging.cover ? theme.SEA : theme.SAND}`, background: isDragging.cover ? `${theme.SEA}10` : "#fff", padding: 24, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 16, justifyContent: form.cover_image ? "flex-start" : "center" }}
              >
                <input id="lp_cover" type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleCoverUpload(e.target.files?.[0])} />
                {form.cover_image ? (
                  <img src={form.cover_image} alt="cover" style={{ width: 100, height: 68, objectFit: "cover", border: `1px solid ${theme.SAND}` }} onError={e => e.target.style.display = "none"} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${theme.SEA}15`, display: "grid", placeItems: "center" }}>
                    {uploading.cover ? <div style={{ width: 22, height: 22, border: `2px solid ${theme.SEA}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Upload size={22} color={theme.SEA} />}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: isDragging.cover ? theme.SEA_DARK : theme.INK }}>
                    {uploading.cover ? "Uploading…" : isDragging.cover ? "Drop image here" : form.cover_image ? "Click to replace cover image" : "Click or drag & drop cover image"}
                  </div>
                  <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>JPG, PNG, WebP · Max 5MB</div>
                </div>
              </div>
              <input style={{ ...inp, marginTop: 10 }} placeholder="…or paste an image URL" value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Additional Images</label>
              <div
                onClick={() => document.getElementById("lp_extra").click()}
                onDragEnter={e => { e.preventDefault(); setIsDragging(d => ({ ...d, extra: true })); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(d => ({ ...d, extra: true })); }}
                onDragLeave={e => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(d => ({ ...d, extra: false })); }}
                onDrop={e => { e.preventDefault(); setIsDragging(d => ({ ...d, extra: false })); handleExtraUpload(e.dataTransfer.files); }}
                style={{ border: `2px dashed ${isDragging.extra ? theme.SEA : theme.SAND}`, background: isDragging.extra ? `${theme.SEA}10` : "#fff", padding: 24, cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}
              >
                <input id="lp_extra" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleExtraUpload(e.target.files)} />
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${theme.SEA}15`, display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                  {uploading.extra ? <div style={{ width: 20, height: 20, border: `2px solid ${theme.SEA}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Upload size={20} color={theme.SEA} />}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: isDragging.extra ? theme.SEA_DARK : theme.INK }}>
                  {uploading.extra ? "Uploading…" : isDragging.extra ? "Drop images here" : "Click or drag & drop additional images"}
                </div>
                <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 4 }}>Select multiple files · JPG, PNG, WebP · Max 5MB each</div>
              </div>
              {form.images && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {form.images.split(",").map((url, i) => url.trim() && (
                    <img key={i} src={url.trim()} alt="" style={{ width: 80, height: 56, objectFit: "cover", border: `1px solid ${theme.SAND}` }} onError={e => e.target.style.display = "none"} />
                  ))}
                </div>
              )}
              <textarea style={{ ...inp, minHeight: 60, resize: "vertical", marginTop: 10 }} placeholder="…or paste image URLs separated by commas" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} />
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 8 }}>Review & Submit</h2>
            <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, overflow: "hidden" }}>
              {form.cover_image && <img src={form.cover_image} alt="" style={{ width: "100%", height: 240, objectFit: "cover" }} />}
              <div style={{ padding: 32 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8 }}>{form.tag}</div>
                <h3 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 4 }}>{form.name || "—"}</h3>
                <div style={{ fontSize: 14, color: theme.MUTED, marginBottom: 20 }}>{form.city}, {form.state}</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4A5856", marginBottom: 24 }}>{form.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Price", value: form.price ? `₹${Number(form.price).toLocaleString("en-IN")}/night` : "—" },
                    { label: "Rooms", value: form.rooms },
                    { label: "Breakfast", value: form.breakfast_available ? `+₹${Number(form.breakfast_price || 0).toLocaleString("en-IN")}/night` : "Not offered" },
                  ].map(item => (
                    <div key={item.label} style={{ padding: 16, background: theme.SAND }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {form.amenities.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {form.amenities.map(a => (
                      <span key={a} style={{ padding: "4px 12px", background: `${theme.SEA}15`, color: theme.SEA_DARK, fontSize: 12 }}>{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ background: "#E8F5F3", border: `1px solid ${theme.SEA}33`, padding: 20, fontSize: 14, lineHeight: 1.7 }}>
              <strong>What happens next:</strong> Our team will review your submission within 24–48 hours. If approved, your property goes live and you'll automatically get access to the Hotel Admin dashboard where you can manage bookings.
            </div>
            {error && <div style={{ color: "#a33", padding: 14, background: "#fff5f5", border: "1px solid #fcc", fontSize: 13 }}>{error}</div>}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="ghost-btn" style={{
              display: "flex", alignItems: "center", gap: 8, padding: "16px 28px",
              background: "transparent", border: `1px solid ${theme.INK}`, fontSize: 13,
              letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer",
            }}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => {
              if (step === 1 && (!form.name || !form.city || !form.state)) { setError("Please fill all required fields."); return; }
              if (step === 2 && (!form.description)) { setError("Please add a description."); return; }
              if (step === 3 && (!form.price || !form.cover_image)) { setError("Please add price and cover image."); return; }
              setError(null); setStep(s => s + 1);
            }} className="cta-btn" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "16px 32px",
              background: theme.SEA, color: theme.CREAM, border: "none",
              fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer",
            }}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="cta-btn" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "16px 32px",
              background: theme.SEA, color: theme.CREAM, border: "none",
              fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? "Submitting…" : <><Check size={14} /> Submit for Review</>}
            </button>
          )}
        </div>
        {error && step < 4 && <div style={{ color: "#a33", fontSize: 13, marginTop: 12 }}>{error}</div>}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}