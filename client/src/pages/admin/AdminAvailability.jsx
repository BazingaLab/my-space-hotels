import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import InventoryCalendarPanel from "../../shared/components/InventoryCalendarPanel.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";

export default function AdminAvailability() {
  const [hotels, setHotels] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getHotels()
      .then(d => {
        const list = d.hotels || [];
        setHotels(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = hotels.find(h => h.id === selectedId) || null;

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Operations</div>
          <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Availability</h1>
        </div>
        {hotels.length > 0 && (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{
            padding: "12px 16px", border: `1px solid ${theme.SAND}`, fontSize: 14, background: "#fff", minWidth: 260,
          }}>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ color: theme.MUTED }}>Loading hotels…</div>
      ) : hotels.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <div className="serif" style={{ fontSize: 28, color: theme.MUTED }}>No hotels yet</div>
        </div>
      ) : (
        <InventoryCalendarPanel hotel={selected} />
      )}
    </AdminLayout>
  );
}
