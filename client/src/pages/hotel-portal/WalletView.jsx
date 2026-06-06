import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import { useHotelWallet } from "../../features/wallets/hooks.jsx";
import { theme } from "../../lib/theme.js";
import { Wallet, TrendingUp, ArrowDownToLine } from "lucide-react";

export default function WalletView() {
  const { myHotel } = useHotelPortal();
  const { data, isLoading } = useHotelWallet(myHotel?.id);
  const wallet = data?.wallet;
  const ledger = data?.ledger || [];

  const fmt = d => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const totalEarned = ledger.filter(e => e.direction === "credit").reduce((s, e) => s + Number(e.amount), 0);
  const totalSettled = ledger.filter(e => e.direction === "debit").reduce((s, e) => s + Number(e.amount), 0);

  if (!myHotel) return (
    <HotelPortalLayout>
      <div style={{ padding: 40, color: theme.MUTED }}>No property found.</div>
    </HotelPortalLayout>
  );

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Finance</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>My Wallet</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <div style={{ background: theme.SEA_DEEP, padding: 28, color: theme.CREAM }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Available Balance</span>
            <Wallet size={18} />
          </div>
          <div className="serif" style={{ fontSize: 40, fontWeight: 500 }}>₹{Number(wallet?.balance_cached || 0).toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Pending settlement from My Space Hotels</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: theme.MUTED }}>Total Earned</span>
            <TrendingUp size={18} color={theme.SEA} />
          </div>
          <div className="serif" style={{ fontSize: 36, color: theme.SEA_DARK }}>₹{totalEarned.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: theme.MUTED }}>Total Settled</span>
            <ArrowDownToLine size={18} color="#7C6AF5" />
          </div>
          <div className="serif" style={{ fontSize: 36 }}>₹{totalSettled.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 28 }}>
        <h2 className="serif" style={{ fontSize: 24, marginBottom: 20 }}>Transaction History</h2>
        {isLoading ? <div style={{ color: theme.MUTED }}>Loading…</div> : ledger.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: theme.MUTED }}>No transactions yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `2px solid ${theme.SAND}`, textAlign: "left" }}>
              {["Date", "Type", "Description", "UTR", "Amount", "Balance"].map(h => <th key={h} style={{ padding: "10px 8px", fontSize: 10, letterSpacing: "0.1em", color: theme.MUTED, textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ledger.map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${theme.SAND}` }}>
                  <td style={{ padding: "12px 8px", color: theme.MUTED }}>{fmt(e.created_at)}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ background: e.direction === "credit" ? "#E8F5F3" : "#F0EAFF", color: e.direction === "credit" ? theme.SEA_DARK : "#7C6AF5", padding: "2px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {e.ref_type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", maxWidth: 240 }}>{e.description}</td>
                  <td style={{ padding: "12px 8px", fontSize: 11 }}>{e.utr_number || "—"}</td>
                  <td style={{ padding: "12px 8px", color: e.direction === "credit" ? theme.SEA_DARK : "#a33", fontWeight: 600 }}>
                    {e.direction === "credit" ? "+" : "−"}₹{Number(e.amount).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "12px 8px" }} className="serif">₹{Number(e.balance_after).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </HotelPortalLayout>
  );
}