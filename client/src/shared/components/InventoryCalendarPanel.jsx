import { useEffect, useState } from "react";
import { inventoryApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Ban, X, AlertTriangle, Undo2 } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// Shared by the hotel-owner Availability page and the admin Availability
// view — same calendar, same block/unblock flow, same canonical backend
// calculation either way. Takes a hotel id/name/rooms so either caller
// can supply it (myHotel from the owner portal context, or a picked
// hotel from the admin's dropdown).
export default function InventoryCalendarPanel({ hotel }) {
  const [rangeStart, setRangeStart] = useState(todayStr());
  const [days, setDays] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const rangeEnd = addDays(rangeStart, 30);

  const load = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [cal, blockList] = await Promise.all([
        inventoryApi.calendar(hotel.id, rangeStart, rangeEnd),
        inventoryApi.listBlocks(hotel.id),
      ]);
      setDays(cal.days || []);
      setBlocks(blockList.blocks || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [hotel?.id, rangeStart]);

  const handleUnblock = async (blockId) => {
    if (!window.confirm("Unblock this inventory? It becomes bookable again immediately.")) return;
    try {
      await inventoryApi.deactivateBlock(blockId);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  if (!hotel) return <div style={{ padding: 40, color: theme.MUTED }}>No property selected.</div>;

  const cellStyle = (available) => ({
    padding: "12px 10px",
    background: available <= 0 ? "#FFF0F0" : available <= 2 ? "#FFF8E6" : "#fff",
    color: available <= 0 ? "#a33" : theme.INK,
    fontWeight: 600,
    textAlign: "center",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: 12, color: theme.MUTED }}>Showing 30 days from</label>
          <input type="date" min={todayStr()} value={rangeStart} onChange={e => setRangeStart(e.target.value)}
            style={{ padding: "8px 10px", border: `1px solid ${theme.SAND}`, fontSize: 13 }} />
        </div>
        <button onClick={() => setShowBlockModal(true)} style={{
          background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: "12px 20px",
          fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        }}>
          <Ban size={16} /> Block Inventory
        </button>
      </div>

      {error && <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #fcc", color: "#a33", marginBottom: 20, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }} className="grid-1-mobile">
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, color: theme.MUTED, textAlign: "center" }}>Loading…</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.SAND}`, background: theme.SAND }}>
                  {["Date", "Total", "Booked", "Blocked", "Available"].map(h => (
                    <th key={h} style={{ padding: "10px 8px", fontSize: 10, letterSpacing: "0.1em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(d => (
                  <tr key={d.day} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                    <td style={{ padding: "10px 8px" }}>{fmt(d.day)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>{d.total_rooms}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>{d.booked}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: d.blocked > 0 ? "#A0700A" : theme.MUTED }}>{d.blocked}</td>
                    <td style={cellStyle(d.available)}>{d.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 20 }}>
          <h3 className="serif" style={{ fontSize: 20, marginBottom: 16 }}>Active Blocks</h3>
          {blocks.length === 0 ? (
            <div style={{ color: theme.MUTED, fontSize: 13 }}>No inventory blocked right now.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {blocks.map(b => (
                <div key={b.id} style={{ border: `1px solid ${theme.SAND}`, padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{b.quantity} room{b.quantity !== 1 ? "s" : ""}</div>
                  <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{fmt(b.start_date)} → {fmt(b.end_date)}</div>
                  {b.reason && <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 4 }}>{b.reason}</div>}
                  <button onClick={() => handleUnblock(b.id)} style={{
                    marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                    background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 12px",
                    fontSize: 12, cursor: "pointer", color: theme.SEA_DARK,
                  }}>
                    <Undo2 size={13} /> Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBlockModal && <BlockModal hotelId={hotel.id} onClose={() => setShowBlockModal(false)} onDone={load} />}
    </div>
  );
}

function BlockModal({ hotelId, onClose, onDone }) {
  const [form, setForm] = useState({ start_date: todayStr(), end_date: addDays(todayStr(), 1), quantity: 1, reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [capacityWarning, setCapacityWarning] = useState(null);

  const submit = async (force = false) => {
    setError(null);
    setSubmitting(true);
    try {
      await inventoryApi.createBlock(hotelId, { ...form, quantity: Number(form.quantity), force });
      onDone();
      onClose();
    } catch (e) {
      // The server tells us exactly which day and by how much capacity
      // would be exceeded — surface that as an explicit yes/no decision
      // rather than silently blocking or silently overriding.
      if (/capacity exceeded/i.test(e.message)) {
        setCapacityWarning(e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 440, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Block Inventory</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>

        {capacityWarning ? (
          <div>
            <div style={{ display: "flex", gap: 10, padding: 14, background: "#FFF8E6", border: "1px solid #E8C97A", marginBottom: 20, fontSize: 13, color: "#8A6D1F" }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{capacityWarning}</span>
            </div>
            <p style={{ fontSize: 13, color: theme.MUTED, marginBottom: 20 }}>
              Existing guest bookings will not be cancelled. You can still create this block — it will just mean more rooms are committed than physically exist on that day until you resolve it manually.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setCapacityWarning(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${theme.INK}`, padding: 14, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => submit(true)} disabled={submitting} style={{ flex: 1, background: "#a33", color: "#fff", border: "none", padding: 14, fontSize: 13, cursor: "pointer" }}>
                {submitting ? "Blocking…" : "Block Anyway"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={lbl}>From</label><input type="date" min={todayStr()} style={inp} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><label style={lbl}>To</label><input type="date" min={addDays(form.start_date, 1)} style={inp} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div><label style={lbl}>Rooms to block</label><input type="number" min="1" style={inp} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div><label style={lbl}>Reason (optional)</label><input style={inp} placeholder="e.g. Maintenance, owner use" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
            {error && <div style={{ color: "#a33", fontSize: 13, padding: 10, background: "#fff5f5" }}>{error}</div>}
            <button onClick={() => submit(false)} disabled={submitting} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 14, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Checking…" : "Block Inventory"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
