import { useMemo } from "react";
import AdminLayout from "./AdminLayout.jsx";
import DataTable from "../../shared/components/DataTable.jsx";
import KPICard from "../../shared/components/KPICard.jsx";
import { useCommissionReport } from "../../features/wallets/hooks.jsx";
import { theme } from "../../lib/theme.js";
import { BarChart3, IndianRupee, Percent, Star } from "lucide-react";

export default function AdminCommissions() {
  const { data, isLoading } = useCommissionReport();
  const hotels = data?.hotels || [];
  const totals = data?.totals || {};

  const columns = useMemo(() => [
    { accessorKey: "hotel_name", header: "Hotel", cell: ({ row }) => (
      <div>
        <div style={{ fontWeight: 500 }}>{row.original.hotel_name}</div>
        <div style={{ fontSize: 12, color: theme.MUTED }}>{row.original.city}</div>
      </div>
    )},
    { accessorKey: "standard_rate", header: "Rate", cell: ({ getValue }) => `${getValue()}%` },
    { accessorKey: "bookings", header: "Bookings" },
    { accessorKey: "gross_revenue", header: "Gross Revenue", cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString("en-IN")}` },
    { accessorKey: "commission_collected", header: "Commission Collected", cell: ({ getValue }) => (
      <span className="serif" style={{ fontSize: 15, color: theme.SEA_DARK }}>₹{Number(getValue() || 0).toLocaleString("en-IN")}</span>
    )},
    { accessorKey: "good_biz_eligible", header: "Good-biz Status", cell: ({ getValue }) => getValue() ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#E8F5F3", color: theme.SEA_DARK, padding: "4px 10px", fontSize: 12 }}>
        <Star size={11} /> Eligible
      </span>
    ) : <span style={{ color: theme.MUTED, fontSize: 12 }}>—</span> },
  ], []);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Finance</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Commission Report</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KPICard label="Commission Collected" value={`₹${Number(totals.commission_collected || 0).toLocaleString("en-IN")}`} icon={IndianRupee} color={theme.SEA} />
        <KPICard label="Gross Revenue" value={`₹${Number(totals.gross_revenue || 0).toLocaleString("en-IN")}`} icon={BarChart3} color={theme.INK} />
        <KPICard label="Total Bookings" value={totals.bookings ?? "—"} icon={Percent} color="#7C6AF5" />
        <KPICard label="Good-biz Eligible Hotels" value={totals.eligible_hotels ?? "—"} icon={Star} color="#A0700A" />
      </div>

      <div style={{ padding: 16, background: "#FFF8E7", border: "1px solid #E8C97A", marginBottom: 24, fontSize: 13, color: "#8A6D1F" }}>
        "Eligible" means a hotel has been active 6+ months or has 20+ confirmed bookings — it's a signal, not an automatic discount. The commission rate is always whatever you've set manually on that hotel.
      </div>

      <DataTable data={hotels} columns={columns} searchPlaceholder="Search hotel..." isLoading={isLoading} emptyMessage="No commission data yet" pageSize={15} />
    </AdminLayout>
  );
}