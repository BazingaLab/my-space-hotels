import { useEffect, useState } from "react";
import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { adminApi, bookingMgmtApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Search, Calendar, Users, X, LogIn, LogOut, UserX } from "lucide-react";

export default function BookingsManager() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [marking, setMarking] = useState(null);

  const load = () => {
    if (!user?.id) return;
    adminApi.getOwnerBookings(user.id)
      .then(d => setBookings(d.bookings || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking? The guest will be notified.")) return;
    setCancelling(bookingId);
    try {
      await bookingMgmtApi.cancel(bookingId, { reason: "Cancelled by hotel" });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(null);
    }
  };

  const handleMark = async (bookingId, action) => {
    setMarking(bookingId);
    try {
      if (action === "checkin") await bookingMgmtApi.checkIn(bookingId);
      else if (action === "checkout") await bookingMgmtApi.checkOut(bookingId);
      else if (action === "no-show") {
        if (!window.confirm("Mark this guest as a no-show?")) { setMarking(null); return; }
        await bookingMgmtApi.markNoShow(bookingId);
      }
      load();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setMarking(null);
    }
  };

  const formatDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const filtered = bookings
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => !search || b.guest_name?.toLowerCase().includes(search.toLowerCase()) || b.guest_email?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = s => ({ confirmed: { bg: "#E8F5F3", color: theme.SEA_DARK }, pending: { bg: "#FFF8E6", color: "#A0700A" }, cancelled: { bg: "#FFF0F0", color: "#a33" } }[s] || {});

  const checkinColor = s => ({
    not_arrived: { bg: "#F0EAE0", color: theme.MUTED, label: "Not arrived" },
    checked_in: { bg: "#E8F5F3", color: theme.SEA_DARK, label: "Checked in" },
    checked_out: { bg: "#EEF0FF", color: "#4A4FA0", label: "Checked out" },
    no_show: { bg: "#FFF0F0", color: "#a33", label: "No-show" },
  }[s || "not_arrived"]);

  const filters = ["all", "confirmed", "pending", "cancelled"];

  const totalRevenue = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + Number(b.total_price), 0);

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Manage</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Bookings</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total", value: bookings.length, color: theme.INK },
          { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, color: theme.SEA_DARK },
          { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: "#A0700A" },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: theme.SEA },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", padding: 20, border: `1px solid ${theme.SAND}`, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 18px", border: `1px solid ${filter === f ? theme.INK : theme.SAND}`,
              background: filter === f ? theme.INK : "transparent",
              color: filter === f ? theme.CREAM : theme.INK,
              fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            }}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1, position: "relative", maxWidth: 300 }}>
          <Search size={14} color={theme.MUTED} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search guest name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={14} /></button>}
        </div>
      </div>

      {loading ? (
        <div style={{ color: theme.MUTED, padding: 40, textAlign: "center" }}>Loading bookings…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <div className="serif" style={{ fontSize: 28, color: theme.MUTED }}>No bookings found</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}`, background: theme.SAND }}>
              {["Guest", "Dates", "Guests", "Nights", "Total", "Status", "Check-in", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(b => {
                const sc = statusColor(b.status);
                const cs = checkinColor(b.checkin_status);
                const isMarking = marking === b.id;
                const iconBtn = { border: "none", background: "transparent", cursor: "pointer", padding: 6, display: "inline-flex" };
                return (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                    <td style={{ padding: "16px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{b.guest_name}</div>
                      <div style={{ fontSize: 12, color: theme.MUTED }}>{b.guest_email}</div>
                      {b.guest_phone && <div style={{ fontSize: 12, color: theme.MUTED }}>{b.guest_phone}</div>}
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <Calendar size={12} color={theme.SEA} />
                        <span>{formatDate(b.check_in)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>→ {formatDate(b.check_out)}</div>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={12} color={theme.MUTED} /> {b.guests}
                      </div>
                    </td>
                    <td style={{ padding: "16px 16px" }}>{b.nights}</td>
                    <td style={{ padding: "16px 16px" }} className="serif">
                      ₹{Number(b.total_price).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{b.status}</span>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: cs.bg, color: cs.color, padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{cs.label}</span>
                        {b.status !== "cancelled" && (b.checkin_status || "not_arrived") === "not_arrived" && (
                          <>
                            <button title="Check in" disabled={isMarking} onClick={() => handleMark(b.id, "checkin")} style={{ ...iconBtn, color: theme.SEA_DARK }}><LogIn size={15} /></button>
                            <button title="Mark no-show" disabled={isMarking} onClick={() => handleMark(b.id, "no-show")} style={{ ...iconBtn, color: "#a33" }}><UserX size={15} /></button>
                          </>
                        )}
                        {b.checkin_status === "checked_in" && (
                          <button title="Check out" disabled={isMarking} onClick={() => handleMark(b.id, "checkout")} style={{ ...iconBtn, color: "#4A4FA0" }}><LogOut size={15} /></button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
                        >
                          {cancelling === b.id ? "…" : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </HotelPortalLayout>
  );
}