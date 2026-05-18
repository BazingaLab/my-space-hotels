import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
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
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHotels from "./pages/admin/AdminHotels.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPending from "./pages/admin/AdminPending.jsx";
import HotelOwnerDashboard from "./pages/admin/HotelOwnerDashboard.jsx";

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
          <Route path="/admin/my-dashboard" element={<HotelOwnerDashboard />} />
        </Routes>
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
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminRoutes /> : <PublicRoutes />;
}