import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { theme } from "../lib/theme.js";
import { api, paymentsApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { calculateGst } from "../lib/gst.js";

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (!script) return resolve(false);
    if (window.Razorpay) return resolve(true);
    script.addEventListener("load", () => resolve(true));
    script.addEventListener("error", () => resolve(false));
  });
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Booking() {
  const { id } = useParams();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [form, setForm] = useState({
    guest_name: "", guest_email: "", guest_phone: "",
    check_in: "", check_out: "", guests: 2,
  });
  const [paymentMode, setPaymentMode] = useState("pay_at_hotel");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getHotelById(id).then(setHotel).catch(err => setError(err.message));
  }, [id]);

  // Prefill guest details from the logged-in account
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        guest_email: f.guest_email || user.email || "",
        guest_name: f.guest_name || user.user_metadata?.full_name || "",
      }));
    }
  }, [user]);

  const nights = form.check_in && form.check_out
    ? Math.max(0, Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24)))
    : 0;
  const subtotal = hotel && nights > 0 ? hotel.price * nights : 0;
  const { gstRate, gstAmount, grandTotal } = hotel && subtotal > 0
    ? calculateGst(hotel.price, subtotal)
    : { gstRate: 0, gstAmount: 0, grandTotal: 0 };

  const handleCheckInChange = (value) => {
    setForm(f => ({
      ...f,
      check_in: value,
      // Clear check-out if it's no longer after the new check-in
      check_out: f.check_out && f.check_out <= value ? "" : f.check_out,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.check_in < todayStr()) {
      setError("Check-in date can't be in the past.");
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMode === "pay_at_hotel") {
        const res = await api.createBooking({ hotel_id: id, ...form, guests: Number(form.guests), user_id: user?.id || null });
        setConfirmed(res.booking);
        setSubmitting(false);
        return;
      }

      // Prepaid: create a Razorpay order first, then open Checkout.
      const order = await paymentsApi.createOrder({ hotel_id: id, ...form, guests: Number(form.guests), user_id: user?.id || null });

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        setError("Couldn't load the payment window. Please check your connection and try again.");
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "My Space Hotels",
        description: hotel.name,
        prefill: { name: form.guest_name, email: form.guest_email, contact: form.guest_phone },
        theme: { color: theme.SEA },
        handler: async (response) => {
          try {
            const verifyRes = await paymentsApi.verify({
              booking_id: order.booking_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setConfirmed(verifyRes.booking);
          } catch (err) {
            setError("Payment succeeded but confirmation failed — contact support with your payment ID: " + response.razorpay_payment_id);
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the Checkout modal without paying — not an error.
            setSubmitting(false);
          },
        },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed. You can try again, or choose Pay at Hotel instead.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (!hotel && !error) return <div style={{ padding: "120px 6vw", color: theme.MUTED }}>Loading…</div>;
  if (error && !hotel) return <div style={{ padding: "120px 6vw", color: "#a33" }}>{error}</div>;

  if (confirmed) {
    const confirmedTotal = confirmed.grand_total ?? confirmed.total_price;
    return (
      <main style={{ padding: "100px 6vw", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", margin: "0 auto 32px", color: theme.CREAM }}>
            <Check size={32} />
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>Confirmation</div>
          <h1 className="serif" style={{ fontSize: 56, fontWeight: 400, lineHeight: 1.05, marginBottom: 24 }}>
            Your stay is <em style={{ color: theme.SEA }}>booked</em>.
          </h1>
          <p style={{ fontSize: 16, color: theme.MUTED, lineHeight: 1.7, marginBottom: 40 }}>
            We've sent the details to <strong style={{ color: theme.INK }}>{confirmed.guest_email}</strong>. Reservation ID: <code style={{ color: theme.SEA_DARK, fontSize: 13 }}>{confirmed.id.slice(0, 8)}</code>
          </p>
          <div style={{ background: "#fff", border: `1px solid ${theme.SAND}`, padding: 32, marginBottom: 40, textAlign: "left" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
              <div><div style={{ color: theme.MUTED, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Hotel</div>{hotel.name}</div>
              <div><div style={{ color: theme.MUTED, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Guests</div>{confirmed.guests}</div>
              <div><div style={{ color: theme.MUTED, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Check-in</div>{confirmed.check_in}</div>
              <div><div style={{ color: theme.MUTED, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Check-out</div>{confirmed.check_out}</div>
              <div style={{ gridColumn: "1 / -1", paddingTop: 16, borderTop: `1px solid ${theme.SAND}` }}>
                {confirmed.gst_amount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.MUTED, marginBottom: 8 }}>
                    <span>Room charge + GST ({confirmed.gst_rate}%)</span>
                    <span>₹{Number(confirmed.total_price).toLocaleString("en-IN")} + ₹{Number(confirmed.gst_amount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{ color: theme.MUTED, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Total Paid</div>
                <div className="serif" style={{ fontSize: 28, color: theme.SEA_DARK }}>₹{Number(confirmedTotal).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
          <Link to="/" className="cta-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none",
            fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
          }}>Back to Home <ArrowRight size={14} /></Link>
        </div>
      </main>
    );
  }

  const fieldStyle = {
    width: "100%", padding: "14px 16px", border: `1px solid ${theme.SAND}`,
    background: "#fff", fontSize: 14, color: theme.INK, outline: "none",
  };
  const labelStyle = { fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 };

  return (
    <main style={{ padding: "60px 6vw 100px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— Reserve Your Stay</div>
        <h1 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 400, lineHeight: 1 }}>
          Booking <em style={{ color: theme.SEA }}>{hotel.name}</em>
        </h1>
      </div>

      <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 60 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input required style={fieldStyle} value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} />
          </div>
          <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input required type="email" style={fieldStyle} value={form.guest_email} onChange={e => setForm({...form, guest_email: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={fieldStyle} value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})} />
            </div>
          </div>
          <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Check-in</label>
              <input required type="date" min={todayStr()} style={fieldStyle} value={form.check_in} onChange={e => handleCheckInChange(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Check-out</label>
              <input required type="date" min={form.check_in || todayStr()} style={fieldStyle} value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Guests</label>
              <select style={fieldStyle} value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}>
                <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Payment</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { value: "pay_at_hotel", label: "Pay at Hotel", hint: "Settle when you check in" },
                { value: "prepaid", label: "Pay Now", hint: "Secure online payment" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMode(opt.value)}
                  style={{
                    textAlign: "left", padding: "14px 16px", cursor: "pointer",
                    border: `1px solid ${paymentMode === opt.value ? theme.SEA : theme.SAND}`,
                    background: paymentMode === opt.value ? "#fff" : "transparent",
                    boxShadow: paymentMode === opt.value ? `inset 0 0 0 1px ${theme.SEA}` : "none",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: paymentMode === opt.value ? theme.SEA_DARK : theme.INK }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: "#a33", padding: 14, background: "#fff5f5", border: "1px solid #fcc" }}>{error}</div>}

          <button type="submit" disabled={submitting} className="cta-btn" style={{
            background: theme.SEA, color: theme.CREAM, border: "none", padding: 18,
            fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting
              ? (paymentMode === "prepaid" ? "Opening payment…" : "Confirming…")
              : <>{paymentMode === "prepaid" ? "Proceed to Payment" : "Confirm Reservation"} <ArrowRight size={14} /></>}
          </button>
        </form>

        <aside style={{ background: "#fff", padding: 32, border: `1px solid ${theme.SAND}`, alignSelf: "start" }}>
          <img src={hotel.cover_image} alt="" style={{ width: "100%", height: 200, objectFit: "cover", marginBottom: 20 }} />
          <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>{hotel.name}</h3>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 24 }}>{hotel.city}, {hotel.state}</div>

          <div style={{ paddingTop: 20, borderTop: `1px solid ${theme.SAND}`, display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: theme.MUTED }}>₹{Number(hotel.price).toLocaleString("en-IN")} × {nights || 0} nights</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {gstRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.MUTED }}>GST ({gstRate}%)</span>
                <span>₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${theme.SAND}`, marginTop: 8 }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span className="serif" style={{ fontSize: 22, color: theme.SEA_DARK, fontWeight: 500 }}>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}