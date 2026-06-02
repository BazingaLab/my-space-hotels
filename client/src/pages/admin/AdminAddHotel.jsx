import AdminLayout from "./AdminLayout.jsx";
import HotelOnboardingForm from "../../features/hotels/HotelOnboardingForm.jsx";
import { theme } from "../../lib/theme.js";

export default function AdminAddHotel() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 8, textTransform: "uppercase" }}>Onboarding</div>
        <h1 className="serif" style={{ fontSize: 48, fontWeight: 400 }}>Add New Hotel</h1>
        <p style={{ color: theme.MUTED, marginTop: 8 }}>Complete property onboarding with all details, agreement terms, and bank information.</p>
      </div>
      <div style={{ maxWidth: 900 }}>
        <HotelOnboardingForm />
      </div>
    </AdminLayout>
  );
}
