import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import HotelOnboardingForm from "../../features/hotels/HotelOnboardingForm.jsx";
import { adminApi } from "../../lib/api.js";
import { theme } from "../../lib/theme.js";

export default function AdminAddHotel() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(location.state?.hotel || null);
  const [loading, setLoading] = useState(!!id && !location.state?.hotel);

  useEffect(() => {
    // Editing, but we weren't handed the hotel via navigation state
    // (direct link, bookmarked URL, or a page refresh) — fetch it instead.
    if (id && !hotel) {
      adminApi.getHotels()
        .then(d => setHotel((d.hotels || []).find(h => h.id === id) || null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const isEdit = !!id;

  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Onboarding</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>{isEdit ? "Edit Hotel" : "Add New Hotel"}</h1>
        <p style={{ color: theme.MUTED, marginTop: 8 }}>Complete property onboarding with all details, agreement terms, and bank information.</p>
      </div>
      <div style={{ maxWidth: 900 }}>
        {isEdit && loading ? (
          <div style={{ color: theme.MUTED }}>Loading hotel…</div>
        ) : isEdit && !hotel ? (
          <div style={{ color: "#a33" }}>Hotel not found.</div>
        ) : (
          <HotelOnboardingForm initial={hotel} onSaved={() => isEdit && navigate("/admin/hotels")} />
        )}
      </div>
    </AdminLayout>
  );
}