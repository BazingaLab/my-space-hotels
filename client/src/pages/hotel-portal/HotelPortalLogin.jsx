import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { theme } from "../../lib/theme.js";
import Logo from "../../components/Logo.jsx";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function HotelPortalLogin() {
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
      // Step 1: Sign in
      const data = await signIn(form.email, form.password);
      const userId = data?.user?.id;

      if (!userId) {
        throw new Error("Authentication failed");
      }

      // Step 2: Check role via backend API (bypasses RLS)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/role/${userId}`
      );

      if (!res.ok) {
        throw new Error("Unable to verify account role");
      }

      const roleData = await res.json();

      // Step 3: Validate role
      if (roleData.role !== "hotel_admin" && roleData.role !== "super_admin") {
        await signOut();
        throw new Error("Unauthorized. Hotel partner account required.");
      }

      // Step 4: Success
      navigate("/hotel-portal");

    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%",
    padding: "14px 16px 14px 44px",
    border: `1px solid ${theme.SAND}`,
    background: "#fff",
    fontSize: 14,
    color: theme.INK,
    outline: "none",
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>

      {/* LEFT PANEL */}
      <div style={{ background: theme.SEA_DEEP, padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: -80, bottom: -80, width: 400, height: 400, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />

        {/* LOGO */}
        <div style={{ position: "relative" }}>
          <Logo subtitle="HOTEL PARTNER PORTAL" subtitleColor="rgba(255,255,255,0.5)" chip />
        </div>

        {/* CONTENT */}
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

        {/* FOOTER */}
        <div style={{ position: "relative", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          New partner?{" "}
          <Link to="/hotel-portal/signup" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Create an account →</Link>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center", background: theme.CREAM }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 16, textTransform: "uppercase" }}>— Hotel Partner</div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, marginBottom: 40, lineHeight: 1.1 }}>
            Welcome<br />back.
          </h1>

          {/* DIVIDER */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: theme.SAND }} />
            <span style={{ fontSize: 12, color: theme.MUTED }}>SIGN IN</span>
            <div style={{ flex: 1, height: 1, background: theme.SAND }} />
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* EMAIL */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type="email" style={inp} placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.2em", color: theme.SEA_DARK, textTransform: "uppercase", marginBottom: 8, display: "block", fontWeight: 600 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={theme.MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input required type={showPassword ? "text" : "password"} style={{ ...inp, paddingRight: 44 }} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: theme.MUTED, display: "flex", alignItems: "center" }}>
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

            {/* BUTTON */}
            <button type="submit" disabled={loading} className="cta-btn" style={{
              background: theme.SEA_DEEP, color: theme.CREAM, border: "none",
              padding: 16, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
              fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Signing in…" : <>Access Portal <ArrowRight size={14} /></>}
            </button>
          </form>

          {/* INFO BOX */}
          <div style={{ marginTop: 28, padding: 20, background: theme.SAND, fontSize: 13, color: theme.MUTED, lineHeight: 1.6 }}>
            <strong style={{ color: theme.INK }}>Not a partner yet?</strong>{" "}
            Create your hotel partner account and list your property in minutes.{" "}
            <Link to="/hotel-portal/signup" style={{ color: theme.SEA_DARK, fontWeight: 600 }}>Sign up here →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}