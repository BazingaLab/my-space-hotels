import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { theme } from "../lib/theme.js";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: "120px 6vw", textAlign: "center", color: theme.MUTED }}>
        <div className="serif" style={{ fontSize: 28 }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but remember where they were going
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}