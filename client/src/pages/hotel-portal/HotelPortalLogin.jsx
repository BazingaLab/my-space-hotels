import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { theme } from "../../lib/theme.js";
import { Building2, Mail, Lock, ArrowRight } from "lucide-react";

export default function HotelPortalLogin() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate("/hotel-portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  const inp = {
    width: "100%", padding: "14px 16px 14px 44px",
    border: `1px solid ${theme.SAND}`, background: "#fff",
    fontSize: 14, color: theme.INK, outline: "none",
    fontFamily: "Inter, sans-serif", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left panel */}
      <div style={{ background: theme.SEA_DEEP, padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: -80, bottom: -80, width: 400, height: 400, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "grid", placeItems: "center", color: theme.CREAM }}>
            <Building2 size={20} />
          </div>
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: theme.CREAM, lineHeight: 1 }}>My Space Hotels</div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>HOTEL PARTNER PORTAL</div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <h2 className="serif" style={{ fontSize: 52, fontWeight: 400, color: theme.CREAM, lineHeight: 1.1, marginBottom: 20 }}>
            Manage your<br />property. <em style={{ color: "rgba(255,255,255,0.4)" }}>✦</em>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300, maxWidth: 320 }}>
            Access your hotel dashboard, manage bookings, update photos, and track revenue — all in one place.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
            {["Manage bookings & cancellations", "Upload photos by category", "Track revenue & occupancy", "Update pricing & availability"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.SEA }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Want to list your property?{" "}
          <Link to="/list-property" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Apply here →</Link>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center", background: theme.CREAM }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 16, textTransform: "uppercase" }}>— Hotel Partner</div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, marginBottom: 40, lineHeight: 1.1 }}>
            Welcome<br />back.
          </h1>

          {/* Google */}
          <button onClick={handleGoogle} style={{
            width: "100%", padding: "14px 20px", background: "#fff", border: `1px solid ${theme.SAND}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            fontSize: 14, cursor: "pointer", marginBottom: 28, fontFamily: "Inter, sans-serif", color: theme.INK,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: theme.SAND }} />
            <span style={{ fontSize: 12, color: theme.MUTED }}>OR</span>
            <div style={{ flex: 1, height: 1, background: theme.SAND }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type="email" style={inp} placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type="password" style={inp} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            {error && <div style={{ color: "#a33", fontSize: 13, padding: "12px 16px", background: "#fff5f5", border: "1px solid #fcc" }}>{error}</div>}
            <button type="submit" disabled={loading} className="cta-btn" style={{
              background: theme.SEA_DEEP, color: theme.CREAM, border: "none",
              padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
              fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Signing in…" : <>Access Portal <ArrowRight size={14} /></>}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: 20, background: theme.SAND, fontSize: 13, color: theme.MUTED, lineHeight: 1.6 }}>
            <strong style={{ color: theme.INK }}>Not a partner yet?</strong> Submit your property for review and we'll get back to you within 48 hours.{" "}
            <Link to="/list-property" style={{ color: theme.SEA_DARK, fontWeight: 600 }}>List your property →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}