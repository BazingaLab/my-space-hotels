import { useState, useEffect } from "react";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabase.js";
import { theme } from "../../lib/theme.js";
import { Upload, CheckCircle2, XCircle, Clock, FileText, X, Eye } from "lucide-react";

const DOC_TYPES = [
  { id: "aadhaar_front", label: "Aadhaar Card (Front)", desc: "Front side of Aadhaar card", required: true },
  { id: "aadhaar_back", label: "Aadhaar Card (Back)", desc: "Back side of Aadhaar card", required: true },
  { id: "pan_card", label: "PAN Card", desc: "Income Tax PAN card", required: true },
  { id: "cancelled_cheque", label: "Cancelled Cheque", desc: "For bank account verification", required: true },
  { id: "ownership_proof", label: "Ownership / Rent Agreement", desc: "Proof of property ownership or lease", required: true },
  { id: "gst_certificate", label: "GST Certificate", desc: "If GST registered", required: false },
  { id: "other", label: "Other Document", desc: "Any other supporting document", required: false },
];

const STATUS_STYLE = {
  pending:  { bg: "#FFF8E7", color: "#8A6D1F", icon: Clock, label: "Under Review" },
  verified: { bg: "#E8F5F3", color: theme.SEA_DARK, icon: CheckCircle2, label: "Verified" },
  rejected: { bg: "#fff5f5", color: "#a33", icon: XCircle, label: "Rejected" },
};

export default function KYCUpload() {
  const { myHotel } = useHotelPortal();
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState({});
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const loadDocs = async () => {
    if (!myHotel?.id) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/hotel/${myHotel.id}`);
    const data = await res.json();
    setDocs(data.documents || []);
  };
  useEffect(() => { loadDocs(); }, [myHotel]);

  const uploadDoc = async (docType, file) => {
    if (!file || !myHotel) return;
    if (file.size > 10 * 1024 * 1024) { setError("Max file size is 10MB."); return; }
    const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
    if (!allowed.includes(file.type)) { setError("Only JPG, PNG, WebP or PDF allowed."); return; }

    setUploading(u => ({ ...u, [docType]: true })); setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `kyc/${myHotel.id}/${docType}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("kyc-documents").getPublicUrl(path);

      // Save to DB via backend
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel_id: myHotel.id, owner_id: user.id, doc_type: docType, file_url: publicUrl, file_name: file.name, file_size: file.size }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      await loadDocs();
    } catch (e) { setError(`Upload failed: ${e.message}`); }
    finally { setUploading(u => ({ ...u, [docType]: false })); }
  };

  const getDoc = (type) => docs.find(d => d.doc_type === type);
  const requiredDone = DOC_TYPES.filter(d => d.required).every(d => getDoc(d.id));
  const allVerified = DOC_TYPES.filter(d => d.required).every(d => getDoc(d.id)?.status === "verified");

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Compliance</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>KYC Documents</h1>
        <p style={{ color: theme.MUTED, marginTop: 8 }}>Upload your identity and ownership documents for verification. Required before payouts are enabled.</p>
      </div>

      {/* Status banner */}
      <div style={{ padding: 16, marginBottom: 28, background: allVerified ? "#E8F5F3" : requiredDone ? "#FFF8E7" : "#fff5f5", border: `1px solid ${allVerified ? theme.SEA : requiredDone ? "#E8C97A" : "#fcc"}`, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
        {allVerified ? <CheckCircle2 size={18} color={theme.SEA_DARK} /> : requiredDone ? <Clock size={18} color="#8A6D1F" /> : <XCircle size={18} color="#a33" />}
        <span>
          {allVerified ? "All documents verified — payouts enabled." : requiredDone ? "Documents submitted and under review. We'll notify you once verified." : "Please upload all required documents to enable payouts."}
        </span>
      </div>

      {error && <div style={{ color: "#a33", fontSize: 13, padding: 12, background: "#fff5f5", border: "1px solid #fcc", marginBottom: 20, display: "flex", justifyContent: "space-between" }}>{error}<button onClick={() => setError(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#a33" }}><X size={16} /></button></div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {DOC_TYPES.map(docType => {
          const doc = getDoc(docType.id);
          const isUploading = uploading[docType.id];
          const statusStyle = doc ? STATUS_STYLE[doc.status] : null;
          const StatusIcon = statusStyle?.icon;

          return (
            <div key={docType.id} style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
              {/* Doc type info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <FileText size={16} color={theme.SEA} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{docType.label}</span>
                  {docType.required && <span style={{ fontSize: 10, color: "#a33", letterSpacing: "0.1em" }}>REQUIRED</span>}
                </div>
                <div style={{ fontSize: 12, color: theme.MUTED }}>{docType.desc}</div>
                {doc?.rejection_reason && (
                  <div style={{ fontSize: 12, color: "#a33", marginTop: 6, padding: "6px 10px", background: "#fff5f5" }}>
                    Rejected: {doc.rejection_reason}
                  </div>
                )}
              </div>

              {/* Status badge */}
              {doc && statusStyle && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: statusStyle.bg, color: statusStyle.color, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  <StatusIcon size={14} /> {statusStyle.label}
                </div>
              )}

              {/* View uploaded doc */}
              {doc && (
                <button onClick={() => setPreview(doc.file_url)} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "8px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: theme.INK }}>
                  <Eye size={14} /> View
                </button>
              )}

              {/* Upload button */}
              <div>
                <input id={`kyc_${docType.id}`} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                  onChange={e => uploadDoc(docType.id, e.target.files?.[0])} />
                <label htmlFor={`kyc_${docType.id}`} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", cursor: isUploading ? "not-allowed" : "pointer",
                  background: doc ? "transparent" : theme.SEA_DEEP,
                  color: doc ? theme.INK : theme.CREAM,
                  border: `1px solid ${doc ? theme.SAND : theme.SEA_DEEP}`,
                  fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                  opacity: isUploading ? 0.7 : 1, whiteSpace: "nowrap",
                }}>
                  {isUploading ? (
                    <div style={{ width: 14, height: 14, border: `2px solid currentColor`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  ) : <Upload size={14} />}
                  {isUploading ? "Uploading…" : doc ? "Re-upload" : "Upload"}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview lightbox */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer" }}>
          {preview.endsWith(".pdf") ? (
            <iframe src={preview} style={{ width: "90vw", height: "85vh", border: "none" }} onClick={e => e.stopPropagation()} />
          ) : (
            <img src={preview} alt="" style={{ maxWidth: "90%", maxHeight: "85vh", objectFit: "contain" }} />
          )}
          <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}><X size={32} /></button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </HotelPortalLayout>
  );
}