import { useEffect, useState, useRef } from "react";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabase.js";
import { theme } from "../../lib/theme.js";
import { Upload, Trash2, Image, X } from "lucide-react";

const CATEGORIES = [
  { id: "cover", label: "Cover Photo", desc: "Main photo shown on listings" },
  { id: "bedroom", label: "Bedrooms", desc: "Room interiors, beds, wardrobes" },
  { id: "bathroom", label: "Bathrooms", desc: "En-suite, toiletries, bathtubs" },
  { id: "pool", label: "Pool & Spa", desc: "Swimming pool, jacuzzi, spa" },
  { id: "dining", label: "Dining", desc: "Restaurant, breakfast, bar" },
  { id: "amenities", label: "Amenities", desc: "Gym, lounge, common areas" },
  { id: "exterior", label: "Exterior & Lobby", desc: "Building, gardens, entrance" },
  { id: "other", label: "Other", desc: "Any other photos" },
];

export default function PhotoManager() {
  const { myHotel } = useHotelPortal();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [activeCategory, setActiveCategory] = useState("cover");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const loadPhotos = async () => {
    if (!myHotel?.id) return;
    const { data, error } = await supabase
      .from("hotel_photos")
      .select("*")
      .eq("hotel_id", myHotel.id)
      .order("category")
      .order("sort_order");
    if (!error) setPhotos(data || []);
    setLoading(false);
  };

  useEffect(() => { loadPhotos(); }, [myHotel]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !myHotel || !user) return;
    setUploading(true);
    setError(null);

    for (const file of files) {
      try {
        // Validate file
        if (!file.type.startsWith("image/")) { setError("Only image files allowed."); continue; }
        if (file.size > 5 * 1024 * 1024) { setError("Max file size is 5MB."); continue; }

        // Upload to Supabase Storage
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${myHotel.id}/${activeCategory}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("hotel-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("hotel-photos")
          .getPublicUrl(path);

        // Save to hotel_photos table
        const { error: dbError } = await supabase
          .from("hotel_photos")
          .insert([{
            hotel_id: myHotel.id,
            owner_id: user.id,
            url: publicUrl,
            category: activeCategory,
            sort_order: photos.filter(p => p.category === activeCategory).length,
          }]);

        if (dbError) throw dbError;

        // If cover photo, update the hotels table cover_image
        if (activeCategory === "cover") {
          await supabase.from("hotels").update({ cover_image: publicUrl }).eq("id", myHotel.id);
        }
      } catch (err) {
        setError(`Upload failed: ${err.message}`);
      }
    }

    await loadPhotos();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      // Extract path from URL
      const urlParts = photo.url.split("/hotel-photos/");
      if (urlParts.length > 1) {
        await supabase.storage.from("hotel-photos").remove([urlParts[1]]);
      }
      await supabase.from("hotel_photos").delete().eq("id", photo.id);
      await loadPhotos();
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  const categoryPhotos = photos.filter(p => p.category === activeCategory);
  const totalPhotos = photos.length;

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Media</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Photo Manager</h1>
        <p style={{ color: theme.MUTED, marginTop: 8 }}>{totalPhotos} photos uploaded across {CATEGORIES.length} categories</p>
      </div>

      {!myHotel ? (
        <div style={{ padding: 40, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <p style={{ color: theme.MUTED }}>No property found. Your application may still be under review.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
          {/* Category sidebar */}
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 16, alignSelf: "start" }}>
            {CATEGORIES.map(cat => {
              const count = photos.filter(p => p.category === cat.id).length;
              const active = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                  width: "100%", textAlign: "left", padding: "12px 16px", marginBottom: 4,
                  background: active ? `${theme.SEA}15` : "transparent",
                  border: active ? `1px solid ${theme.SEA}33` : "1px solid transparent",
                  cursor: "pointer", borderRadius: 2,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? theme.SEA_DARK : theme.INK }}>{cat.label}</span>
                    <span style={{ fontSize: 11, color: count > 0 ? theme.SEA_DARK : theme.MUTED, background: count > 0 ? `${theme.SEA}15` : theme.SAND, padding: "2px 8px", borderRadius: 10 }}>{count}</span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.MUTED, marginTop: 2 }}>{cat.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Upload area + photos */}
          <div>
            {/* Upload zone */}
            <div style={{ background: "#fff", border: `2px dashed ${theme.SAND}`, padding: 32, textAlign: "center", marginBottom: 24, cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleUpload({ target: { files: e.dataTransfer.files } }); }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${theme.SEA}15`, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                {uploading ? <div style={{ width: 24, height: 24, border: `2px solid ${theme.SEA}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Upload size={24} color={theme.SEA} />}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                {uploading ? "Uploading…" : `Upload ${CATEGORIES.find(c => c.id === activeCategory)?.label} Photos`}
              </div>
              <div style={{ fontSize: 13, color: theme.MUTED }}>Click or drag & drop · JPG, PNG, WebP · Max 5MB each</div>
            </div>

            {error && (
              <div style={{ padding: 14, background: "#fff5f5", border: "1px solid #fcc", color: "#a33", fontSize: 13, marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
                {error} <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#a33" }}><X size={16} /></button>
              </div>
            )}

            {/* Photos grid */}
            {loading ? (
              <div style={{ color: theme.MUTED }}>Loading photos…</div>
            ) : categoryPhotos.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
                <Image size={40} color={theme.MUTED} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 18, color: theme.MUTED }}>No {CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} photos yet</div>
                <div style={{ fontSize: 13, color: theme.MUTED, marginTop: 8 }}>Click the upload area above to add photos</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {categoryPhotos.map(photo => (
                  <div key={photo.id} style={{ position: "relative", group: true }}>
                    <img
                      src={photo.url}
                      alt=""
                      onClick={() => setPreview(photo.url)}
                      style={{ width: "100%", height: 200, objectFit: "cover", cursor: "pointer", display: "block" }}
                    />
                    <button
                      onClick={() => handleDelete(photo)}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(0,0,0,0.6)", border: "none",
                        color: "#fff", width: 32, height: 32, borderRadius: "50%",
                        display: "grid", placeItems: "center", cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    {activeCategory === "cover" && (
                      <div style={{ position: "absolute", bottom: 8, left: 8, background: theme.SEA, color: theme.CREAM, padding: "3px 10px", fontSize: 10, letterSpacing: "0.1em" }}>
                        COVER
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview lightbox */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer" }}
        >
          <img src={preview} alt="" style={{ maxWidth: "90%", maxHeight: "90vh", objectFit: "contain" }} />
          <button style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
            <X size={32} />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </HotelPortalLayout>
  );
}