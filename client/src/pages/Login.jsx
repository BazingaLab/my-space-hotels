import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { theme } from "../lib/theme.js";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate(from, { replace: true });
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

  const fieldStyle = {
    width: "100%", padding: "14px 16px 14px 44px",
    border: `1px solid ${theme.SAND}`, background: "#fff",
    fontSize: 14, color: theme.INK, outline: "none",
    fontFamily: "Inter, sans-serif", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK,
    textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600,
  };

  return (
    <main style={{ minHeight: "80vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>

      {/* Left — decorative */}
      <div style={{ background: theme.SEA_DEEP, padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }} className="hide-mobile">
        <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, border: `1px solid ${theme.SEA}55`, borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: -80, bottom: -80, width: 400, height: 400, border: `1px solid ${theme.SEA}33`, borderRadius: "50%" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", color: theme.CREAM }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: theme.CREAM, lineHeight: 1 }}>My Space</div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: theme.SEA, marginTop: 2 }}>HOTELS</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <h2 className="serif" style={{ fontSize: 52, fontWeight: 400, color: theme.CREAM, lineHeight: 1.1, marginBottom: 20 }}>
            Welcome<br />back. <em style={{ color: theme.SEA }}>✦</em>
          </h2>
          <p style={{ fontSize: 15, color: "#C8D4D1", lineHeight: 1.7, fontWeight: 300, maxWidth: 320 }}>
            Sign in to access your bookings, saved stays, and personalised recommendations.
          </p>
        </div>
        <div style={{ position: "relative", fontSize: 13, color: "#8A9994" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: theme.SEA, textDecoration: "none", fontWeight: 500 }}>Create one →</Link>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center", background: theme.CREAM }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 16, textTransform: "uppercase" }}>— Sign In</div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, marginBottom: 40, lineHeight: 1.1 }}>
            Your stays<br />await you.
          </h1>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            style={{
              width: "100%", padding: "14px 20px", background: "#fff", border: `1px solid ${theme.SAND}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              fontSize: 14, cursor: "pointer", marginBottom: 28, fontFamily: "Inter, sans-serif",
              color: theme.INK, transition: "all 0.3s",
            }}
          >
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
            <span style={{ fontSize: 12, color: theme.MUTED, letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: theme.SAND }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  required type="email" style={fieldStyle}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  required type="password" style={fieldStyle}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div style={{ color: "#a33", fontSize: 13, padding: "12px 16px", background: "#fff5f5", border: "1px solid #fcc" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cta-btn"
              style={{
                background: theme.SEA, color: theme.CREAM, border: "none",
                padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
                fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in…" : <>Sign In <ArrowRight size={14} /></>}
            </button>
          </form>

          <p style={{ fontSize: 13, color: theme.MUTED, marginTop: 24, textAlign: "center" }}>
            New here?{" "}
            <Link to="/signup" style={{ color: theme.SEA_DARK, fontWeight: 600, textDecoration: "none" }}>Create an account →</Link>
          </p>
        </div>
      </div>
    </main>
  );
}