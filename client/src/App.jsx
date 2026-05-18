import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import { HotelPortalProvider } from "./context/HotelPortalContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public pages
import Home from "./pages/Home.jsx";
import Hotels from "./pages/Hotels.jsx";
import HotelDetail from "./pages/HotelDetail.jsx";
import Booking from "./pages/Booking.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import ListProperty from "./pages/ListProperty.jsx";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHotels from "./pages/admin/AdminHotels.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPending from "./pages/admin/AdminPending.jsx";

// Hotel portal pages
import HotelPortalLogin from "./pages/hotel-portal/HotelPortalLogin.jsx";
import HotelPortalDashboard from "./pages/hotel-portal/HotelPortalDashboard.jsx";
import PropertyManager from "./pages/hotel-portal/PropertyManager.jsx";
import PhotoManager from "./pages/hotel-portal/PhotoManager.jsx";
import BookingsManager from "./pages/hotel-portal/BookingsManager.jsx";

// Inner app that has access to location
function AppRoutes() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isHotelPortalPath = location.pathname.startsWith("/hotel-portal");
  const isPublicPath = !isAdminPath && !isHotelPortalPath;

  return (
    <>
      {/* Show main navbar only on public pages */}
      {isPublicPath && <Navbar />}

      <Routes>
        {/* ── PUBLIC ROUTES ── */}
        <Route path="/" element={<Home />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/list-property" element={<ListProperty />} />
        <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

        {/* ── ADMIN ROUTES ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/hotels" element={<AdminHotels />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/owners" element={<AdminUsers />} />
        <Route path="/admin/pending" element={<AdminPending />} />

        {/* ── HOTEL PORTAL ROUTES ── */}
        <Route path="/hotel-portal/login" element={<HotelPortalLogin />} />
        <Route path="/hotel-portal" element={<HotelPortalDashboard />} />
        <Route path="/hotel-portal/property" element={<PropertyManager />} />
        <Route path="/hotel-portal/photos" element={<PhotoManager />} />
        <Route path="/hotel-portal/bookings" element={<BookingsManager />} />
      </Routes>

      {/* Show main footer only on public pages */}
      {isPublicPath && <Footer />}
    </>
  );
}

// Single provider tree — ONE Supabase instance for the whole app
export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <HotelPortalProvider>
          <AppRoutes />
        </HotelPortalProvider>
      </AdminProvider>
    </AuthProvider>
  );
}