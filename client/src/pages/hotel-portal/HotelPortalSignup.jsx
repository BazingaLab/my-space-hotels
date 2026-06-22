import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";
import { Building2, Mail, Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function HotelPortalSignup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      // 1. Create the auth account
      const data = await signUp(form.email, form.password, form.fullName);
      const userId = data?.user?.id;
      if (!userId) throw new Error("Sign up failed. Please try again.");

      // 2. Promote to hotel_admin — wait briefly first so auth.users FK is committed
      // Supabase occasionally needs a moment before the new user is referenceable
      await new Promise(r => setTimeout(r, 1500));
      let promoted = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await adminApi.promoteUser({ user_id: userId, role: "hotel_admin" });
          promoted = true;
          break;
        } catch (e) {
          if (attempt === 3) throw e;
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", padding: "14px 16px 14px 44px", border: `1px solid ${theme.SAND}`, background: "#fff", fontSize: 14, color: theme.INK, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" };
  const lbl = { fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: theme.SEA_DEEP, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: theme.CREAM, width: "100%", maxWidth: 460, padding: 48, textAlign: "center" }}>
          <CheckCircle2 size={56} color={theme.SEA} style={{ marginBottom: 20 }} />
          <h1 className="serif" style={{ fontSize: 34, fontWeight: 400, marginBottom: 12 }}>Account Created</h1>
          <p style={{ color: theme.MUTED, lineHeight: 1.7, marginBottom: 28 }}>
            Welcome aboard! Your hotel partner account is ready. Log in to add your first property — our team will review and approve it before it goes live.
          </p>
          <button onClick={() => navigate("/hotel-portal/login")} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: "14px 28px", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left brand panel */}
      <div style={{ background: theme.SEA_DEEP, padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "grid", placeItems: "center", color: theme.CREAM }}>
            <Building2 size={20} />
          </div>
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: theme.CREAM, lineHeight: 1 }}>My Space Hotels</div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>BECOME A PARTNER</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <h2 className="serif" style={{ fontSize: 48, fontWeight: 400, color: theme.CREAM, lineHeight: 1.1, marginBottom: 20 }}>
            List your property.<br />Grow your business.
          </h2>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            {["Reach more guests", "Manage bookings & revenue", "Upload photos & set pricing", "Track everything in one place"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.SEA }} /> {f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Already a partner?{" "}
          <Link to="/hotel-portal/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Sign in →</Link>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center", background: theme.CREAM }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 16, textTransform: "uppercase" }}>— Partner Sign Up</div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, marginBottom: 32, lineHeight: 1.1 }}>Create your<br />account.</h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={lbl}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required style={inp} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Your name" />
              </div>
            </div>

            <div>
              <label style={lbl}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type="email" style={inp} value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label style={lbl}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type={showPassword ? "text" : "password"} style={{ ...inp, paddingRight: 44 }} value={form.password} onChange={e => set("password", e.target.value)} placeholder="At least 6 characters" />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={lbl}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type={showPassword ? "text" : "password"} style={inp} value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Re-enter password" />
              </div>
            </div>

            {error && <div style={{ color: "#a33", fontSize: 13, padding: "12px 16px", background: "#fff5f5", border: "1px solid #fcc" }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ background: theme.SEA_DEEP, color: theme.CREAM, border: "none", padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating account…" : <><span>Create Account</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p style={{ fontSize: 12, color: theme.MUTED, marginTop: 24, textAlign: "center" }}>
            By signing up you agree to list properties subject to admin review.
          </p>
        </div>
      </div>
    </div>
  );
}