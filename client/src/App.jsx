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
import BookingDetail from "./pages/BookingDetail.jsx";
import AuthCallback from "./pages/hotel-portal/AuthCallback.jsx";
import ListProperty from "./pages/ListProperty.jsx";
import OurStory from "./pages/OurStory.jsx";
import TrustSafety from "./pages/TrustSafety.jsx";
import Sustainability from "./pages/Sustainability.jsx";
import CancellationPolicy from "./pages/CancellationPolicy.jsx";

/* =========================
   ADMIN PAGES
========================= */

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHotels from "./pages/admin/AdminHotels.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";
import AdminBookingLifecycle from "./pages/admin/AdminBookingLifecycle.jsx";
import AdminComplaints from "./features/complaints/AdminComplaints.jsx";
import AdminAddHotel from "./pages/admin/AdminAddHotel.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail.jsx";
import AdminWallets from "./pages/admin/AdminWallets.jsx";
import AdminCommissions from "./pages/admin/AdminCommissions.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPending from "./pages/admin/AdminPending.jsx";
import AdminTeam from "./pages/admin/AdminTeam.jsx";

/* =========================
   HOTEL PORTAL PAGES
========================= */

import HotelPortalLogin from "./pages/hotel-portal/HotelPortalLogin.jsx";
import HotelPortalSignup from "./pages/hotel-portal/HotelPortalSignup.jsx";
import HotelPortalDashboard from "./pages/hotel-portal/HotelPortalDashboard.jsx";
import PropertyManager from "./pages/hotel-portal/PropertyManager.jsx";
import PhotoManager from "./pages/hotel-portal/PhotoManager.jsx";
import BookingsManager from "./pages/hotel-portal/BookingsManager.jsx";
import WalletView from "./pages/hotel-portal/WalletView.jsx";
import AddProperty from "./pages/hotel-portal/AddProperty.jsx";
import KYCUpload from "./pages/hotel-portal/KYCUpload.jsx";
import AdminKYC from "./pages/admin/AdminKYC.jsx";

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

        <Route path="/our-story" element={<OurStory />} />
        <Route path="/trust-safety" element={<TrustSafety />} />
        <Route path="/sustainability" element={<Sustainability />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />

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

        <Route
          path="/my-bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetail />
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
          path="/admin/hotels/:id/edit"
          element={
            <ProtectedRoute requireAdmin>
              <AdminAddHotel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
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
          path="/admin/commissions"
          element={
            <ProtectedRoute requireAdmin>
              <AdminCommissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookingLifecycle />
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
          path="/admin/team"
          element={
            <ProtectedRoute requireAdmin>
              <AdminTeam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/kyc"
          element={
            <ProtectedRoute requireAdmin>
              <AdminKYC />
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
          path="/hotel-portal/signup"
          element={
            <HotelPortalSignup />
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
          path="/hotel-portal/wallet"
          element={
            <ProtectedRoute requireHotelAdmin>
              <WalletView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel-portal/add-property"
          element={
            <ProtectedRoute requireHotelAdmin>
              <AddProperty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hotel-portal/kyc"
          element={
            <ProtectedRoute requireHotelAdmin>
              <KYCUpload />
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

        <Route
          path="/auth/callback"
          element={<AuthCallback />}
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