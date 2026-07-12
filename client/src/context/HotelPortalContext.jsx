import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { adminApi } from "../lib/api.js";

const HotelPortalContext = createContext({
  myHotel: null,        // the currently-active hotel
  myHotels: [],         // all hotels owned by this user
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
        // TEMPORARY client-side filter — once GET /api/admin/hotels is
        // role-scoped server-side (returning only this owner's hotels for
        // hotel_admin), this .filter() becomes redundant but stays harmless
        // as a defense-in-depth check.
        const owned = (hotelsData.hotels || []).filter(h => h.owner_id === user.id);
        setMyHotels(owned);
        // Keep the current selection if still valid, else default to the first
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
    // Wait for AuthContext to finish restoring the session first — same
    // reasoning as AdminContext: avoids briefly reporting "not a hotelier,
    // done loading" on refresh before the real user is even available.
    if (authLoading) return;
    loadHotels();
  }, [user, authLoading]);

  // The active hotel object derived from the id
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