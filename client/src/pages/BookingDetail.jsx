import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { guestBookingApi, reviewApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { theme } from "../lib/theme.js";
import { ArrowLeft, MapPin, Clock, Phone, Calendar, Users, IndianRupee, Star, X, CheckCircle2, Ban } from "lucide-react";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    guestBookingApi.detail(id)
      .then(setBooking)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  if (loading) return <div style={{ padding: "120px 6vw", textAlign: "center", color: theme.MUTED }}><div className="serif" style={{ fontSize: 28 }}>Loading…</div></div>;
  if (error) return <div style={{ padding: "120px 6vw", textAlign: "center", color: "#a33" }}>{error}</div>;

  const h = booking.hotels || {};
  const fmt = d => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const isPast = new Date(booking.check_out) < new Date();
  const canReview = isPast && booking.status !== "cancelled" && !booking.review;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 6vw 80px" }}>
      <button onClick={() => navigate("/my-bookings")} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: theme.MUTED, cursor: "pointer", marginBottom: 24, fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to My Bookings
      </button>

      {msg && <div style={{ padding: 16, background: "#E8F5F3", border: `1px solid ${theme.SEA}33`, marginBottom: 20, fontSize: 14, color: theme.SEA_DARK }}>{msg}</div>}

      {h.cover_image && <img src={h.cover_image} alt={h.name} style={{ width: "100%", height: 280, objectFit: "cover", marginBottom: 24 }} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 40, fontWeight: 400 }}>{h.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.MUTED, marginTop: 4 }}>
            <MapPin size={14} /> {h.city}
          </div>
        </div>
        <StatusPill status={booking.status} liveStatus={booking.cancellable ? "upcoming" : (isPast ? "closed" : "active")} />
      </div>

      <div style={{ fontSize: 12, color: theme.MUTED, marginBottom: 28 }}>Reservation ID: <code style={{ color: theme.SEA_DARK }}>{booking.id.slice(0, 8).toUpperCase()}</code></div>

      {/* Stay details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <Detail icon={Calendar} label="Check-in" value={`${fmt(booking.check_in)}${h.checkin_time ? ` · ${h.checkin_time}` : ""}`} />
        <Detail icon={Calendar} label="Check-out" value={`${fmt(booking.check_out)}${h.checkout_time ? ` · ${h.checkout_time}` : ""}`} />
        <Detail icon={Users} label="Guests" value={`${booking.guests} ${booking.guests > 1 ? "guests" : "guest"} · ${booking.nights} ${booking.nights > 1 ? "nights" : "night"}`} />
        <Detail icon={IndianRupee} label="Total Paid" value={`₹${Number(booking.total_price).toLocaleString("en-IN")}`} />
      </div>

      {booking.special_request && (
        <div style={{ background: theme.SAND, padding: 16, marginBottom: 28, fontSize: 14 }}>
          <strong>Special request:</strong> {booking.special_request}
        </div>
      )}

      {/* Hotel info */}
      <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24, marginBottom: 28 }}>
        <h3 className="serif" style={{ fontSize: 20, marginBottom: 16 }}>Hotel Information</h3>
        {h.property_address && <InfoRow icon={MapPin} text={h.property_address} />}
        {h.contact_number && <InfoRow icon={Phone} text={h.contact_number} />}
        {(h.checkin_time || h.checkout_time) && <InfoRow icon={Clock} text={`Check-in ${h.checkin_time || "—"} · Check-out ${h.checkout_time || "—"}`} />}
        {h.google_map_link && <a href={h.google_map_link} target="_blank" rel="noreferrer" style={{ color: theme.SEA_DARK, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}><MapPin size={14} /> View on Google Maps →</a>}
      </div>

      {/* Existing review */}
      {booking.review && (
        <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 24, marginBottom: 28 }}>
          <h3 className="serif" style={{ fontSize: 20, marginBottom: 12 }}>Your Review</h3>
          <Stars value={booking.review.rating} />
          {booking.review.comment && <p style={{ marginTop: 10, color: theme.INK, fontSize: 14, lineHeight: 1.6 }}>{booking.review.comment}</p>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        {booking.cancellable && (
          <button onClick={() => setShowCancel(true)} style={{ background: "transparent", border: "1px solid #fcc", color: "#a33", padding: "14px 28px", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Ban size={15} /> Cancel Booking
          </button>
        )}
        {canReview && (
          <button onClick={() => setShowReview(true)} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: "14px 28px", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Star size={15} /> Leave a Review
          </button>
        )}
      </div>

      {booking.cancellable && (
        <div style={{ fontSize: 13, color: theme.MUTED, marginTop: 12 }}>
          {booking.freeCancellation
            ? `Free cancellation available (more than ${h.free_cancellation_hours ?? 24}h before check-in).`
            : "Free cancellation window has passed — cancelling may not be refundable."}
        </div>
      )}

      {showCancel && <CancelModal booking={booking} user={user} onClose={() => setShowCancel(false)} onDone={(m) => { setMsg(m); setShowCancel(false); load(); }} />}
      {showReview && <ReviewModal booking={booking} user={user} onClose={() => setShowReview(false)} onDone={(m) => { setMsg(m); setShowReview(false); load(); }} />}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Icon size={18} color={theme.SEA} style={{ marginTop: 2 }} />
      <div>
        <div style={{ fontSize: 11, color: theme.MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 15, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
function InfoRow({ icon: Icon, text }) {
  return <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: theme.INK, marginBottom: 8 }}><Icon size={15} color={theme.MUTED} /> {text}</div>;
}
function Stars({ value }) {
  return <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(n => <Star key={n} size={18} fill={n <= value ? "#F5A623" : "none"} color={n <= value ? "#F5A623" : theme.SAND} />)}</div>;
}
function StatusPill({ status }) {
  const map = { cancelled: { bg: "#fff5f5", c: "#a33" }, confirmed: { bg: "#E8F5F3", c: theme.SEA_DARK } };
  const s = map[status] || { bg: theme.SAND, c: theme.INK };
  return <span style={{ background: s.bg, color: s.c, padding: "6px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{status}</span>;
}

function CancelModal({ booking, user, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await guestBookingApi.cancel(booking.id, user?.id);
      onDone(res.message);
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal onClose={onClose} title="Cancel Booking">
      <p style={{ fontSize: 14, color: theme.INK, marginBottom: 16, lineHeight: 1.6 }}>
        Are you sure you want to cancel your stay at <strong>{booking.hotels?.name}</strong>?
      </p>
      <div style={{ padding: 14, background: booking.freeCancellation ? "#E8F5F3" : "#fff5f5", fontSize: 13, marginBottom: 20, color: booking.freeCancellation ? theme.SEA_DARK : "#a33" }}>
        {booking.freeCancellation ? "You're within the free cancellation window — you'll receive a full refund." : "This is past the free cancellation window — it may not be refundable."}
      </div>
      {err && <div style={{ color: "#a33", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: "transparent", border: `1px solid ${theme.SAND}`, padding: 14, fontSize: 13, cursor: "pointer" }}>Keep Booking</button>
        <button onClick={submit} disabled={busy} style={{ flex: 1, background: "#a33", color: "#fff", border: "none", padding: 14, fontSize: 13, cursor: "pointer" }}>{busy ? "Cancelling…" : "Confirm Cancellation"}</button>
      </div>
    </Modal>
  );
}

function ReviewModal({ booking, user, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    if (!rating) { setErr("Please select a rating."); return; }
    setBusy(true); setErr(null);
    try {
      await reviewApi.create({ booking_id: booking.id, hotel_id: booking.hotel_id, user_id: user?.id, guest_name: booking.guest_name, rating, comment });
      onDone("Thank you! Your review has been posted.");
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal onClose={onClose} title="Leave a Review">
      <p style={{ fontSize: 14, color: theme.MUTED, marginBottom: 16 }}>How was your stay at {booking.hotels?.name}?</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <Star size={32} fill={n <= (hover || rating) ? "#F5A623" : "none"} color={n <= (hover || rating) ? "#F5A623" : theme.SAND} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us about your experience (optional)" style={{ width: "100%", minHeight: 100, padding: 14, border: `1px solid ${theme.SAND}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
      {err && <div style={{ color: "#a33", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ width: "100%", background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 14, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{busy ? "Posting…" : "Post Review"}</button>
    </Modal>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 460, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
