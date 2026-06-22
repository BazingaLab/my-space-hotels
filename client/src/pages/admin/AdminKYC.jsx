import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { theme } from "../../lib/theme.js";
import { CheckCircle2, XCircle, Clock, Eye, X, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const DOC_LABELS = {
  aadhaar_front: "Aadhaar (Front)", aadhaar_back: "Aadhaar (Back)",
  pan_card: "PAN Card", cancelled_cheque: "Cancelled Cheque",
  ownership_proof: "Ownership Proof", gst_certificate: "GST Certificate", other: "Other",
};

const STATUS_STYLE = {
  pending:  { bg: "#FFF8E7", color: "#8A6D1F", label: "Pending" },
  verified: { bg: "#E8F5F3", color: theme.SEA_DARK, label: "Verified" },
  rejected: { bg: "#fff5f5", color: "#a33", label: "Rejected" },
  incomplete: { bg: theme.SAND, color: theme.MUTED, label: "Incomplete" },
};

export default function AdminKYC() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [docs, setDocs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadHotels = async () => {
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/pending`);
    const data = await res.json();
    setHotels(data.hotels || []);
    setLoading(false);
  };

  const loadDocs = async (hotelId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/hotel/${hotelId}`);
    const data = await res.json();
    setDocs(data.documents || []);
  };

  useEffect(() => { loadHotels(); }, []);
  useEffect(() => { if (selected) loadDocs(selected.id); }, [selected]);

  const reviewDoc = async (docId, status, reason = null) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/${docId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejection_reason: reason, reviewed_by: user?.id }),
    });
    await loadDocs(selected.id);
    await loadHotels();
    setRejectModal(null);
    setRejectReason("");
  };

  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Compliance</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>KYC Review</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "start" }}>
        {/* Hotel list */}
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.SAND}`, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: theme.MUTED }}>
            {loading ? "Loading…" : `${hotels.length} hotels need review`}
          </div>
          {hotels.length === 0 && !loading && (
            <div style={{ padding: 40, textAlign: "center", color: theme.MUTED }}>
              <Shield size={32} style={{ marginBottom: 12 }} />
              <div>All KYC up to date</div>
            </div>
          )}
          {hotels.map(h => {
            const s = STATUS_STYLE[h.kyc_status] || STATUS_STYLE.incomplete;
            return (
              <div key={h.id} onClick={() => setSelected(h)} style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.SAND}`, cursor: "pointer", background: selected?.id === h.id ? `${theme.SEA}08` : "transparent" }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{h.name}</div>
                <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{h.city} · {h.owner_name}</div>
                <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", background: s.bg, color: s.color, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Document review */}
        {selected ? (
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 className="serif" style={{ fontSize: 28 }}>{selected.name}</h2>
              <div style={{ fontSize: 13, color: theme.MUTED }}>{selected.owner_name} · {selected.owner_email}</div>
            </div>
            {docs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.MUTED }}>No documents uploaded yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {docs.map(doc => {
                  const s = STATUS_STYLE[doc.status];
                  return (
                    <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, border: `1px solid ${theme.SAND}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{DOC_LABELS[doc.doc_type] || doc.doc_type}</div>
                        <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{doc.file_name} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}</div>
                        {doc.rejection_reason && <div style={{ fontSize: 12, color: "#a33", marginTop: 4 }}>Reason: {doc.rejection_reason}</div>}
                      </div>
                      <span style={{ padding: "4px 12px", background: s?.bg, color: s?.color, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{s?.label}</span>
                      <button onClick={() => setPreview(doc.file_url)} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "8px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} /> View</button>
                      {doc.status !== "verified" && (
                        <button onClick={() => reviewDoc(doc.id, "verified")} style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "8px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> Verify</button>
                      )}
                      {doc.status !== "rejected" && (
                        <button onClick={() => setRejectModal(doc)} style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "8px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={13} /> Reject</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 60, textAlign: "center", color: theme.MUTED }}>
            <Shield size={40} style={{ marginBottom: 16 }} />
            <div>Select a hotel to review documents</div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: theme.CREAM, width: "100%", maxWidth: 440, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 className="serif" style={{ fontSize: 22 }}>Reject Document</h2>
              <button onClick={() => setRejectModal(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 16 }}>Rejecting: <strong>{DOC_LABELS[rejectModal.doc_type]}</strong></div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 }}>Reason for rejection</label>
              <textarea style={{ ...inp, minHeight: 80 }} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Document is blurry, please re-upload" />
            </div>
            <button onClick={() => reviewDoc(rejectModal.id, "rejected", rejectReason)} style={{ width: "100%", background: "#a33", color: "#fff", border: "none", padding: 14, fontSize: 13, cursor: "pointer" }}>Confirm Rejection</button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer" }}>
          {preview.includes(".pdf") ? (
            <iframe src={preview} style={{ width: "90vw", height: "85vh", border: "none" }} onClick={e => e.stopPropagation()} />
          ) : (
            <img src={preview} alt="" style={{ maxWidth: "90%", maxHeight: "85vh", objectFit: "contain" }} />
          )}
          <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}><X size={32} /></button>
        </div>
      )}
    </AdminLayout>
  );
}