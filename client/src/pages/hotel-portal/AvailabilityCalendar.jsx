import HotelPortalLayout from "./HotelPortalLayout.jsx";
import { useHotelPortal } from "../../context/HotelPortalContext.jsx";
import InventoryCalendarPanel from "../../shared/components/InventoryCalendarPanel.jsx";
import { theme } from "../../lib/theme.js";

export default function AvailabilityCalendar() {
  const { myHotel } = useHotelPortal();

  return (
    <HotelPortalLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Manage</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Availability</h1>
        {myHotel && <p style={{ color: theme.MUTED, marginTop: 8 }}>{myHotel.name} — {myHotel.rooms} total rooms</p>}
      </div>
      <InventoryCalendarPanel hotel={myHotel} />
    </HotelPortalLayout>
  );
}
