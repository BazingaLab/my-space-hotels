import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import { HotelPortalProvider } from "./context/HotelPortalContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
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

function AdminRoutes() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/owners" element={<AdminUsers />} />
          <Route path="/admin/pending" element={<AdminPending />} />
        </Routes>
      </AdminProvider>
    </AuthProvider>
  );
}

function HotelPortalRoutes() {
  return (
    <AuthProvider>
      <AdminProvider>
        <HotelPortalProvider>
          <Routes>
            <Route path="/hotel-portal/login" element={<HotelPortalLogin />} />
            <Route path="/hotel-portal" element={<HotelPortalDashboard />} />
            <Route path="/hotel-portal/property" element={<PropertyManager />} />
            <Route path="/hotel-portal/photos" element={<PhotoManager />} />
            <Route path="/hotel-portal/bookings" element={<BookingsManager />} />
          </Routes>
        </HotelPortalProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

function PublicRoutes() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/list-property" element={<ListProperty />} />
          <Route path="/book/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </AdminProvider>
    </AuthProvider>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return <AdminRoutes />;
  if (path.startsWith("/hotel-portal")) return <HotelPortalRoutes />;
  return <PublicRoutes />;
}