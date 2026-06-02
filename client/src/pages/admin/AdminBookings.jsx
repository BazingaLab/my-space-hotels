import { useEffect, useMemo, useState } from "react";

import AdminLayout from "./AdminLayout.jsx";

import { adminApi } from "../../lib/api.js";

import { useAdmin } from "../../context/AdminContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

import { theme } from "../../lib/theme.js";

import {
  Search,
  CalendarCheck,
  CreditCard,
  Users,
} from "lucide-react";

const statusTabs = [
  "all",
  "active",
  "upcoming",
  "closed",
  "cancelled",
];

export default function AdminBookings() {
  const { isAdmin } = useAdmin();

  const { user } = useAuth();

  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("all");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  /* =========================
     FETCH BOOKINGS
  ========================= */

  useEffect(() => {
    const fetch = isAdmin
      ? adminApi.getBookings()
      : adminApi.getOwnerBookings(
          user.id
        );

    fetch
      .then((d) =>
        setBookings(
          d.bookings || []
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, [isAdmin, user]);

  /* =========================
     FORMATTERS
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
      confirmed: {
        bg: "#E8F5F3",
        color: theme.SEA_DARK,
      },

      active: {
        bg: "#E8F5F3",
        color: theme.SEA_DARK,
      },

      upcoming: {
        bg: "#EEF4FF",
        color: "#2855AA",
      },

      pending: {
        bg: "#FFF8E6",
        color: "#A0700A",
      },

      closed: {
        bg: "#F0F0F0",
        color: "#666",
      },

      cancelled: {
        bg: "#FFF0F0",
        color: "#a33",
      },
    }[s] || {
      bg: theme.SAND,
      color: theme.MUTED,
    });

  const paymentColor = (s) =>
    ({
      paid: {
        bg: "#E8F5F3",
        color: theme.SEA_DARK,
      },

      pending: {
        bg: "#FFF8E6",
        color: "#A0700A",
      },

      refunded: {
        bg: "#FFF0F0",
        color: "#a33",
      },
    }[s] || {
      bg: theme.SAND,
      color: theme.MUTED,
    });

  /* =========================
     FILTERED BOOKINGS
  ========================= */

  const filteredBookings =
    useMemo(() => {
      return bookings.filter((b) => {
        const q =
          search.toLowerCase();

        const matchesSearch =
          !search ||
          b.guest_name
            ?.toLowerCase()
            .includes(q) ||
          b.guest_email
            ?.toLowerCase()
            .includes(q) ||
          b.hotels?.name
            ?.toLowerCase()
            .includes(q);

        const matchesStatus =
          activeTab === "all"
            ? true
            : b.booking_status ===
              activeTab;

        const matchesPayment =
          paymentFilter === "all"
            ? true
            : b.payment_status ===
              paymentFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPayment
        );
      });
    }, [
      bookings,
      search,
      activeTab,
      paymentFilter,
    ]);

  /* =========================
     KPI COUNTS
  ========================= */

  const totalRevenue =
    filteredBookings.reduce(
      (acc, b) =>
        acc +
        Number(
          b.total_price || 0
        ),
      0
    );

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
          {isAdmin
            ? "Booking Operations"
            : "Hotel Bookings"}
        </div>

        <h1
          className="serif"
          style={{
            fontSize: 48,
            fontWeight: 400,
            marginBottom: 12,
          }}
        >
          Bookings
        </h1>

        <div
          style={{
            display: "flex",
            gap: 24,
            color: theme.MUTED,
            fontSize: 14,
          }}
        >
          <span>
            Total:{" "}
            <strong>
              {
                filteredBookings.length
              }
            </strong>
          </span>

          <span>
            Revenue:{" "}
            <strong>
              ₹
              {totalRevenue.toLocaleString(
                "en-IN"
              )}
            </strong>
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* SEARCH */}
        <div
          style={{
            position: "relative",
            minWidth: 300,
          }}
        >
          <Search
            size={16}
            color={theme.MUTED}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform:
                "translateY(-50%)",
            }}
          />

          <input
            type="text"
            placeholder="Search guest, hotel or email..."
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
              background: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        {/* PAYMENT FILTER */}
        <select
          value={paymentFilter}
          onChange={(e) =>
            setPaymentFilter(
              e.target.value
            )
          }
          style={{
            padding: "12px 14px",
            border: `1px solid ${theme.SAND}`,
            background: "#fff",
            fontSize: 14,
          }}
        >
          <option value="all">
            All Payments
          </option>

          <option value="paid">
            Paid
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="refunded">
            Refunded
          </option>
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
              cursor: "pointer",
              fontSize: 13,
              textTransform:
                "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading ? (
        <div
          style={{
            color: theme.MUTED,
          }}
        >
          Loading bookings…
        </div>
      ) : filteredBookings.length ===
        0 ? (
        /* EMPTY */
        <div
          style={{
            padding: 60,
            textAlign: "center",
            background: "#fff",
            border: `1px solid ${theme.SAND}`,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 28,
              color: theme.MUTED,
            }}
          >
            No bookings found
          </div>
        </div>
      ) : (
        /* TABLE */
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
              fontSize: 14,
              minWidth: 1400,
            }}
          >
            {/* HEAD */}
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${theme.SAND}`,
                  background:
                    theme.SAND,
                }}
              >
                {[
                  "Guest",
                  "Hotel",
                  "Check-in",
                  "Check-out",
                  "Guests",
                  "Total",
                  "Booking Status",
                  "Payment",
                  "Mode",
                  "Special Request",
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
                      color:
                        theme.MUTED,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {filteredBookings.map(
                (b) => {
                  const bookingSC =
                    statusColor(
                      b.booking_status
                    );

                  const paymentSC =
                    paymentColor(
                      b.payment_status
                    );

                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: `1px solid ${theme.SAND}`,
                      }}
                    >
                      {/* GUEST */}
                      <td
                        style={{
                          padding:
                            "16px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                          }}
                        >
                          {
                            b.guest_name
                          }
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color:
                              theme.MUTED,
                            marginTop: 4,
                          }}
                        >
                          {
                            b.guest_email
                          }
                        </div>
                      </td>

                      {/* HOTEL */}
                      <td
                        style={{
                          padding:
                            "16px",
                          fontWeight: 500,
                        }}
                      >
                        {b.hotels
                          ?.name ||
                          "—"}
                      </td>

                      {/* CHECK IN */}
                      <td
                        style={{
                          padding:
                            "16px",
                          color:
                            theme.MUTED,
                        }}
                      >
                        {formatDate(
                          b.check_in
                        )}
                      </td>

                      {/* CHECK OUT */}
                      <td
                        style={{
                          padding:
                            "16px",
                          color:
                            theme.MUTED,
                        }}
                      >
                        {formatDate(
                          b.check_out
                        )}
                      </td>

                      {/* GUESTS */}
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
                            gap: 6,
                          }}
                        >
                          <Users
                            size={14}
                          />
                          {b.guests}
                        </div>
                      </td>

                      {/* TOTAL */}
                      <td
                        style={{
                          padding:
                            "16px",
                        }}
                        className="serif"
                      >
                        ₹
                        {Number(
                          b.total_price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      {/* BOOKING STATUS */}
                      <td
                        style={{
                          padding:
                            "16px",
                        }}
                      >
                        <span
                          style={{
                            background:
                              bookingSC.bg,
                            color:
                              bookingSC.color,
                            padding:
                              "6px 12px",
                            fontSize: 11,
                            letterSpacing:
                              "0.1em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {b.booking_status ||
                            b.status}
                        </span>
                      </td>

                      {/* PAYMENT STATUS */}
                      <td
                        style={{
                          padding:
                            "16px",
                        }}
                      >
                        <span
                          style={{
                            background:
                              paymentSC.bg,
                            color:
                              paymentSC.color,
                            padding:
                              "6px 12px",
                            fontSize: 11,
                            letterSpacing:
                              "0.1em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {b.payment_status ||
                            "pending"}
                        </span>
                      </td>

                      {/* PAYMENT MODE */}
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
                            gap: 6,
                            color:
                              theme.MUTED,
                          }}
                        >
                          <CreditCard
                            size={14}
                          />

                          {b.payment_mode ||
                            "Pay at Hotel"}
                        </div>
                      </td>

                      {/* SPECIAL REQUEST */}
                      <td
                        style={{
                          padding:
                            "16px",
                          color:
                            theme.MUTED,
                          maxWidth: 240,
                        }}
                      >
                        {b.special_request ||
                          "—"}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}