import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { adminApi } from "../lib/api.js";

const AdminContext = createContext({ role: "guest", isAdmin: false, isHotelAdmin: false, loading: true });

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      adminApi.getRole(user.id)
        .then(data => setRole(data.role || "guest"))
        .catch(() => setRole("guest"))
        .finally(() => setLoading(false));
    } else {
      setRole("guest");
      setLoading(false);
    }
  }, [user]);

  return (
    <AdminContext.Provider value={{
      role,
      loading,
      isAdmin: role === "super_admin",
      isHotelAdmin: role === "hotel_admin" || role === "super_admin",
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);