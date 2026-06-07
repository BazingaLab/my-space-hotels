import { useState, useMemo } from "react";
import AdminLayout from "./AdminLayout.jsx";
import DataTable from "../../shared/components/DataTable.jsx";
import StatusBadge from "../../shared/components/StatusBadge.jsx";
import KPICard from "../../shared/components/KPICard.jsx";
import { useTeam, useTeamStats, useCreateMember, useUpdateMember, useRemoveMember } from "../../features/team/hooks.jsx";
import { theme } from "../../lib/theme.js";
import { Users, UserCog, Shield, X, Plus, Trash2 } from "lucide-react";

const ROLE_LABELS = { ground_team: "Ground Team", manager: "Manager", cluster_manager: "Cluster Manager" };

export default function AdminTeam() {
  const [filter, setFilter] = useState({});
  const { data, isLoading } = useTeam(filter);
  const { data: stats } = useTeamStats();
  const members = data?.members || [];
  const [showAdd, setShowAdd] = useState(false);
  const createM = useCreateMember();
  const updateM = useUpdateMember();
  const removeM = useRemoveMember();

  const columns = useMemo(() => [
    { accessorKey: "name", header: "Name", cell: ({ row }) => (
      <div><div style={{ fontWeight: 500 }}>{row.original.name}</div><div style={{ fontSize: 12, color: theme.MUTED }}>{row.original.email}</div></div>
    )},
    { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => getValue() || "—" },
    { accessorKey: "team_role", header: "Role", cell: ({ row }) => (
      <select value={row.original.team_role} onChange={e => updateM.mutate({ id: row.original.id, patch: { team_role: e.target.value } })}
        style={{ padding: "4px 8px", border: `1px solid ${theme.SAND}`, fontSize: 12, background: "#fff" }}>
        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    )},
    { accessorKey: "region", header: "Region", cell: ({ getValue }) => getValue() || "—" },
    { accessorKey: "manager.name", header: "Reports To", cell: ({ row }) => row.original.manager?.name || "—" },
    { accessorKey: "is_active", header: "Status", cell: ({ getValue }) => <StatusBadge value={getValue() ? "active" : "inactive"} /> },
    { id: "actions", header: "", cell: ({ row }) => (
      <button onClick={() => { if (window.confirm("Remove this team member?")) removeM.mutate(row.original.id); }}
        style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "6px 10px", fontSize: 12, cursor: "pointer" }}><Trash2 size={12} /></button>
    )},
  ], [updateM, removeM]);

  const tabs = [
    { key: "", label: "All" },
    { key: "ground_team", label: "Ground Team" },
    { key: "manager", label: "Managers" },
    { key: "cluster_manager", label: "Cluster Managers" },
  ];

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Management</div>
          <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Team</h1>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: "12px 24px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KPICard label="Total Staff" value={stats?.total ?? 0} icon={Users} color={theme.INK} />
        <KPICard label="Ground Team" value={stats?.byRole?.ground_team ?? 0} icon={Users} color={theme.SEA} />
        <KPICard label="Managers" value={stats?.byRole?.manager ?? 0} icon={UserCog} color="#F5A623" />
        <KPICard label="Cluster Managers" value={stats?.byRole?.cluster_manager ?? 0} icon={Shield} color="#7C6AF5" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {tabs.map(t => {
          const active = (filter.role || "") === t.key;
          return <button key={t.key || "all"} onClick={() => setFilter(t.key ? { role: t.key } : {})} style={{ padding: "8px 18px", border: `1px solid ${active ? theme.INK : theme.SAND}`, background: active ? theme.INK : "transparent", color: active ? theme.CREAM : theme.INK, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{t.label}</button>;
        })}
      </div>

      <DataTable data={members} columns={columns} searchPlaceholder="Search name, email, region..." isLoading={isLoading} emptyMessage="No team members yet" pageSize={15} />

      {showAdd && <AddModal onClose={() => setShowAdd(false)} mutation={createM} members={members} />}
    </AdminLayout>
  );
}

function AddModal({ onClose, mutation, members }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", team_role: "ground_team", region: "", reports_to: "" });
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const submit = async () => {
    setErr(null);
    try {
      await mutation.mutateAsync({ ...form, reports_to: form.reports_to || null });
      onClose();
    } catch (e) { setErr(e.message); }
  };
  const inp = { width: "100%", padding: "11px 14px", border: `1px solid ${theme.SAND}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };
  const lbl = { fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600 };
  const managers = members.filter(m => m.team_role !== "ground_team");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 480, padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Add Team Member</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Name *</label><input style={inp} value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Email</label><input type="email" style={inp} value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Role</label>
              <select style={inp} value={form.team_role} onChange={e => set("team_role", e.target.value)}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Region</label><input style={inp} value={form.region} onChange={e => set("region", e.target.value)} placeholder="e.g. Goa" /></div>
          </div>
          <div><label style={lbl}>Reports To</label>
            <select style={inp} value={form.reports_to} onChange={e => set("reports_to", e.target.value)}>
              <option value="">— None —</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({ROLE_LABELS[m.team_role]})</option>)}
            </select>
          </div>
          {err && <div style={{ color: "#a33", fontSize: 13, padding: 10, background: "#fff5f5" }}>{err}</div>}
          <button onClick={submit} disabled={mutation.isPending || !form.name} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 14, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", opacity: form.name ? 1 : 0.5 }}>
            {mutation.isPending ? "Adding…" : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
