import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { adminApi } from "../lib/api.js";

const AdminContext = createContext({ role: "guest", isAdmin: false, isHotelAdmin: false, loading: true });

export function AdminProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState("guest");
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    // Wait for AuthContext to finish restoring the session first — otherwise
    // a page refresh briefly reports "guest, done loading" before the real
    // user object is even available, which can bounce an admin off a
    // protected page before their real role has a chance to load.
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
  }, [user, authLoading]);

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