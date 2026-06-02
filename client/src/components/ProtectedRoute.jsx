import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import { theme } from "../lib/theme.js";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireHotelAdmin = false,
}) {
  const { user, loading: authLoading } = useAuth();
  const {
    role,
    loading: roleLoading,
    isAdmin,
    isHotelAdmin,
  } = useAdmin();

  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div
        style={{
          padding: "120px 6vw",
          textAlign: "center",
          color: theme.MUTED,
        }}
      >
        <div className="serif" style={{ fontSize: 28 }}>
          Loading…
        </div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ADMIN ONLY
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // HOTEL ADMIN ONLY
  if (requireHotelAdmin && !isHotelAdmin) {
    return <Navigate to="/hotel-portal/login" replace />;
  }

  return children;
}
