import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { adminApi } from "../lib/api.js";

const AdminContext = createContext({ role: "guest", isAdmin: false, isHotelAdmin: false, loading: true });

export function AdminProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState("guest");
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user?.id) {
      setRoleLoading(true);
      adminApi.getRole(user.id)
        .then(data => setRole(data.role || "guest"))
        .catch(() => setRole("guest"))
        .finally(() => setRoleLoading(false));
    } else {
      setRole("guest");
      setRoleLoading(false);
    }
    // Depends on user?.id specifically, not the user object — with
    // AuthContext now bailing out on unchanged sessions this is somewhat
    // belt-and-braces, but a stable primitive dependency is the correct
    // pattern regardless of what upstream does.
  }, [user?.id, authLoading]);

  return (
    <AdminContext.Provider value={{
      role,
      loading: authLoading || roleLoading,
      isAdmin: role === "super_admin",
      isHotelAdmin: role === "hotel_admin" || role === "super_admin",
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);