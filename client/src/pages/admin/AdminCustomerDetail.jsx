import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import StatusBadge from "../../shared/components/StatusBadge.jsx";
import { useCustomer, useUpdateCustomer } from "../../features/customers/hooks.jsx";
import { theme } from "../../lib/theme.js";
import { ArrowLeft, Save, Gift, Crown, Phone, Mail, MapPin, CreditCard } from "lucide-react";

const ID_TYPES = ["Aadhaar", "Passport", "DrivingLicense", "VoterID", "Other"];

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id);
  const updateMutation = useUpdateCustomer();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (customer) setForm(customer); }, [customer]);

  if (isLoading || !form) return <AdminLayout><div style={{ padding: 40, color: theme.MUTED }}>Loading…</div></AdminLayout>;

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const save = async () => {
    await updateMutation.mutateAsync({ id, patch: {
      name: form.name, phone: form.phone, address: form.address,
      id_proof_type: form.id_proof_type || null, id_proof_number: form.id_proof_number,
      loyalty_points: Number(form.loyalty_points) || 0, classification: form.classification,
    }});
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const inp = { width: "100%", padding: "11px 14px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };
  const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AdminLayout>
      <button onClick={() => navigate("/admin/customers")} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: theme.MUTED, cursor: "pointer", marginBottom: 20, fontSize: 13 }}>
        <ArrowLeft size={16} /> Back to Customers
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400 }}>{form.name}</h1>
          <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", color: theme.MUTED, fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} /> {form.email}</span>
            {form.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {form.phone}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF4E0", color: "#B8860B", padding: "6px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <Crown size={14} /> {form.classification}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24 }}>
          <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Total Bookings</div>
          <div className="serif" style={{ fontSize: 32 }}>{form.total_bookings || 0}</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24 }}>
          <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Lifetime Spend</div>
          <div className="serif" style={{ fontSize: 32, color: theme.SEA_DARK }}>₹{Number(form.total_spent || 0).toLocaleString("en-IN")}</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24 }}>
          <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Loyalty Points</div>
          <div className="serif" style={{ fontSize: 32, color: "#E87C4E", display: "flex", alignItems: "center", gap: 8 }}><Gift size={24} /> {form.loyalty_points || 0}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24 }}>
        {/* Editable profile */}
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
          <h3 className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Profile</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><label style={lbl}>Name</label><input style={inp} value={form.name || ""} onChange={e => set("name", e.target.value)} /></div>
            <div><label style={lbl}>Phone</label><input style={inp} value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
            <div><label style={lbl}>Address</label><input style={inp} value={form.address || ""} onChange={e => set("address", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={lbl}>ID Proof Type</label><select style={inp} value={form.id_proof_type || ""} onChange={e => set("id_proof_type", e.target.value)}><option value="">—</option>{ID_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>ID Number</label><input style={inp} value={form.id_proof_number || ""} onChange={e => set("id_proof_number", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={lbl}>Tier</label><select style={inp} value={form.classification} onChange={e => set("classification", e.target.value)}><option>Basic</option><option>Regular</option><option>Premium</option></select></div>
              <div><label style={lbl}>Loyalty Points</label><input type="number" style={inp} value={form.loyalty_points || 0} onChange={e => set("loyalty_points", e.target.value)} /></div>
            </div>
            {saved && <div style={{ color: theme.SEA_DARK, fontSize: 13, padding: 10, background: "#E8F5F3" }}>✓ Saved</div>}
            <button onClick={save} disabled={updateMutation.isPending} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 14, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
              <Save size={16} /> {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Booking history */}
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
          <h3 className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Booking History</h3>
          {(!customer.bookings || customer.bookings.length === 0) ? (
            <div style={{ color: theme.MUTED, padding: 20, textAlign: "center" }}>No bookings yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {customer.bookings.map(b => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${theme.SAND}` }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{b.hotels?.name || "Hotel"}</div>
                    <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{fmtDate(b.check_in)} → {fmtDate(b.check_out)} · {b.nights}n</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="serif" style={{ fontSize: 15, color: theme.SEA_DARK }}>₹{Number(b.total_price).toLocaleString("en-IN")}</div>
                    <StatusBadge value={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
