import { useState, useMemo } from "react";
import { useComplaints, useResolveComplaint, useUpdateComplaint } from "./hooks.jsx";
import AdminLayout from "../../pages/admin/AdminLayout.jsx";
import DataTable from "../../shared/components/DataTable.jsx";
import StatusBadge from "../../shared/components/StatusBadge.jsx";
import KPICard from "../../shared/components/KPICard.jsx";
import { MessageSquareWarning, CheckCircle2, Clock, AlertCircle, X, Eye } from "lucide-react";

const theme = {
  SEA: "#2E8B7F", SEA_DARK: "#1F6B61", SAND: "#F0EAE0",
  INK: "#15201E", MUTED: "#6B7670", CREAM: "#FAF7F2",
};

export default function AdminComplaints() {
  const [filter, setFilter] = useState({});
  const [selected, setSelected] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");

  const { data, isLoading, error } = useComplaints(filter);
  const complaints = data?.complaints || [];

  const resolveMutation = useResolveComplaint();
  const updateMutation = useUpdateComplaint();

  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter(c => (c.resolution_status || "open") === "open").length,
    inProgress: complaints.filter(c => c.resolution_status === "in_progress").length,
    resolved: complaints.filter(c => c.resolution_status === "resolved").length,
  }), [complaints]);

  const handleResolve = async () => {
    if (!selected) return;
    await resolveMutation.mutateAsync({ id: selected.id, notes: resolveNotes });
    setSelected(null);
    setResolveNotes("");
  };

  const handlePriority = async (id, priority) => {
    await updateMutation.mutateAsync({ id, patch: { priority } });
  };

  // Columns match YOUR actual schema
  const columns = useMemo(() => [
    {
      accessorKey: "complaint_id",
      header: "ID",
      cell: ({ getValue }) => (
        <code style={{ fontSize: 11, color: theme.SEA_DARK, background: theme.SAND, padding: "2px 6px" }}>
          {getValue() || "—"}
        </code>
      ),
    },
    {
      accessorKey: "issue_type",
      header: "Issue",
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.original.issue_type || "—"}</div>
          {row.original.notes && (
            <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.original.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "guest_name",
      header: "Guest",
      cell: ({ row }) => (
        <div style={{ fontSize: 13 }}>{row.original.guest_name || "—"}</div>
      ),
    },
    {
      accessorKey: "hotel_name",
      header: "Hotel",
      cell: ({ row }) => row.original.hotels?.name || row.original.hotel_name || "—",
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <select
          value={row.original.priority || "medium"}
          onChange={(e) => handlePriority(row.original.id, e.target.value)}
          style={{ padding: "4px 8px", border: `1px solid ${theme.SAND}`, fontSize: 12, background: "#fff" }}
        >
          {["low", "medium", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      ),
    },
    {
      accessorKey: "resolution_status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge value={getValue() || "open"} />,
    },
    {
      accessorKey: "created_at",
      header: "Submitted",
      cell: ({ getValue }) => (
        <span style={{ fontSize: 12, color: theme.MUTED }}>
          {new Date(getValue()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => setSelected(row.original)}
          style={{ background: "transparent", border: `1px solid ${theme.SAND}`, padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Eye size={12} /> View
        </button>
      ),
    },
  ], []);

  const filterTabs = [
    { key: "", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Customer Service</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Complaints</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KPICard label="Total" value={stats.total} icon={MessageSquareWarning} color={theme.INK} />
        <KPICard label="Open" value={stats.open} icon={AlertCircle} color="#a33" />
        <KPICard label="In Progress" value={stats.inProgress} icon={Clock} color="#A0700A" />
        <KPICard label="Resolved" value={stats.resolved} icon={CheckCircle2} color={theme.SEA} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {filterTabs.map(tab => {
          const active = (filter.status || "") === tab.key;
          return (
            <button
              key={tab.key || "all"}
              onClick={() => setFilter(tab.key ? { status: tab.key } : {})}
              style={{
                padding: "8px 18px",
                border: `1px solid ${active ? theme.INK : theme.SAND}`,
                background: active ? theme.INK : "transparent",
                color: active ? theme.CREAM : theme.INK,
                fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fff5f5", border: "1px solid #fcc", color: "#a33", marginBottom: 16, fontSize: 13 }}>
          Failed to load complaints: {error.message}
        </div>
      )}

      <DataTable
        data={complaints}
        columns={columns}
        searchPlaceholder="Search complaints..."
        isLoading={isLoading}
        emptyMessage="No complaints found"
        pageSize={15}
      />

      {/* Detail / resolve modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: theme.CREAM, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: `1px solid ${theme.SAND}` }}>
              <h2 className="serif" style={{ fontSize: 24, fontWeight: 400 }}>Complaint #{selected.complaint_id}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Issue Type</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{selected.issue_type || "—"}</div>
              </div>
              {selected.notes && (
                <div>
                  <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "#4A5856" }}>{selected.notes}</div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Guest</div>
                  <div style={{ fontSize: 13 }}>{selected.guest_name || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Hotel</div>
                  <div style={{ fontSize: 13 }}>{selected.hotels?.name || selected.hotel_name || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Priority</div>
                  <StatusBadge value={selected.priority || "medium"} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Status</div>
                  <StatusBadge value={selected.resolution_status || "open"} />
                </div>
              </div>

              {selected.resolution_status !== "resolved" && (
                <div style={{ paddingTop: 16, borderTop: `1px solid ${theme.SAND}` }}>
                  <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Resolution Notes</div>
                  <textarea
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="What action was taken?"
                    style={{ width: "100%", padding: 14, border: `1px solid ${theme.SAND}`, fontSize: 14, minHeight: 100, resize: "vertical", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
                  />
                  <button
                    onClick={handleResolve}
                    disabled={resolveMutation.isPending || !resolveNotes.trim()}
                    style={{
                      marginTop: 12, background: theme.SEA, color: theme.CREAM, border: "none",
                      padding: "12px 24px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
                      cursor: resolveMutation.isPending ? "not-allowed" : "pointer",
                      opacity: resolveMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {resolveMutation.isPending ? "Resolving…" : "Mark Resolved"}
                  </button>
                </div>
              )}

              {selected.resolution_status === "resolved" && selected.notes && (
                <div style={{ padding: 16, background: "#E8F5F3", border: `1px solid ${theme.SEA}33` }}>
                  <div style={{ fontSize: 11, color: theme.SEA_DARK, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Resolution</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{selected.notes}</div>
                  {selected.resolved_at && (
                    <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 8 }}>
                      Resolved {new Date(selected.resolved_at).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}