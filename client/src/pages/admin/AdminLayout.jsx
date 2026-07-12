import {
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Hotel,
  CalendarCheck,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  Wallet,
  ShieldAlert,
  Briefcase,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { useAdmin } from "../../context/AdminContext.jsx";
import Logo from "../../components/Logo.jsx";

import { theme } from "../../lib/theme.js";

/* =========================
   SIDEBAR NAVIGATION
========================= */

const navSections = [
  {
    section: "Overview",
    items: [
      {
        path: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        adminOnly: false,
      },
      {
        path: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        adminOnly: true,
      },
    ],
  },

  {
    section: "Operations",
    items: [
      {
        path: "/admin/hotels",
        label: "Hotels",
        icon: Hotel,
        adminOnly: false,
      },
      {
        path: "/admin/hotels/new",
        label: "Add Hotel",
        icon: Hotel,
        adminOnly: true,
      },
      {
        path: "/admin/bookings",
        label: "Bookings",
        icon: CalendarCheck,
        adminOnly: false,
      },
      {
        path: "/admin/customers",
        label: "Customers",
        icon: Users,
        adminOnly: false,
      },
      {
        path: "/admin/complaints",
        label: "Complaints",
        icon: ShieldAlert,
        adminOnly: false,
      },
    ],
  },

  {
    section: "Finance",
    items: [
      {
        path: "/admin/wallets",
        label: "Wallets",
        icon: Wallet,
        adminOnly: true,
      },
      {
        path: "/admin/commissions",
        label: "Commissions",
        icon: BarChart3,
        adminOnly: true,
      },
    ],
  },

  {
    section: "Management",
    items: [
      {
        path: "/admin/owners",
        label: "Owners",
        icon: Users,
        adminOnly: true,
      },
      {
        path: "/admin/team",
        label: "Team",
        icon: Briefcase,
        adminOnly: true,
      },
      {
        path: "/admin/pending",
        label: "Pending Approvals",
        icon: Hotel,
        adminOnly: true,
      },
    ],
  },
];

/* =========================
   ADMIN LAYOUT
========================= */

export default function AdminLayout({
  children,
  requireSuper = false,
}) {
  const { user, signOut } = useAuth();

  const {
    role,
    isAdmin,
    isHotelAdmin,
    loading,
  } = useAdmin();

  const location = useLocation();
  const navigate = useNavigate();

  /* =========================
     AUTH PROTECTION
  ========================= */

  if (loading) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: "center",
          color: theme.MUTED,
        }}
      >
        <div
          className="serif"
          style={{
            fontSize: 28,
          }}
        >
          Loading…
        </div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // NOT ADMIN/HOTEL ADMIN
  if (!isHotelAdmin && !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // SUPER ADMIN ONLY ROUTES
  if (requireSuper && !isAdmin) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: "center",
        }}
      >
        <h2
          className="serif"
          style={{
            fontSize: 36,
            color: "#a33",
          }}
        >
          Access Denied
        </h2>

        <p
          style={{
            marginTop: 12,
            color: theme.MUTED,
          }}
        >
          You do not have permission
          to access this section.
        </p>
      </div>
    );
  }

  /* =========================
     SIGN OUT
  ========================= */

  const handleSignOut =
    async () => {
      await signOut();

      navigate("/admin/login");
    };

  /* =========================
     LAYOUT
  ========================= */

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F5F5F0",
      }}
    >
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        style={{
          width: 270,
          background: theme.INK,
          color: theme.CREAM,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 100,
          overflowY: "auto",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            padding: "32px 24px",
            borderBottom:
              "1px solid #2A3835",
          }}
        >
          <Logo subtitle={isAdmin ? "SUPER ADMIN" : "HOTEL ADMIN"} subtitleColor={theme.SEA} chip />
        </div>

        {/* NAVIGATION */}
        <nav
          style={{
            flex: 1,
            padding: "24px 16px",
          }}
        >
          {navSections.map(
            (section) => (
              <div
                key={section.section}
                style={{
                  marginBottom: 28,
                }}
              >
                {/* SECTION TITLE */}
                <div
                  style={{
                    fontSize: 11,
                    color: "#6F7C78",
                    letterSpacing:
                      "0.15em",
                    textTransform:
                      "uppercase",
                    marginBottom: 10,
                    padding: "0 16px",
                  }}
                >
                  {section.section}
                </div>

                {/* NAV ITEMS */}
                {section.items
                  .filter(
                    (item) =>
                      !item.adminOnly ||
                      isAdmin
                  )
                  .map((item) => {
                    const active =
                      location.pathname ===
                      item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 12,
                          padding:
                            "12px 16px",
                          marginBottom: 4,
                          textDecoration:
                            "none",
                          color: active
                            ? theme.CREAM
                            : "#8A9994",
                          background:
                            active
                              ? theme.SEA_DEEP
                              : "transparent",
                          fontSize: 14,
                          borderRadius: 2,
                          transition:
                            "all 0.2s",
                        }}
                      >
                        <item.icon
                          size={18}
                        />

                        {item.label}

                        {active && (
                          <ChevronRight
                            size={14}
                            style={{
                              marginLeft:
                                "auto",
                            }}
                          />
                        )}
                      </Link>
                    );
                  })}
              </div>
            )
          )}
        </nav>

        {/* FOOTER */}
        <div
          style={{
            padding: "20px 24px",
            borderTop:
              "1px solid #2A3835",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8A9994",
              marginBottom: 4,
              wordBreak: "break-word",
            }}
          >
            {user?.email}
          </div>

          <div
            style={{
              fontSize: 11,
              color: theme.SEA,
              letterSpacing: "0.1em",
              textTransform:
                "uppercase",
              marginBottom: 16,
            }}
          >
            {role}
          </div>

          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background:
                "transparent",
              border:
                "1px solid #3A4845",
              color: "#8A9994",
              padding: "10px 16px",
              fontSize: 12,
              cursor: "pointer",
              width: "100%",
              fontFamily:
                "Inter, sans-serif",
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main
        style={{
          marginLeft: 270,
          flex: 1,
          padding: 32,
          maxWidth: "1600px",
        }}
      >
        {/* TOPBAR */}
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <div
              className="serif"
              style={{
                fontSize: 34,
                color: theme.INK,
              }}
            >
              Admin Dashboard
            </div>

            <div
              style={{
                fontSize: 13,
                color: theme.MUTED,
                marginTop: 4,
              }}
            >
              Manage hotels, bookings,
              finance and operations
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
              color: theme.MUTED,
            }}
          >
            {user?.email}
          </div>
        </div>

        {/* PAGE CONTENT */}
        {children}
      </main>
    </div>
  );
}