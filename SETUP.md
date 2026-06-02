# My Space Hotels — Setup

## What changed in this build
- Fixed broken client/src/lib/api.js (dangling getComplaints that crashed the bundle).
- Added missing client/src/shared/ (DataTable, KPICard, StatusBadge, queryClient).
- Added client/src/features/complaints/hooks.jsx; wired AdminComplaints to it.
- Wrapped app in QueryClientProvider (TanStack Query works now).
- Added server audit.js, controllers/complaintsController.js, routes/complaintsRoutes.js; registered /api/complaints.
- NEW Hotel Onboarding: features/hotels/HotelOnboardingForm.jsx + pages/admin/AdminAddHotel.jsx at /admin/hotels/new (all columns from doc).
- Consolidated SQL: server/db/00-master-schema.sql and server/db/01-rls-policies.sql.

## 1. Database (Supabase SQL Editor, in order)
1. server/db/00-master-schema.sql
2. server/db/01-rls-policies.sql

## 2. Env files
client/.env:
  VITE_API_URL=http://localhost:5000
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...   (legacy anon eyJ... key)
server/.env:
  PORT=5000
  NODE_ENV=development
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...  (legacy service_role eyJ... key)
  CLIENT_URL=http://localhost:5173

## 3. Install & run
  cd client && npm install && npm run dev
  cd server && npm install && npm run dev

## Honest status
Working end-to-end: hotels, bookings, complaints (full), pending approvals, RBAC, new hotel onboarding form.
The admin sidebar also lists Customers / Wallets / Commissions / Team — those PAGES are not built yet and will 404.
The master schema already includes their tables so they are the next slices to build.
