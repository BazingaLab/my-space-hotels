import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { pendingApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Check, X, Eye } from "lucide-react";

export default function AdminPending() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [preview, setPreview] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [processing, setProcessing] = useState(null);

  const load = () => pendingApi.getAll(filter).then(d => setHotels(d.hotels || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this hotel? It will go live immediately and the owner will get admin access.")) return;
    setProcessing(id);
    await pendingApi.approve(id);
    load();
    setProcessing(null);
    setPreview(null);
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { alert("Please provide a rejection reason."); return; }
    setProcessing(id);
    await pendingApi.reject(id, rejectReason);
    setRejectingId(null);
    setRejectReason("");
    load();
    setProcessing(null);
  };

  const statusColor = s => ({ pending: { bg: "#FFF8E6", color: "#A0700A" }, approved: { bg: "#E8F5F3", color: theme.SEA_DARK }, rejected: { bg: "#FFF0F0", color: "#a33" } }[s] || {});
  const filters = ["pending", "approved", "rejected"];

  return (
    <AdminLayout requireSuper>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Review</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Property Submissions</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "10px 24px", border: `1px solid ${filter === f ? theme.INK : theme.SAND}`,
            background: filter === f ? theme.INK : "transparent",
            color: filter === f ? theme.CREAM : theme.INK,
            fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
          }}>{f}</button>
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: theme.CREAM, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: `1px solid ${theme.SAND}` }}>
              <h2 className="serif" style={{ fontSize: 28, fontWeight: 400 }}>{preview.name}</h2>
              <button onClick={() => setPreview(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={24} /></button>
            </div>
            <img src={preview.cover_image} alt="" style={{ width: "100%", height: 280, objectFit: "cover" }} />
            <div style={{ padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Location", value: `${preview.city}, ${preview.state}` },
                  { label: "Type", value: preview.tag },
                  { label: "Price", value: `₹${Number(preview.price).toLocaleString("en-IN")}/night` },
                  { label: "Rooms", value: preview.rooms },
                  { label: "Owner", value: preview.owner_name || "—" },
                  { label: "Email", value: preview.owner_email },
                ].map(item => (
                  <div key={item.label} style={{ padding: 14, background: theme.SAND }}>
                    <div style={{ fontSize: 10, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4A5856", marginBottom: 20 }}>{preview.description}</p>
              {preview.amenities?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                  {preview.amenities.map(a => <span key={a} style={{ padding: "4px 12px", background: `${theme.SEA}15`, color: theme.SEA_DARK, fontSize: 12 }}>{a}</span>)}
                </div>
              )}
              {preview.status === "pending" && (
                <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => handleApprove(preview.id)} disabled={processing === preview.id} style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "14px 28px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={16} /> {processing === preview.id ? "Approving…" : "Approve & Publish"}
                    </button>
                    <button onClick={() => setRejectingId(preview.id)} style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "14px 28px", fontSize: 13, cursor: "pointer" }}>
                      Reject
                    </button>
                  </div>
                  {rejectingId === preview.id && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (will be shown to owner)..." style={{ padding: 14, border: `1px solid ${theme.SAND}`, fontSize: 14, minHeight: 80, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
                      <button onClick={() => handleReject(preview.id)} style={{ background: "#a33", color: "#fff", border: "none", padding: "12px 24px", fontSize: 13, cursor: "pointer", alignSelf: "flex-start" }}>
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: theme.MUTED }}>Loading…</div> : hotels.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <div className="serif" style={{ fontSize: 28, color: theme.MUTED }}>No {filter} submissions</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {hotels.map(h => {
            const sc = statusColor(h.status);
            return (
              <div key={h.id} style={{ background: "#fff", border: `1px solid ${theme.SAND}`, display: "grid", gridTemplateColumns: "160px 1fr auto", overflow: "hidden" }}>
                <img src={h.cover_image} alt="" style={{ width: "100%", height: "100%", minHeight: 120, objectFit: "cover" }} />
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3 className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{h.name}</h3>
                    <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 8 }}>{h.city}, {h.state} · {h.tag} · ₹{Number(h.price).toLocaleString("en-IN")}/night</div>
                  <div style={{ fontSize: 12, color: theme.MUTED }}>Submitted by <strong style={{ color: theme.INK }}>{h.owner_name || h.owner_email}</strong> · {new Date(h.submitted_at).toLocaleDateString("en-IN")}</div>
                  {h.rejection_reason && <div style={{ fontSize: 12, color: "#a33", marginTop: 6 }}>Reason: {h.rejection_reason}</div>}
                </div>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, borderLeft: `1px solid ${theme.SAND}` }}>
                  <button onClick={() => { setPreview(h); setRejectingId(null); setRejectReason(""); }} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "8px 16px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: theme.INK }}>
                    <Eye size={14} /> Review
                  </button>
                  {h.status === "pending" && (
                    <>
                      <button onClick={() => handleApprove(h.id)} disabled={processing === h.id} style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "8px 16px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => { setPreview(h); setRejectingId(h.id); }} style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "8px 16px", fontSize: 12, cursor: "pointer" }}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}