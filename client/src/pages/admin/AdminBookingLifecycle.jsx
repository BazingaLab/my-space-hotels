import { useState, useMemo, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import DataTable from "../../shared/components/DataTable.jsx";
import StatusBadge from "../../shared/components/StatusBadge.jsx";
import KPICard from "../../shared/components/KPICard.jsx";
import { useManagedBookings, useBookingStats, useCancelBooking, useTransferBooking, useUpdateBooking } from "../../features/bookings/hooks.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { CalendarCheck, Clock, CheckCircle2, XCircle, IndianRupee, X, ArrowRightLeft, Ban } from "lucide-react";

export default function AdminBookingLifecycle() {
  const [tab, setTab] = useState("");
  const { data, isLoading } = useManagedBookings(tab ? { status: tab } : {});
  const { data: stats } = useBookingStats();
  const bookings = data?.bookings || [];

  const [cancelFor, setCancelFor] = useState(null);
  const [transferFor, setTransferFor] = useState(null);

  const cancelM = useCancelBooking();
  const transferM = useTransferBooking();
  const updateM = useUpdateBooking();

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const columns = useMemo(() => [
    { accessorKey: "guest_name", header: "Guest", cell: ({ row }) => (
      <div><div style={{ fontWeight: 500 }}>{row.original.guest_name}</div><div style={{ fontSize: 12, color: theme.MUTED }}>{row.original.guest_email}</div></div>
    )},
    { accessorKey: "hotels.name", header: "Hotel", cell: ({ row }) => row.original.hotels?.name || "—" },
    { accessorKey: "check_in", header: "Stay", cell: ({ row }) => (
      <div style={{ fontSize: 13 }}>{fmt(row.original.check_in)} → {fmt(row.original.check_out)}</div>
    )},
    { accessorKey: "liveStatus", header: "Status", cell: ({ getValue }) => <StatusBadge value={getValue()} /> },
    { accessorKey: "payment_status", header: "Payment", cell: ({ row }) => (
      <select value={row.original.payment_status || "pending"} onChange={e => updateM.mutate({ id: row.original.id, patch: { payment_status: e.target.value } })}
        style={{ padding: "4px 8px", border: `1px solid ${theme.SAND}`, fontSize: 12, background: "#fff" }}>
        {["pending", "paid", "refunded", "partial"].map(s => <option key={s}>{s}</option>)}
      </select>
    )},
    { accessorKey: "payment_mode", header: "Mode", cell: ({ row }) => (
      <select value={row.original.payment_mode || "pay_at_hotel"} onChange={e => updateM.mutate({ id: row.original.id, patch: { payment_mode: e.target.value } })}
        style={{ padding: "4px 8px", border: `1px solid ${theme.SAND}`, fontSize: 12, background: "#fff" }}>
        <option value="pay_at_hotel">Pay at Hotel</option>
        <option value="prepaid">Prepaid</option>
      </select>
    )},
    { accessorKey: "total_price", header: "Total", cell: ({ getValue }) => <span className="serif" style={{ color: theme.SEA_DARK }}>₹{Number(getValue()).toLocaleString("en-IN")}</span> },
    { id: "actions", header: "", cell: ({ row }) => row.original.liveStatus !== "cancelled" && (
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setTransferFor(row.original)} title="Transfer" style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><ArrowRightLeft size={12} /></button>
        <button onClick={() => setCancelFor(row.original)} title="Cancel" style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "6px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Ban size={12} /></button>
      </div>
    )},
  ], [updateM]);

  const tabs = [
    { key: "", label: "All" },
    { key: "active", label: "Active" },
    { key: "upcoming", label: "Upcoming" },
    { key: "closed", label: "Closed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Operations</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Booking Lifecycle</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
        <KPICard label="Active" value={stats?.active ?? 0} icon={CalendarCheck} color={theme.SEA} />
        <KPICard label="Upcoming" value={stats?.upcoming ?? 0} icon={Clock} color="#F5A623" />
        <KPICard label="Closed" value={stats?.closed ?? 0} icon={CheckCircle2} color="#7C6AF5" />
        <KPICard label="Cancelled" value={stats?.cancelled ?? 0} icon={XCircle} color="#a33" />
        <KPICard label="Revenue" value={`₹${Number(stats?.revenue || 0).toLocaleString("en-IN")}`} icon={IndianRupee} color={theme.INK} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return <button key={t.key || "all"} onClick={() => setTab(t.key)} style={{ padding: "8px 18px", border: `1px solid ${active ? theme.INK : theme.SAND}`, background: active ? theme.INK : "transparent", color: active ? theme.CREAM : theme.INK, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{t.label}</button>;
        })}
      </div>

      <DataTable data={bookings} columns={columns} searchPlaceholder="Search guest..." isLoading={isLoading} emptyMessage="No bookings" pageSize={15} />

      {cancelFor && <CancelModal booking={cancelFor} onClose={() => setCancelFor(null)} mutation={cancelM} fmt={fmt} />}
      {transferFor && <TransferModal booking={transferFor} onClose={() => setTransferFor(null)} mutation={transferM} />}
    </AdminLayout>
  );
}

function CancelModal({ booking, onClose, mutation }) {
  const [reason, setReason] = useState("");
  const [reimbursement, setReimbursement] = useState("");
  const submit = async () => {
    await mutation.mutateAsync({ id: booking.id, reason, reimbursement: Number(reimbursement) || 0 });
    onClose();
  };
  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 440, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Cancel Booking</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>
        <div style={{ padding: 14, background: "#fff5f5", marginBottom: 20, fontSize: 13, color: "#a33" }}>
          Cancelling {booking.guest_name}'s booking will reverse the hotel's wallet credit.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Cancellation Reason</label><textarea style={{ ...inp, minHeight: 70 }} value={reason} onChange={e => setReason(e.target.value)} /></div>
          <div><label style={lbl}>Reimbursement to Guest (₹)</label><input type="number" style={inp} value={reimbursement} onChange={e => setReimbursement(e.target.value)} placeholder="0" /></div>
          <button onClick={submit} disabled={mutation.isPending} style={{ background: "#a33", color: "#fff", border: "none", padding: 14, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
            {mutation.isPending ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ booking, onClose, mutation }) {
  const [hotels, setHotels] = useState([]);
  const [newHotelId, setNewHotelId] = useState("");
  useEffect(() => { adminApi.getHotels().then(d => setHotels((d.hotels || []).filter(h => h.id !== booking.hotel_id))); }, [booking]);
  const submit = async () => { await mutation.mutateAsync({ id: booking.id, new_hotel_id: newHotelId }); onClose(); };
  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 440, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Transfer Booking</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>
        <div style={{ padding: 14, background: "#E8F5F3", marginBottom: 20, fontSize: 13 }}>
          Move {booking.guest_name}'s booking from <strong>{booking.hotels?.name}</strong> to another hotel. Wallets adjust automatically.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Transfer To</label>
            <select style={inp} value={newHotelId} onChange={e => setNewHotelId(e.target.value)}>
              <option value="">Select hotel…</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
            </select>
          </div>
          <button onClick={submit} disabled={mutation.isPending || !newHotelId} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 14, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", opacity: newHotelId ? 1 : 0.5 }}>
            {mutation.isPending ? "Transferring…" : "Confirm Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
