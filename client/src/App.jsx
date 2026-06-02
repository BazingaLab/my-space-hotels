import {
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import { HotelPortalProvider } from "./context/HotelPortalContext.jsx";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/lib/queryClient.js";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

/* =========================
   PUBLIC PAGES
========================= */

import Home from "./pages/Home.jsx";
import Hotels from "./pages/Hotels.jsx";
import HotelDetail from "./pages/HotelDetail.jsx";
import Booking from "./pages/Booking.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import ListProperty from "./pages/ListProperty.jsx";

/* =========================
   ADMIN PAGES
========================= */

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHotels from "./pages/admin/AdminHotels.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";
import AdminComplaints from "./features/complaints/AdminComplaints.jsx";
import AdminAddHotel from "./pages/admin/AdminAddHotel.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail.jsx";
import AdminWallets from "./pages/admin/AdminWallets.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPending from "./pages/admin/AdminPending.jsx";

/* =========================
   HOTEL PORTAL PAGES
========================= */

import HotelPortalLogin from "./pages/hotel-portal/HotelPortalLogin.jsx";
import HotelPortalDashboard from "./pages/hotel-portal/HotelPortalDashboard.jsx";
import PropertyManager from "./pages/hotel-portal/PropertyManager.jsx";
import PhotoManager from "./pages/hotel-portal/PhotoManager.jsx";
import BookingsManager from "./pages/hotel-portal/BookingsManager.jsx";

/* =========================
   INNER ROUTES
========================= */

function AppRoutes() {
  const location = useLocation();

  const isAdminPath =
    location.pathname.startsWith(
      "/admin"
    );

  const isHotelPortalPath =
    location.pathname.startsWith(
      "/hotel-portal"
    );

  const isPublicPath =
    !isAdminPath &&
    !isHotelPortalPath;

  return (
    <>
      {/* =========================
          PUBLIC NAVBAR
      ========================= */}

      {isPublicPath && <Navbar />}

      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/hotels"
          element={<Hotels />}
        />

        <Route
          path="/hotels/:id"
          element={<HotelDetail />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/list-property"
          element={<ListProperty />}
        />

        {/* =========================
            AUTHENTICATED USER ROUTES
        ========================= */}

        <Route
          path="/book/:id"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ADMIN ROUTES
        ========================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotels/new"
          element={
            <ProtectedRoute requireAdmin>
              <AdminAddHotel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotels"
          element={
            <ProtectedRoute requireAdmin>
              <AdminHotels />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute requireAdmin>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/customers/:id"
          element={
            <ProtectedRoute requireAdmin>
              <AdminCustomerDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/wallets"
          element={
            <ProtectedRoute requireAdmin>
              <AdminWallets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute requireAdmin>
              <AdminComplaints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/owners"
          element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pending"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPending />
            </ProtectedRoute>
          }
        />

        {/* =========================
            HOTEL PORTAL ROUTES
        ========================= */}

        <Route
          path="/hotel-portal/login"
          element={
            <HotelPortalLogin />
          }
        />

        <Route
          path="/hotel-portal"
          element={
            <ProtectedRoute requireHotelAdmin>
              <HotelPortalDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hotel-portal/property"
          element={
            <ProtectedRoute requireHotelAdmin>
              <PropertyManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hotel-portal/photos"
          element={
            <ProtectedRoute requireHotelAdmin>
              <PhotoManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hotel-portal/bookings"
          element={
            <ProtectedRoute requireHotelAdmin>
              <BookingsManager />
            </ProtectedRoute>
          }
        />

        {/* =========================
            FALLBACK ROUTE
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>

      {/* =========================
          PUBLIC FOOTER
      ========================= */}

      {isPublicPath && <Footer />}
    </>
  );
}

/* =========================
   ROOT APP
========================= */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <HotelPortalProvider>
          <AppRoutes />
        </HotelPortalProvider>
      </AdminProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}