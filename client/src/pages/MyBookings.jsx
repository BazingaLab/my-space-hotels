import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase.js";

import { useAuth } from "../context/AuthContext.jsx";

import { api, reviewApi } from "../lib/api.js";

import { theme } from "../lib/theme.js";

import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  ShieldAlert,
  Star,
  X,
} from "lucide-react";

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /* =========================
     COMPLAINT STATE
  ========================= */

  const [showComplaintModal, setShowComplaintModal] =
    useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [complaintLoading, setComplaintLoading] =
    useState(false);

  const [complaintForm, setComplaintForm] =
    useState({
      issue_type: "",
      priority: "medium",
      notes: "",
    });

  /* =========================
     REVIEW STATE
  ========================= */

  const [showReviewModal, setShowReviewModal] =
    useState(false);

  const [reviewBooking, setReviewBooking] =
    useState(null);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [reviewError, setReviewError] =
    useState(null);

  const [reviewForm, setReviewForm] =
    useState({ rating: 0, comment: "" });

  /* =========================
     FETCH BOOKINGS
  ========================= */

  useEffect(() => {
    if (!user?.id) return;
    // Primary: bookings owned by this account (user_id).
    // Fallback: legacy/guest bookings matched by email.
    // Each booking now also carries a `reviews` array (from the backend's
    // embedded select) — empty if this stay hasn't been reviewed yet.
    api.getBookingsByUser(user.id)
      .then(async (data) => {
        let list = data.bookings || [];
        if (list.length === 0 && user.email) {
          const byEmail = await api.getBookings(user.email).catch(() => ({ bookings: [] }));
          list = byEmail.bookings || [];
        }
        setBookings(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

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

  const statusColor = (
    status
  ) =>
    ({
      confirmed: {
        bg: "#E8F5F3",
        color: theme.SEA_DARK,
      },

      pending: {
        bg: "#FFF8E6",
        color: "#A0700A",
      },

      cancelled: {
        bg: "#FFF0F0",
        color: "#A33",
      },
    }[status] || {
      bg: theme.SAND,
      color: theme.MUTED,
    });

  // A stay can be reviewed once it's actually checked out, and only once —
  // this mirrors the exact same rule the server enforces in
  // reviewController.js, so the button never offers something the backend
  // would then reject.
  const canReview = (b) =>
    b.checkin_status === "checked_out" && (!b.reviews || b.reviews.length === 0);

  const existingReview = (b) =>
    b.reviews && b.reviews.length > 0 ? b.reviews[0] : null;

  /* =========================
     OPEN MODAL — COMPLAINT
  ========================= */

  const openComplaintModal = (
    booking
  ) => {
    setSelectedBooking(booking);

    setComplaintForm({
      issue_type: "",
      priority: "medium",
      notes: "",
    });

    setShowComplaintModal(true);
  };

  /* =========================
     OPEN MODAL — REVIEW
  ========================= */

  const openReviewModal = (booking) => {
    setReviewBooking(booking);
    setReviewForm({ rating: 0, comment: "" });
    setReviewError(null);
    setShowReviewModal(true);
  };

  /* =========================
     SUBMIT COMPLAINT
  ========================= */

  const submitComplaint =
    async () => {
      try {
        setComplaintLoading(true);

        const hotel =
          selectedBooking.hotels ||
          {};

        const complaintId = `CMP-${Date.now()}`;

        const {
          error: complaintError,
        } = await supabase
          .from("complaints")
          .insert({
            complaint_id:
              complaintId,

            guest_name:
              user
                ?.user_metadata
                ?.full_name ||
              user?.email,

            hotel_name:
              hotel.name,

            issue_type:
              complaintForm.issue_type,

            priority:
              complaintForm.priority,

            notes:
              complaintForm.notes,

            booking_id:
              selectedBooking.id,

            resolution_status:
              "open",
          });

        if (complaintError)
          throw complaintError;

        alert(
          "Complaint submitted successfully."
        );

        setShowComplaintModal(
          false
        );
      } catch (err) {
        console.error(err);

        alert(
          err.message ||
            "Unable to submit complaint"
        );
      } finally {
        setComplaintLoading(false);
      }
    };

  /* =========================
     SUBMIT REVIEW
  ========================= */

  const submitReview = async () => {
    if (reviewForm.rating < 1) {
      setReviewError("Please select a star rating.");
      return;
    }
    setReviewLoading(true);
    setReviewError(null);
    try {
      const created = await reviewApi.create({
        booking_id: reviewBooking.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment || null,
      });
      // Update this booking locally so the button flips to "Reviewed"
      // immediately, without needing to refetch the whole list.
      setBookings((prev) =>
        prev.map((b) =>
          b.id === reviewBooking.id
            ? { ...b, reviews: [{ id: created.id, rating: created.rating }] }
            : b
        )
      );
      setShowReviewModal(false);
    } catch (err) {
      setReviewError(err.message || "Unable to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <main
      style={{
        padding:
          "60px 6vw 100px",
        minHeight: "70vh",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 56,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            color: theme.SEA_DARK,
            marginBottom: 14,
            textTransform:
              "uppercase",
          }}
        >
          — Your Account
        </div>

        <h1
          className="serif"
          style={{
            fontSize:
              "clamp(40px, 6vw, 72px)",
            fontWeight: 400,
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          My{" "}
          <em
            style={{
              color: theme.SEA,
            }}
          >
            Bookings
          </em>
          .
        </h1>

        <p
          style={{
            fontSize: 15,
            color: theme.MUTED,
          }}
        >
          Signed in as{" "}
          <strong
            style={{
              color: theme.INK,
            }}
          >
            {user
              ?.user_metadata
              ?.full_name ||
              user?.email}
          </strong>
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div
          style={{
            color: theme.MUTED,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 24,
            }}
          >
            Loading your stays…
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            color: "#a33",
            padding: 20,
            background:
              "#fff5f5",
            border:
              "1px solid #fcc",
          }}
        >
          Couldn't load bookings:{" "}
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        !error &&
        bookings.length === 0 && (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "80px 40px",
              background:
                theme.SAND,
            }}
          >
            <div
              className="serif"
              style={{
                fontSize: 48,
                marginBottom: 16,
                color:
                  theme.MUTED,
              }}
            >
              ✦
            </div>

            <h3
              className="serif"
              style={{
                fontSize: 36,
                fontWeight: 400,
                marginBottom: 12,
              }}
            >
              No bookings yet
            </h3>

            <p
              style={{
                color:
                  theme.MUTED,
                marginBottom: 32,
                fontSize: 15,
              }}
            >
              You haven't booked
              any stays yet.
            </p>

            <Link
              to="/hotels"
              className="cta-btn"
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: 10,
                background:
                  theme.SEA,
                color:
                  theme.CREAM,
                padding:
                  "16px 32px",
                textDecoration:
                  "none",
                fontSize: 13,
                letterSpacing:
                  "0.15em",
                textTransform:
                  "uppercase",
              }}
            >
              Browse Stays{" "}
              <ArrowRight
                size={14}
              />
            </Link>
          </div>
        )}

      {/* BOOKINGS */}
      {!loading &&
        bookings.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 24,
            }}
          >
            {bookings.map((b) => {
              const sc =
                statusColor(
                  b.status
                );

              const hotel =
                b.hotels || {};

              const review = existingReview(b);

              return (
                <div
                  key={b.id}
                  style={{
                    background:
                      "#fff",
                    border: `1px solid ${theme.SAND}`,
                    display:
                      "grid",
                    gridTemplateColumns:
                      "200px 1fr auto",
                    overflow:
                      "hidden",
                  }}
                >
                  {/* IMAGE — clicking the image/details area still opens
                      the booking detail page; the action buttons below
                      stop that click from bubbling up so they work
                      independently. */}
                  <div
                    onClick={() => navigate(`/my-bookings/${b.id}`)}
                    style={{
                      width: "100%",
                      height:
                        "100%",
                      minHeight: 160,
                      overflow:
                        "hidden",
                      cursor: "pointer",
                    }}
                  >
                    {hotel.cover_image ? (
                      <img
                        src={
                          hotel.cover_image
                        }
                        alt=""
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
                          objectFit:
                            "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
                          background:
                            theme.SAND,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          color:
                            theme.MUTED,
                        }}
                      >
                        No image
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div
                    onClick={() => navigate(`/my-bookings/${b.id}`)}
                    style={{
                      padding: 28,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <h3
                        className="serif"
                        style={{
                          fontSize: 24,
                          fontWeight: 500,
                        }}
                      >
                        {hotel.name ||
                          "Hotel"}
                      </h3>

                      <span
                        style={{
                          fontSize: 11,
                          padding:
                            "4px 12px",
                          background:
                            sc.bg,
                          color:
                            sc.color,
                          letterSpacing:
                            "0.1em",
                          textTransform:
                            "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {b.status}
                      </span>
                    </div>

                    {hotel.city && (
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 6,
                          fontSize: 13,
                          color:
                            theme.MUTED,
                          marginBottom: 16,
                        }}
                      >
                        <MapPin
                          size={12}
                        />
                        {hotel.city}
                      </div>
                    )}

                    {/* META */}
                    <div
                      style={{
                        display:
                          "flex",
                        gap: 28,
                        fontSize: 13,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            letterSpacing:
                              "0.15em",
                            color:
                              theme.MUTED,
                            textTransform:
                              "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Check-in
                        </div>

                        <div>
                          {formatDate(
                            b.check_in
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            letterSpacing:
                              "0.15em",
                            color:
                              theme.MUTED,
                            textTransform:
                              "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Check-out
                        </div>

                        <div>
                          {formatDate(
                            b.check_out
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            letterSpacing:
                              "0.15em",
                            color:
                              theme.MUTED,
                            textTransform:
                              "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Guests
                        </div>

                        <div>
                          {b.guests}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS — stopPropagation so clicking these
                        doesn't also trigger the row's "go to detail page"
                        click handler above. */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: 24,
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={() =>
                          openComplaintModal(
                            b
                          )
                        }
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          gap: 8,
                          padding:
                            "12px 18px",
                          border:
                            "none",
                          background:
                            "#FFF5F5",
                          color:
                            "#B33A3A",
                          cursor:
                            "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        <ShieldAlert
                          size={15}
                        />
                        Raise
                        Complaint
                      </button>

                      {canReview(b) && (
                        <button
                          onClick={() => openReviewModal(b)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 18px",
                            border: `1px solid ${theme.SEA}`,
                            background: "transparent",
                            color: theme.SEA_DARK,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <Star size={15} />
                          Leave a Review
                        </button>
                      )}

                      {review && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: theme.MUTED,
                          }}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < review.rating ? theme.SEA : "transparent"}
                              stroke={theme.SEA}
                            />
                          ))}
                          <span>Your review</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRICE */}
                  <div
                    onClick={() => navigate(`/my-bookings/${b.id}`)}
                    style={{
                      padding: 28,
                      borderLeft: `1px solid ${theme.SAND}`,
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      justifyContent:
                        "center",
                      alignItems:
                        "flex-end",
                      minWidth: 160,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing:
                          "0.2em",
                        color:
                          theme.MUTED,
                        textTransform:
                          "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Total
                    </div>

                    <div
                      className="serif"
                      style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color:
                          theme.SEA_DARK,
                      }}
                    >
                      ₹
                      {Number(
                        b.total_price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* =========================
          COMPLAINT MODAL
      ========================= */}

      {showComplaintModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 999,
            padding: 24,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#fff",
              padding: 32,
              position:
                "relative",
            }}
          >
            {/* CLOSE */}
            <button
              onClick={() =>
                setShowComplaintModal(
                  false
                )
              }
              style={{
                position:
                  "absolute",
                right: 20,
                top: 20,
                border: "none",
                background:
                  "transparent",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                fontSize: 11,
                letterSpacing:
                  "0.3em",
                color:
                  theme.SEA_DARK,
                marginBottom: 10,
                textTransform:
                  "uppercase",
              }}
            >
              Support Request
            </div>

            <h2
              className="serif"
              style={{
                fontSize: 36,
                marginBottom: 24,
              }}
            >
              Raise Complaint
            </h2>

            {/* ISSUE TYPE */}
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Issue Type
              </label>

              <select
                value={
                  complaintForm.issue_type
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    issue_type:
                      e.target
                        .value,
                  })
                }
                style={{
                  width: "100%",
                  padding: 14,
                  border: `1px solid ${theme.SAND}`,
                }}
              >
                <option value="">
                  Select issue
                </option>

                <option>
                  Room Cleanliness
                </option>

                <option>
                  Staff Behaviour
                </option>

                <option>
                  Payment Issue
                </option>

                <option>
                  Check-in Delay
                </option>

                <option>
                  Amenities Problem
                </option>

                <option>
                  Booking Mismatch
                </option>

                <option>
                  Other
                </option>
              </select>
            </div>

            {/* PRIORITY */}
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Priority
              </label>

              <select
                value={
                  complaintForm.priority
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    priority:
                      e.target
                        .value,
                  })
                }
                style={{
                  width: "100%",
                  padding: 14,
                  border: `1px solid ${theme.SAND}`,
                }}
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>

                <option value="critical">
                  Critical
                </option>
              </select>
            </div>

            {/* NOTES */}
            <div
              style={{
                marginBottom: 28,
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Description
              </label>

              <textarea
                rows={5}
                value={
                  complaintForm.notes
                }
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    notes:
                      e.target
                        .value,
                  })
                }
                placeholder="Describe your issue..."
                style={{
                  width: "100%",
                  padding: 14,
                  border: `1px solid ${theme.SAND}`,
                  resize: "none",
                }}
              />
            </div>

            {/* ACTION */}
            <button
              onClick={
                submitComplaint
              }
              disabled={
                complaintLoading
              }
              style={{
                width: "100%",
                padding: 16,
                border: "none",
                background:
                  theme.SEA,
                color:
                  theme.CREAM,
                fontSize: 13,
                letterSpacing:
                  "0.15em",
                textTransform:
                  "uppercase",
                cursor: "pointer",
              }}
            >
              {complaintLoading
                ? "Submitting..."
                : "Submit Complaint"}
            </button>
          </div>
        </div>
      )}

      {/* =========================
          REVIEW MODAL
      ========================= */}

      {showReviewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 999,
            padding: 24,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#fff",
              padding: 32,
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowReviewModal(false)}
              style={{
                position: "absolute",
                right: 20,
                top: 20,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                color: theme.SEA_DARK,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              {reviewBooking?.hotels?.name}
            </div>

            <h2 className="serif" style={{ fontSize: 32, marginBottom: 24 }}>
              How was your stay?
            </h2>

            {/* STAR PICKER — click a star to set the rating; every star up
                to and including the clicked one fills in. */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: value })}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={32}
                      fill={value <= reviewForm.rating ? theme.SEA : "transparent"}
                      stroke={theme.SEA}
                    />
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
                Your review (optional)
              </label>
              <textarea
                rows={5}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="What stood out about your stay?"
                style={{ width: "100%", padding: 14, border: `1px solid ${theme.SAND}`, resize: "none" }}
              />
            </div>

            {reviewError && (
              <div style={{ color: "#a33", fontSize: 13, padding: 14, background: "#fff5f5", border: "1px solid #fcc", marginBottom: 20 }}>
                {reviewError}
              </div>
            )}

            <button
              onClick={submitReview}
              disabled={reviewLoading}
              style={{
                width: "100%",
                padding: 16,
                border: "none",
                background: theme.SEA,
                color: theme.CREAM,
                fontSize: 13,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: reviewLoading ? "not-allowed" : "pointer",
                opacity: reviewLoading ? 0.7 : 1,
              }}
            >
              {reviewLoading ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}