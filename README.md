# My Space Hotels ✦

A premium hotel aggregator built with **React + Vite** (frontend), **Node + Express** (backend), and **Supabase** (PostgreSQL database). Deployed on **Vercel**.

## 📁 Project Structure

```
my-space-hotels/
├── client/          → React frontend (Vite)
│   ├── src/
│   │   ├── components/   (Navbar, Footer, SearchBar, HotelCard)
│   │   ├── pages/        (Home, Hotels, HotelDetail, Booking)
│   │   ├── lib/          (api.js, theme.js)
│   │   └── App.jsx
│   └── package.json
│
└── server/          → Express backend
    ├── config/      (supabase.js)
    ├── controllers/ (hotelController, bookingController)
    ├── routes/      (hotelRoutes, bookingRoutes)
    ├── db/          (schema.sql, seed.js)
    └── index.js
```

---

## 🚀 Setup (One-Time, ~15 minutes)

### Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) → sign up (free)
2. Create a new project (any region close to India works — Mumbai/Singapore)
3. Wait ~2 minutes for it to provision
4. Once ready, go to **SQL Editor** (left sidebar) → **New Query**
5. Open `server/db/schema.sql`, copy the entire contents, paste into the editor, click **Run**
6. You should see: *Success. No rows returned.*
7. Now go to **Settings → API** and copy two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" — click reveal, then copy)

⚠️ **Never commit the service_role key to GitHub** — it bypasses Row Level Security.

### Step 2: Install backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and paste your Supabase values:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
CLIENT_URL=http://localhost:5173
```

### Step 3: Seed the database

```bash
npm run seed
```

You should see `✓ Inserted 6 hotels`.

### Step 4: Run backend

```bash
npm run dev
```

Backend runs at `http://localhost:5000`. Test it: open `http://localhost:5000/api/hotels` in your browser — you should see a JSON array.

### Step 5: Install & run frontend

Open a **new terminal**:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`. Open it in your browser — your hotel site is live locally! ✦

---

## 🌐 Deployment (Vercel)

You'll deploy **two Vercel projects** — one for frontend, one for backend — because they have different environment variables and build settings. Both connect to the same GitHub repo.

### Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-space-hotels.git
git push -u origin main
```

### Deploy the BACKEND first

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. **IMPORTANT**: Set **Root Directory** to `server`
4. Framework: *Other*
5. Under **Environment Variables**, add:
   - `SUPABASE_URL` → your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` → your service role key
   - `CLIENT_URL` → leave blank for now (we'll add the frontend URL after)
   - `NODE_ENV` → `production`
6. Click **Deploy**
7. Once deployed, copy the URL (e.g. `https://my-space-hotels-server.vercel.app`)

### Deploy the FRONTEND

1. Vercel dashboard → **Add New Project** again
2. Import the same GitHub repo
3. Set **Root Directory** to `client`
4. Framework: **Vite** (auto-detected)
5. Under **Environment Variables**:
   - `VITE_API_URL` → your backend URL from above
6. Click **Deploy**
7. You get a URL like `https://my-space-hotels.vercel.app` — share this with clients!

### Final step: Update backend CORS

Go back to your backend project on Vercel → **Settings → Environment Variables** → edit `CLIENT_URL` and set it to your frontend URL. Click **Redeploy** to apply.

---

## 🔁 Continuous Deployment

From now on, every `git push` to main auto-deploys both projects. No manual work.

---

## 📡 API Endpoints

| Method | Endpoint                                 | Purpose                          |
|--------|------------------------------------------|----------------------------------|
| GET    | `/api/hotels`                            | List hotels (filters in query)   |
| GET    | `/api/hotels/:id`                        | Get hotel by ID                  |
| GET    | `/api/hotels/featured/list`              | Featured hotels                  |
| GET    | `/api/hotels/destinations/popular`       | Popular cities                   |
| POST   | `/api/hotels`                            | Create a hotel (admin)           |
| POST   | `/api/bookings`                          | Create a booking                 |
| GET    | `/api/bookings/:email`                   | List bookings for an email       |

**Filter examples:**
- `/api/hotels?city=Goa`
- `/api/hotels?tag=Heritage&minPrice=10000`
- `/api/hotels?search=palace`

---

## 🛠️ Troubleshooting

**"Couldn't load hotels" on the frontend**
→ Backend isn't running or `VITE_API_URL` is wrong. Check the browser console.

**CORS errors in browser**
→ Update `CLIENT_URL` in your backend `.env` (or Vercel env vars) to include your frontend URL.

**`npm run seed` fails**
→ Verify your `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key, not the anon key.

**Vercel build fails on backend**
→ Make sure Root Directory is set to `server`, not the project root.

---

## 🎨 Brand

- Primary: Sea Green `#2E8B7F`
- Dark: `#0F4A43`
- Cream: `#FAF7F2`
- Ink: `#15201E`
- Fonts: Cormorant Garamond (serif) + Inter (sans)

---

Built with care. ✦
