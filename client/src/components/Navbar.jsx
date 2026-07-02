import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// 1. Imported your exact logo file from the assets folder
import logoImg from "../assets/my_space_hotels_logo.png";

import {
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

import { theme } from "../lib/theme.js";

import { useAuth } from "../context/AuthContext.jsx";
import { useAdmin } from "../context/AdminContext.jsx";

export default function Navbar() {
  const { user, signOut } = useAuth();

  const {
    isAdmin,
    isHotelAdmin,
    loading: roleLoading,
  } = useAdmin();

  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const handleSignOut = async () => {
    await signOut();

    setDropdownOpen(false);

    navigate("/");
  };

  const displayName =
    user?.user_metadata?.full_name?.split(
      " "
    )[0] ||
    user?.email?.split("@")[0] ||
    "Account";

  // RBAC
  const showHotelDashboard =
    !roleLoading &&
    (isHotelAdmin || isAdmin);

  const showAdminDashboard =
    !roleLoading && isAdmin;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 6vw", // Slipped the vertical padding down slightly to accommodate the taller layout perfectly
        borderBottom: `1px solid ${theme.SAND}`,
        background: theme.CREAM,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* =========================
          UPDATED LOGO & TEXT SECTION
      ========================= */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12, // Keeps a clean distance between the image and text
          textDecoration: "none",
          color: theme.INK,
        }}
      >
        <img 
          src={logoImg} 
          alt="My Space Hotels Logo" 
          style={{ 
            height: "80px", // Perfect size to align with a two-line text title
            width: "auto",
            objectFit: "contain"
          }} 
        />

        <div>
          <div
            className="serif"
            style={{
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "0.5px",
            }}
          >
            My Space
          </div>

          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              color: theme.SEA_DARK,
              marginTop: 4,
            }}
          >
            HOTELS
          </div>
        </div>
      </Link>

      {/* MAIN NAV */}
      <div
        className="hide-mobile"
        style={{
          display: "flex",
          gap: 36,
          fontSize: 13,
        }}
      >
        <Link
          to="/hotels"
          className="link-underline"
          style={{
            color: theme.INK,
            textDecoration: "none",
          }}
        >
          Stays
        </Link>

        <Link
          to="/hotels"
          className="link-underline"
          style={{
            color: theme.INK,
            textDecoration: "none",
          }}
        >
          Destinations
        </Link>

        <a
          href="#"
          className="link-underline"
          style={{
            color: theme.INK,
            textDecoration: "none",
          }}
        >
          Experiences
        </a>

        <a
          href="#"
          className="link-underline"
          style={{
            color: theme.INK,
            textDecoration: "none",
          }}
        >
          Journal
        </a>
      </div>

      {/* AUTH */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        {user ? (
          // LOGGED IN
          <div
            style={{
              position: "relative",
            }}
          >
            {/* ACCOUNT BUTTON */}
            <button
              onClick={() =>
                setDropdownOpen(
                  !dropdownOpen
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: `1px solid ${theme.SAND}`,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 13,
                color: theme.INK,
                fontFamily:
                  "Inter, sans-serif",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: theme.SEA,
                  display: "grid",
                  placeItems: "center",
                  color: theme.CREAM,
                }}
              >
                <User size={14} />
              </div>

              {displayName}

              <ChevronDown
                size={14}
                style={{
                  transform:
                    dropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0)",
                  transition:
                    "transform 0.3s",
                }}
              />
            </button>

            {/* DROPDOWN */}
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top:
                    "calc(100% + 8px)",
                  background: "#fff",
                  border: `1px solid ${theme.SAND}`,
                  boxShadow:
                    "0 12px 40px rgba(0,0,0,0.1)",
                  minWidth: 220,
                  zIndex: 200,
                }}
              >
                {/* USER INFO */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${theme.SAND}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {user?.user_metadata
                      ?.full_name ||
                      "Guest"}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: theme.MUTED,
                      marginTop: 2,
                    }}
                  >
                    {user?.email}
                  </div>

                  {showAdminDashboard && (
                    <div
                      style={{
                        fontSize: 10,
                        color: theme.SEA,
                        marginTop: 4,
                        letterSpacing:
                          "0.1em",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      Super Admin
                    </div>
                  )}

                  {!showAdminDashboard &&
                    showHotelDashboard && (
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.SEA,
                          marginTop: 4,
                          letterSpacing:
                            "0.1em",
                          textTransform:
                            "uppercase",
                      }}
                    >
                      Hotel Admin
                    </div>
                  )}
                </div>

                {/* MY BOOKINGS */}
                <Link
                  to="/my-bookings"
                  onClick={() =>
                    setDropdownOpen(
                      false
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding:
                      "14px 20px",
                    textDecoration:
                      "none",
                    color: theme.INK,
                    fontSize: 13,
                    borderBottom: `1px solid ${theme.SAND}`,
                  }}
                >
                  My Bookings
                </Link>

                {/* HOTEL DASHBOARD */}
                {showHotelDashboard && (
                  <Link
                    to="/hotel-portal"
                    onClick={() =>
                      setDropdownOpen(
                        false
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding:
                        "14px 20px",
                      textDecoration:
                        "none",
                      color:
                        theme.SEA_DARK,
                      fontSize: 13,
                      fontWeight: 600,
                      borderBottom: `1px solid ${theme.SAND}`,
                    }}
                  >
                    <LayoutDashboard
                      size={14}
                    />
                    Hotel Dashboard
                  </Link>
                )}

                {/* SUPER ADMIN */}
                {showAdminDashboard && (
                  <Link
                    to="/admin"
                    onClick={() =>
                      setDropdownOpen(
                        false
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding:
                        "14px 20px",
                      textDecoration:
                        "none",
                      color:
                        theme.SEA_DARK,
                      fontSize: 13,
                      fontWeight: 600,
                      borderBottom: `1px solid ${theme.SAND}`,
                    }}
                  >
                    <LayoutDashboard
                      size={14}
                    />
                    Super Admin
                  </Link>
                )}

                {/* SIGN OUT */}
                <button
                  onClick={handleSignOut}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding:
                      "14px 20px",
                    background:
                      "transparent",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#a33",
                    fontFamily:
                      "Inter, sans-serif",
                  }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // LOGGED OUT
          <>
            <Link
              to="/login"
              className="hide-mobile link-underline"
              style={{
                fontSize: 13,
                color: theme.INK,
                textDecoration:
                  "none",
              }}
            >
              Sign in
            </Link>

            <Link
              to="/signup"
              className="ghost-btn"
              style={{
                fontSize: 12,
                padding:
                  "10px 20px",
                border: `1px solid ${theme.INK}`,
                color: theme.INK,
                textDecoration:
                  "none",
                letterSpacing:
                  "0.1em",
                textTransform:
                  "uppercase",
              }}
            >
              Join Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}