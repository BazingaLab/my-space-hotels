import { useState, useMemo } from "react";
import AdminLayout from "./AdminLayout.jsx";
import DataTable from "../../shared/components/DataTable.jsx";
import KPICard from "../../shared/components/KPICard.jsx";
import { useWallets, useWalletSummary, useHotelWallet, useSettle } from "../../features/wallets/hooks.jsx";
import { theme } from "../../lib/theme.js";
import { Wallet, IndianRupee, Building2, X, ArrowDownToLine } from "lucide-react";

export default function AdminWallets() {
  const { data, isLoading } = useWallets();
  const { data: summary } = useWalletSummary();
  const wallets = data?.wallets || [];
  const [selected, setSelected] = useState(null); // hotel_id for ledger view
  const [settleFor, setSettleFor] = useState(null); // wallet row for settle modal

  const columns = useMemo(() => [
    { accessorKey: "hotels.name", header: "Hotel", cell: ({ row }) => (
      <div>
        <div style={{ fontWeight: 500 }}>{row.original.hotels?.name || "—"}</div>
        <div style={{ fontSize: 12, color: theme.MUTED }}>{row.original.hotels?.city}</div>
      </div>
    )},
    { accessorKey: "hotels.commission_percent", header: "Commission", cell: ({ row }) => `${row.original.hotels?.commission_percent || 0}%` },
    { accessorKey: "balance_cached", header: "Balance Payable", cell: ({ getValue }) => (
      <span className="serif" style={{ fontSize: 16, color: theme.SEA_DARK }}>₹{Number(getValue() || 0).toLocaleString("en-IN")}</span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setSelected(row.original.hotel_id)} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Ledger</button>
        <button onClick={() => setSettleFor(row.original)} style={{ background: theme.SEA, color: theme.CREAM, border: "none", padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><ArrowDownToLine size={12} /> Settle</button>
      </div>
    )},
  ], []);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Finance</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Wallets & Settlements</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <KPICard label="Total Payable" value={`₹${Number(summary?.totalPayable || 0).toLocaleString("en-IN")}`} icon={IndianRupee} color={theme.SEA} />
        <KPICard label="Active Wallets" value={summary?.walletCount ?? "—"} icon={Wallet} color={theme.INK} />
        <KPICard label="Hotels" value={wallets.length} icon={Building2} color="#7C6AF5" />
      </div>

      <DataTable data={wallets} columns={columns} searchPlaceholder="Search hotel..." isLoading={isLoading} emptyMessage="No wallets yet" pageSize={15} />

      {selected && <LedgerModal hotelId={selected} onClose={() => setSelected(null)} />}
      {settleFor && <SettleModal wallet={settleFor} onClose={() => setSettleFor(null)} />}
    </AdminLayout>
  );
}

function LedgerModal({ hotelId, onClose }) {
  const { data, isLoading } = useHotelWallet(hotelId);
  const ledger = data?.ledger || [];
  const fmt = d => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 720, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: `1px solid ${theme.SAND}` }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Ledger</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>
        <div style={{ padding: 28 }}>
          {isLoading ? <div style={{ color: theme.MUTED }}>Loading…</div> : ledger.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.MUTED }}>No transactions yet</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}`, textAlign: "left" }}>
                {["Date", "Type", "Description", "UTR", "Amount", "Balance"].map(h => <th key={h} style={{ padding: "8px", fontSize: 10, letterSpacing: "0.1em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ledger.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                    <td style={{ padding: "10px 8px", color: theme.MUTED }}>{fmt(e.created_at)}</td>
                    <td style={{ padding: "10px 8px" }}>{e.ref_type}</td>
                    <td style={{ padding: "10px 8px", maxWidth: 200 }}>{e.description}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11 }}>{e.utr_number || "—"}</td>
                    <td style={{ padding: "10px 8px", color: e.direction === "credit" ? theme.SEA_DARK : "#a33", fontWeight: 600 }}>
                      {e.direction === "credit" ? "+" : "−"}₹{Number(e.amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "10px 8px" }} className="serif">₹{Number(e.balance_after).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SettleModal({ wallet, onClose }) {
  const settle = useSettle();
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [err, setErr] = useState(null);
  const balance = Number(wallet.balance_cached || 0);

  const submit = async () => {
    setErr(null);
    try {
      await settle.mutateAsync({ hotel_id: wallet.hotel_id, amount: Number(amount), utr_number: utr, description: `Settlement to ${wallet.hotels?.name || "hotel"}` });
      onClose();
    } catch (e) { setErr(e.message); }
  };

  const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 440, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Record Settlement</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>
        <div style={{ padding: 14, background: "#E8F5F3", marginBottom: 20, fontSize: 13 }}>
          {wallet.hotels?.name} · Available: <strong>₹{balance.toLocaleString("en-IN")}</strong>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Amount (₹)</label><input type="number" style={inp} value={amount} onChange={e => setAmount(e.target.value)} max={balance} /></div>
          <div><label style={lbl}>UTR Number</label><input style={inp} value={utr} onChange={e => setUtr(e.target.value)} placeholder="Bank transaction reference" /></div>
          {err && <div style={{ color: "#a33", fontSize: 13, padding: 10, background: "#fff5f5" }}>{err}</div>}
          <button onClick={submit} disabled={settle.isPending || !amount} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 14, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", opacity: settle.isPending ? 0.7 : 1 }}>
            {settle.isPending ? "Recording…" : "Record Settlement"}
          </button>
        </div>
      </div>
    </div>
  );
}
