# Deployment Guide — Smart Local Government Platform

## Architecture

This project deploys as **two separate services** on Render:
1. **`smart-gov-backend`** — Node.js/Express API (web service)
2. **`smart-gov-frontend`** — Vite/React SPA (static site)

---

## Pre-Requisites (Create These Accounts First)

Before deploying, you must create free accounts on these external services.
These credentials are **never committed** to git — they are entered manually in the Render dashboard.

- [ ] **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** — Free M0 cluster + connection URI
- [ ] **[Cloudinary](https://cloudinary.com/)** — Free account: get `CLOUD_NAME`, `API_KEY`, `API_SECRET`
- [ ] **[Render](https://render.com/)** — Free account + connect your GitHub repository

---

## Step 1: Configure MongoDB Atlas

1. Create a free **M0** cluster on Atlas
2. Create a database user with a strong password
3. Go to **Network Access** → Add IP **`0.0.0.0/0`** (required for Render's dynamic IPs)
4. Go to **Database → Connect → Drivers** → Copy the URI
5. Set the database name to `smartgov`:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/smartgov?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy to Render via Blueprint

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your repo — Render auto-detects `render.yaml`
4. Render creates both services. **Do not trigger builds yet** — set secrets first (Step 3).

---

## Step 3: Set Environment Variables in Render Dashboard

> ⚠️ These are set manually in the dashboard. They use `sync: false` in render.yaml, which means Render will never overwrite them from git — they are secrets.

### `smart-gov-backend` — set all of these:

| Variable | Value | How to get it |
|---|---|---|
| `MONGODB_URI` | Full Atlas connection string | Atlas → Connect |
| `JWT_SECRET` | 64+ char random hex string | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Your API key | Cloudinary → API Keys |
| `CLOUDINARY_API_SECRET` | Your API secret | Cloudinary → API Keys |
| `FRONTEND_URL` | Frontend Render URL (set after Step 4) | e.g. `https://smart-gov-frontend.onrender.com` |

### `smart-gov-frontend` — set these:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://smart-gov-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://smart-gov-backend.onrender.com` |

---

## Step 4: Deployment Order (Order Matters!)

> The frontend build bakes `VITE_API_URL` into the JS bundle at build time.
> The backend needs `FRONTEND_URL` for CORS. Set them in this order:

1. **Deploy backend first** → note its assigned URL
2. **Set frontend env vars** (`VITE_API_URL`, `VITE_SOCKET_URL`) using the backend URL
3. **Trigger a frontend deploy/build**
4. **Note the frontend URL** → update `FRONTEND_URL` on the backend service → backend auto-redeploys

---

## Step 5: Create the Admin Account

After both services are live, run this **once, locally**:

```bash
cd backend
MONGODB_URI="your_production_atlas_uri" \
ADMIN_EMAIL="admin@yourdomain.np" \
ADMIN_PASSWORD="YourStrongPassword123!" \
ADMIN_NAME="Administrator" \
node updateAdmin.js
```

> ⚠️ Do NOT set `ADMIN_EMAIL`/`ADMIN_PASSWORD` as permanent env vars in Render.
> Run the script once locally, then keep the credentials in a password manager.

---

## CORS — Security Verification

The backend's `allowedOrigins` in `server.js`:
```js
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,   // Your production URL
].filter(Boolean);
```

- ✅ **NOT a wildcard** — only exact listed URLs are allowed
- ✅ `.filter(Boolean)` safely removes `undefined` if `FRONTEND_URL` is unset locally
- ✅ Once `FRONTEND_URL` is set on Render, the production frontend is allowed automatically
- ✅ Unrelated origins (e.g. scrapers) will receive `403 CORS policy` errors

---

## Morgan Logging — Security Verification

Morgan is configured as:
```js
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
```

- **`combined` format** logs: IP, timestamp, method, URL path, HTTP status, response size, user-agent
- ✅ **Passwords are NOT logged** — Morgan logs URL paths, not request bodies
- ✅ **JWT tokens are NOT logged** — Morgan's `combined` format does not log request headers
- ✅ Sensitive POST body data (`password`, `citizenshipNumber`, etc.) is invisible to Morgan

---

## Health Check Verification

After deploying, verify the backend is live:
```bash
curl https://smart-gov-backend.onrender.com/health
```
Expected response:
```json
{"success": true, "message": "Smart Gov Platform API is running", "timestamp": "...", "environment": "production"}
```

---

## MongoDB Connection Retry (db.js)

On startup, if MongoDB is briefly unreachable, the backend retries with **exponential backoff**:

| Attempt | Delay Before Retry |
|---|---|
| 1 | — (immediate) |
| 2 | 1 second |
| 3 | 2 seconds |
| 4 | 4 seconds |
| 5 | 8 seconds |
| After 5 failures | Process exits with code 1 |

This prevents the app from crashing immediately during Atlas cold starts.

---

## Your Manual Checklist

Since these steps require account creation or dashboard access, you must do them manually:

- [ ] Create MongoDB Atlas account + M0 free cluster
- [ ] Whitelist `0.0.0.0/0` in Atlas Network Access
- [ ] Create Cloudinary account
- [ ] Create Render account + connect GitHub repo
- [ ] Deploy via Blueprint (render.yaml)
- [ ] Set 6 backend env vars in Render dashboard
- [ ] Set 2 frontend env vars in Render dashboard
- [ ] Trigger backend deploy → note backend URL
- [ ] Trigger frontend deploy (with VITE_API_URL set) → note frontend URL
- [ ] Update backend's `FRONTEND_URL` with frontend URL → redeploy backend
- [ ] Run `updateAdmin.js` script locally once to seed the admin account
- [ ] Verify `/health` returns `200 OK`
- [ ] Test end-to-end: register → login → apply → admin approve
