import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { theme } from "../../lib/theme.js";
import { Sparkles, Mail, Lock, ArrowRight, Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Step 1: Sign in — signIn returns data directly (not { user })
      const data = await signIn(form.email, form.password);
      const userId = data?.user?.id;
      if (!userId) throw new Error("Authentication failed");

      // Step 2: Check role via backend API (bypasses RLS)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/role/${userId}`
      );
      if (!res.ok) throw new Error("Unable to verify admin role");
      const roleData = await res.json();

      // Step 3: Validate role
      if (!roleData?.role || roleData.role !== "super_admin") {
        await signOut();
        throw new Error("Unauthorized. Admin privileges required.");
      }

      // Step 4: Success
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "14px 44px",
    border: `1px solid ${theme.SAND}`,
    background: "#fff",
    fontSize: 14,
    color: theme.INK,
    outline: "none",
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11,
    letterSpacing: "0.2em",
    color: theme.SEA_DARK,
    textTransform: "uppercase",
    marginBottom: 8,
    display: "block",
    fontWeight: 600,
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.INK,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ background: theme.CREAM, width: "100%", maxWidth: 420, padding: 48 }}>

        {/* LOGO */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: theme.SEA, display: "grid", placeItems: "center", color: theme.CREAM }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1 }}>My Space Hotels</div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: theme.SEA_DARK, marginTop: 2 }}>ADMIN PORTAL</div>
          </div>
        </div>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Shield size={14} color={theme.SEA_DARK} />
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, textTransform: "uppercase" }}>Restricted Access</div>
        </div>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 32, lineHeight: 1.1 }}>Admin Sign In</h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* EMAIL */}
          <div>
            <label style={labelStyle}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                required type="email" style={fieldStyle}
                placeholder="admin@myspacehotels.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                required
                type={showPassword ? "text" : "password"}
                style={{ ...fieldStyle, paddingRight: 48 }}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED, display: "flex", alignItems: "center", padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ color: "#a33", fontSize: 13, padding: "12px 16px", background: "#fff5f5", border: "1px solid #fcc" }}>
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <button type="submit" disabled={loading} className="cta-btn" style={{
            background: theme.SEA, color: theme.CREAM, border: "none", padding: 16,
            fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Signing in…" : <><span>Access Dashboard</span><ArrowRight size={14} /></>}
          </button>
        </form>

        {/* FOOTER */}
        <p style={{ fontSize: 12, color: theme.MUTED, marginTop: 24, textAlign: "center" }}>
          Not an admin?{" "}
          <a href="/" style={{ color: theme.SEA_DARK }}>Back to site →</a>
        </p>
      </div>
    </div>
  );
}