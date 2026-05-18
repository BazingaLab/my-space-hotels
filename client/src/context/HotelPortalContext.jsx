import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { adminApi } from "../lib/api.js";

const HotelPortalContext = createContext({
  myHotel: null,
  loading: true,
  isHotelier: false,
  refreshHotel: () => {},
});

export function HotelPortalProvider({ children }) {
  const { user } = useAuth();
  const [myHotel, setMyHotel] = useState(null);
  const [isHotelier, setIsHotelier] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHotel = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const roleData = await adminApi.getRole(user.id);
      const role = roleData.role;
      setIsHotelier(role === "hotel_admin" || role === "super_admin");

      if (role === "hotel_admin" || role === "super_admin") {
        const hotelsData = await adminApi.getHotels();
        const owned = (hotelsData.hotels || []).find(h => h.owner_id === user.id);
        setMyHotel(owned || null);
      }
    } catch (err) {
      console.error("Hotel portal load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHotel(); }, [user]);

  return (
    <HotelPortalContext.Provider value={{ myHotel, loading, isHotelier, refreshHotel: loadHotel }}>
      {children}
    </HotelPortalContext.Provider>
  );
}

export const useHotelPortal = () => useContext(HotelPortalContext);