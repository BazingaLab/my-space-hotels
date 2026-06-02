import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import DataTable from "../../shared/components/DataTable.jsx";
import StatusBadge from "../../shared/components/StatusBadge.jsx";
import KPICard from "../../shared/components/KPICard.jsx";
import { useCustomers, useCustomerStats } from "../../features/customers/hooks.jsx";
import { theme } from "../../lib/theme.js";
import { Users, Crown, Star, IndianRupee, Eye, Gift } from "lucide-react";

const CLASS_STYLE = {
  Premium: { bg: "#FFF4E0", color: "#B8860B" },
  Regular: { bg: "#E8F5F3", color: "#1F6B61" },
  Basic: { bg: "#F0EAE0", color: "#6B7670" },
};

export default function AdminCustomers() {
  const [filter, setFilter] = useState({});
  const { data, isLoading } = useCustomers(filter);
  const { data: stats } = useCustomerStats();
  const navigate = useNavigate();
  const customers = data?.customers || [];

  const columns = useMemo(() => [
    {
      accessorKey: "name", header: "Customer",
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.original.name || "—"}</div>
          <div style={{ fontSize: 12, color: theme.MUTED }}>{row.original.email}</div>
        </div>
      ),
    },
    { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => getValue() || "—" },
    {
      accessorKey: "classification", header: "Tier",
      cell: ({ getValue }) => {
        const s = CLASS_STYLE[getValue()] || CLASS_STYLE.Basic;
        return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{getValue()}</span>;
      },
    },
    { accessorKey: "total_bookings", header: "Bookings", cell: ({ getValue }) => getValue() || 0 },
    {
      accessorKey: "total_spent", header: "Spent",
      cell: ({ getValue }) => <span className="serif" style={{ color: theme.SEA_DARK }}>₹{Number(getValue() || 0).toLocaleString("en-IN")}</span>,
    },
    {
      accessorKey: "loyalty_points", header: "Points",
      cell: ({ getValue }) => <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Gift size={12} color={theme.SEA} /> {getValue() || 0}</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <button onClick={() => navigate(`/admin/customers/${row.original.id}`)} style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={12} /> View
        </button>
      ),
    },
  ], [navigate]);

  const tabs = [
    { key: "", label: "All" },
    { key: "Basic", label: "Basic" },
    { key: "Regular", label: "Regular" },
    { key: "Premium", label: "Premium" },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Relationships</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Customers</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KPICard label="Total Customers" value={stats?.total ?? "—"} icon={Users} color={theme.INK} />
        <KPICard label="Premium" value={stats?.byClass?.Premium ?? 0} icon={Crown} color="#B8860B" />
        <KPICard label="Lifetime Revenue" value={`₹${Number(stats?.totalRevenue || 0).toLocaleString("en-IN")}`} icon={IndianRupee} color={theme.SEA} />
        <KPICard label="Points Issued" value={Number(stats?.totalPoints || 0).toLocaleString("en-IN")} icon={Star} color="#E87C4E" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {tabs.map(t => {
          const active = (filter.classification || "") === t.key;
          return (
            <button key={t.key || "all"} onClick={() => setFilter(t.key ? { classification: t.key } : {})}
              style={{ padding: "8px 18px", border: `1px solid ${active ? theme.INK : theme.SAND}`, background: active ? theme.INK : "transparent", color: active ? theme.CREAM : theme.INK, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <DataTable data={customers} columns={columns} searchPlaceholder="Search name, email, phone..." isLoading={isLoading} emptyMessage="No customers yet" pageSize={15} />
    </AdminLayout>
  );
}
