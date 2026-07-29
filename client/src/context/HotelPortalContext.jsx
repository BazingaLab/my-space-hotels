import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { adminApi } from "../lib/api.js";

const HotelPortalContext = createContext({
  myHotel: null,
  myHotels: [],
  activeHotelId: null,
  setActiveHotelId: () => {},
  loading: true,
  isHotelier: false,
  refreshHotel: () => {},
});

export function HotelPortalProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [myHotels, setMyHotels] = useState([]);
  const [activeHotelId, setActiveHotelId] = useState(null);
  const [isHotelier, setIsHotelier] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHotels = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const roleData = await adminApi.getRole(user.id);
      const role = roleData.role;
      const hotelier = role === "hotel_admin" || role === "super_admin";
      setIsHotelier(hotelier);

      if (hotelier) {
        const hotelsData = await adminApi.getHotels();
        const owned = (hotelsData.hotels || []).filter(h => h.owner_id === user.id);
        setMyHotels(owned);
        setActiveHotelId(prev => {
          if (prev && owned.some(h => h.id === prev)) return prev;
          return owned[0]?.id || null;
        });
      }
    } catch (err) {
      console.error("Hotel portal load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadHotels();
    // Same reasoning as AdminContext — depend on the stable id, not the
    // user object reference, as a second line of defense against spurious
    // re-fetches on tab refocus.
  }, [user?.id, authLoading]);

  const myHotel = myHotels.find(h => h.id === activeHotelId) || null;

  return (
    <HotelPortalContext.Provider value={{
      myHotel, myHotels, activeHotelId, setActiveHotelId,
      loading: authLoading || loading, isHotelier, refreshHotel: loadHotels,
    }}>
      {children}
    </HotelPortalContext.Provider>
  );
}

export const useHotelPortal = () => useContext(HotelPortalContext);