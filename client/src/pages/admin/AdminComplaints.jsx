import { useEffect, useMemo, useState } from "react";

import AdminLayout from "./AdminLayout.jsx";

import { theme } from "../../lib/theme.js";

import { adminApi } from "../../lib/api.js";

import { supabase } from "../../lib/supabase.js";

import {
  Search,
  ShieldAlert,
  User,
  Building2,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Eye,
  UserPlus,
} from "lucide-react";

/* =========================
   FILTERS
========================= */

const statusTabs = [
  "all",
  "open",
  "in_progress",
  "resolved",
  "escalated",
  "closed",
];

const priorityOptions = [
  "all",
  "low",
  "medium",
  "high",
  "critical",
];

/* =========================
   COMPONENT
========================= */

export default function AdminComplaints() {
  const [complaints, setComplaints] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("all");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("all");

  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  /* =========================
     FETCH DATA
  ========================= */

  const fetchComplaints = async () => {
    try {
      const d =
        await adminApi.getComplaints();

      setComplaints(
        d.complaints || []
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* =========================
     HELPERS
  ========================= */

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  const statusColor = (s) =>
    ({
      open: {
        bg: "#FFF8E6",
        color: "#A0700A",
      },

      in_progress: {
        bg: "#EEF4FF",
        color: "#2855AA",
      },

      resolved: {
        bg: "#E8F5F3",
        color: theme.SEA_DARK,
      },

      escalated: {
        bg: "#FFF0F0",
        color: "#a33",
      },

      closed: {
        bg: "#F2F2F2",
        color: "#666",
      },
    }[s] || {
      bg: theme.SAND,
      color: theme.MUTED,
    });

  const priorityColor = (p) =>
    ({
      low: {
        bg: "#F2F2F2",
        color: "#666",
      },

      medium: {
        bg: "#FFF8E6",
        color: "#A0700A",
      },

      high: {
        bg: "#FFF0F0",
        color: "#C0392B",
      },

      critical: {
        bg: "#3B0D0D",
        color: "#fff",
      },
    }[p] || {
      bg: theme.SAND,
      color: theme.MUTED,
    });

  /* =========================
     FILTERING
  ========================= */

  const filteredComplaints =
    useMemo(() => {
      return complaints.filter((c) => {
        const q =
          search.toLowerCase();

        const matchesSearch =
          !search ||
          c.guest_name
            ?.toLowerCase()
            .includes(q) ||
          c.hotel_name
            ?.toLowerCase()
            .includes(q) ||
          c.issue_type
            ?.toLowerCase()
            .includes(q);

        const matchesStatus =
          activeTab === "all"
            ? true
            : c.resolution_status ===
              activeTab;

        const matchesPriority =
          priorityFilter === "all"
            ? true
            : c.priority ===
              priorityFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );
      });
    }, [
      complaints,
      search,
      activeTab,
      priorityFilter,
    ]);

  /* =========================
     KPI
  ========================= */

  const stats = {
    total: complaints.length,

    open: complaints.filter(
      (c) =>
        c.resolution_status ===
        "open"
    ).length,

    critical: complaints.filter(
      (c) =>
        c.priority ===
        "critical"
    ).length,

    resolved: complaints.filter(
      (c) =>
        c.resolution_status ===
        "resolved"
    ).length,
  };

  /* =========================
     ACTIONS
  ========================= */

  const updateComplaintStatus =
    async (id, status) => {
      try {
        setActionLoading(true);

        const { error } =
          await supabase
            .from("complaints")
            .update({
              resolution_status:
                status,

              resolved_at:
                status ===
                "resolved"
                  ? new Date()
                  : null,
            })
            .eq("id", id);

        if (error) throw error;

        fetchComplaints();
      } catch (err) {
        alert(
          err.message
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =========================
     UI
  ========================= */

  return (
    <AdminLayout>
      {/* HEADER */}
      <div
        style={{
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            color: theme.SEA_DARK,
            marginBottom: 8,
            textTransform:
              "uppercase",
          }}
        >
          Support Operations
        </div>

        <h1
          className="serif"
          style={{
            fontSize: 48,
            fontWeight: 400,
            marginBottom: 18,
          }}
        >
          Complaints
        </h1>

        {/* KPI */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              label:
                "Total Complaints",
              value: stats.total,
              icon: ShieldAlert,
            },

            {
              label:
                "Open Complaints",
              value: stats.open,
              icon: Clock3,
            },

            {
              label:
                "Critical Issues",
              value:
                stats.critical,
              icon: AlertTriangle,
            },

            {
              label:
                "Resolved",
              value:
                stats.resolved,
              icon:
                CheckCircle2,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background:
                  "#fff",
                border: `1px solid ${theme.SAND}`,
                padding: 22,
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: 18,
                }}
              >
                <card.icon
                  size={18}
                  color={
                    theme.SEA_DARK
                  }
                />

                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                >
                  {card.value}
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color:
                    theme.MUTED,
                }}
              >
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* SEARCH */}
        <div
          style={{
            position: "relative",
            minWidth: 320,
          }}
        >
          <Search
            size={16}
            color={theme.MUTED}
            style={{
              position:
                "absolute",
              left: 14,
              top: "50%",
              transform:
                "translateY(-50%)",
            }}
          />

          <input
            type="text"
            placeholder="Search complaint..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding:
                "12px 16px 12px 42px",
              border: `1px solid ${theme.SAND}`,
              background:
                "#fff",
              fontSize: 14,
            }}
          />
        </div>

        {/* PRIORITY FILTER */}
        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(
              e.target.value
            )
          }
          style={{
            padding:
              "12px 14px",
            border: `1px solid ${theme.SAND}`,
            background:
              "#fff",
            fontSize: 14,
          }}
        >
          {priorityOptions.map(
            (p) => (
              <option
                key={p}
                value={p}
              >
                {p === "all"
                  ? "All Priorities"
                  : p}
              </option>
            )
          )}
        </select>
      </div>

      {/* STATUS TABS */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() =>
              setActiveTab(tab)
            }
            style={{
              padding:
                "10px 16px",
              border:
                activeTab === tab
                  ? `1px solid ${theme.SEA}`
                  : `1px solid ${theme.SAND}`,
              background:
                activeTab === tab
                  ? theme.SEA
                  : "#fff",
              color:
                activeTab === tab
                  ? theme.CREAM
                  : theme.INK,
              cursor:
                "pointer",
              fontSize: 13,
              textTransform:
                "capitalize",
            }}
          >
            {tab.replace(
              "_",
              " "
            )}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${theme.SAND}`,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            minWidth: 1400,
          }}
        >
          <thead>
            <tr
              style={{
                background:
                  theme.SAND,
                borderBottom: `2px solid ${theme.SAND}`,
              }}
            >
              {[
                "Complaint ID",
                "Guest",
                "Hotel",
                "Issue",
                "Priority",
                "Status",
                "Created",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign:
                      "left",
                    padding:
                      "14px 16px",
                    fontSize: 11,
                    letterSpacing:
                      "0.15em",
                    textTransform:
                      "uppercase",
                    color:
                      theme.MUTED,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredComplaints.map(
              (c) => {
                const sc =
                  statusColor(
                    c.resolution_status
                  );

                const pc =
                  priorityColor(
                    c.priority
                  );

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${theme.SAND}`,
                    }}
                  >
                    <td
                      style={{
                        padding:
                          "16px",
                        fontWeight: 600,
                      }}
                    >
                      {
                        c.complaint_id
                      }
                    </td>

                    <td
                      style={{
                        padding:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                        }}
                      >
                        <User
                          size={14}
                        />

                        <span>
                          {
                            c.guest_name
                          }
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        padding:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                        }}
                      >
                        <Building2
                          size={14}
                        />

                        <span>
                          {
                            c.hotel_name
                          }
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        padding:
                          "16px",
                        color:
                          theme.MUTED,
                      }}
                    >
                      {
                        c.issue_type
                      }
                    </td>

                    <td
                      style={{
                        padding:
                          "16px",
                      }}
                    >
                      <span
                        style={{
                          background:
                            pc.bg,
                          color:
                            pc.color,
                          padding:
                            "6px 12px",
                          fontSize: 11,
                          letterSpacing:
                            "0.1em",
                          textTransform:
                            "uppercase",
                        }}
                      >
                        {
                          c.priority
                        }
                      </span>
                    </td>

                    <td
                      style={{
                        padding:
                          "16px",
                      }}
                    >
                      <span
                        style={{
                          background:
                            sc.bg,
                          color:
                            sc.color,
                          padding:
                            "6px 12px",
                          fontSize: 11,
                          letterSpacing:
                            "0.1em",
                          textTransform:
                            "uppercase",
                        }}
                      >
                        {c.resolution_status?.replace(
                          "_",
                          " "
                        )}
                      </span>
                    </td>

                    <td
                      style={{
                        padding:
                          "16px",
                        color:
                          theme.MUTED,
                      }}
                    >
                      {formatDate(
                        c.created_at
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td
                      style={{
                        padding:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 10,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          onClick={() =>
                            setSelectedComplaint(
                              c
                            )
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 6,
                            padding:
                              "8px 12px",
                            border: `1px solid ${theme.SAND}`,
                            background:
                              "#fff",
                            cursor:
                              "pointer",
                            fontSize: 12,
                          }}
                        >
                          <Eye
                            size={13}
                          />
                          View
                        </button>

                        {c.resolution_status !==
                          "resolved" && (
                          <button
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              updateComplaintStatus(
                                c.id,
                                "resolved"
                              )
                            }
                            style={{
                              padding:
                                "8px 12px",
                              border:
                                "none",
                              background:
                                theme.SEA,
                              color:
                                theme.CREAM,
                              cursor:
                                "pointer",
                              fontSize: 12,
                            }}
                          >
                            Resolve
                          </button>
                        )}

                        {c.resolution_status ===
                          "open" && (
                          <button
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              updateComplaintStatus(
                                c.id,
                                "in_progress"
                              )
                            }
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 6,
                              padding:
                                "8px 12px",
                              border:
                                "none",
                              background:
                                "#EEF4FF",
                              color:
                                "#2855AA",
                              cursor:
                                "pointer",
                              fontSize: 12,
                            }}
                          >
                            <UserPlus
                              size={13}
                            />
                            Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL PANEL */}
      {selectedComplaint && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 460,
            height: "100vh",
            background: "#fff",
            borderLeft: `1px solid ${theme.SAND}`,
            zIndex: 999,
            overflowY: "auto",
            padding: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <h2
              className="serif"
              style={{
                fontSize: 34,
              }}
            >
              Complaint
            </h2>

            <button
              onClick={() =>
                setSelectedComplaint(
                  null
                )
              }
              style={{
                border: "none",
                background:
                  "transparent",
                cursor:
                  "pointer",
                fontSize: 24,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 22,
            }}
          >
            {[
              [
                "Complaint ID",
                selectedComplaint.complaint_id,
              ],

              [
                "Guest",
                selectedComplaint.guest_name,
              ],

              [
                "Hotel",
                selectedComplaint.hotel_name,
              ],

              [
                "Issue",
                selectedComplaint.issue_type,
              ],

              [
                "Priority",
                selectedComplaint.priority,
              ],

              [
                "Status",
                selectedComplaint.resolution_status,
              ],

              [
                "Created",
                formatDate(
                  selectedComplaint.created_at
                ),
              ],

              [
                "Notes",
                selectedComplaint.notes ||
                  "No description provided.",
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing:
                      "0.15em",
                    color:
                      theme.MUTED,
                    textTransform:
                      "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {k}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}