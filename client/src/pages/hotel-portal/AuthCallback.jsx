import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { theme } from "../../lib/theme.js";
import { CheckCircle2, XCircle } from "lucide-react";

// This page handles the redirect after email confirmation.
// Supabase sends the user here with a session token in the URL.
// We detect whether the signup was for a hotel owner (via metadata)
// and assign the hotel_admin role if so.
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handle = async () => {
      try {
        // Supabase automatically parses the token from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) throw new Error("No session found. The link may have expired.");

        const userId = session.user.id;
        const intent = session.user.user_metadata?.signup_intent;

        if (intent === "hotel_owner") {
          // Assign hotel_admin role via backend
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/promote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, role: "hotel_admin" }),
          });
          if (!res.ok) throw new Error("Could not assign partner role. Please contact support.");
          setStatus("success");
          setMessage("Email confirmed! Redirecting to your portal…");
          setTimeout(() => navigate("/hotel-portal"), 2000);
        } else {
          // Regular guest signup
          setStatus("success");
          setMessage("Email confirmed! Redirecting…");
          setTimeout(() => navigate("/"), 2000);
        }
      } catch (e) {
        setStatus("error");
        setMessage(e.message);
      }
    };
    handle();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: theme.CREAM }}>
      <div style={{ textAlign: "center", maxWidth: 440, padding: 48, background: "#fff", border: `1px solid ${theme.SAND}` }}>
        {status === "verifying" && (
          <>
            <div style={{ width: 48, height: 48, border: `3px solid ${theme.SEA}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 400 }}>Verifying your email…</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={56} color={theme.SEA} style={{ marginBottom: 20 }} />
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Email Confirmed</h2>
            <p style={{ color: theme.MUTED }}>{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={56} color="#a33" style={{ marginBottom: 20 }} />
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Something went wrong</h2>
            <p style={{ color: "#a33", marginBottom: 20 }}>{message}</p>
            <a href="/hotel-portal/signup" style={{ color: theme.SEA_DARK }}>Try signing up again →</a>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}