# Campusense — Hostinger Deployment Guide

Deploys the local Express/MySQL ERP (this repo) onto Hostinger shared hosting.
**No source code changes required** — this is configuration + platform setup.

Architecture:

```
Browser  ──>  https://yourdomain.com        (React+Vite static build in public_html, Apache + .htaccess)
                │  API calls to VITE_API_URL
                ▼
            https://api.yourdomain.com      (Express backend, Hostinger "Node.js" app)
                ▼
            MySQL database (Hostinger MySQL, connect via localhost from the server)
```

---

## 1. Prerequisites

- Hostinger account with a domain attached (shared hosting or Cloud).
- Access to **hPanel** (hosting panel) and **Terminal/SSH** enabled for the site.
- Local machine with Node.js 18+ (for building the frontend + packaging the backend).

---

## 2. Create the MySQL database (hPanel)

1. hPanel → **Databases → MySQL Databases → Create Database**.
2. Note the **prefixed** names Hostinger generates:
   - Database name: `u123456789_campusense`
   - Username:       `u123456789_admin` (or whatever you picked)
   - Password:       the one you set
3. Host: use **`localhost`** (the backend runs on the same server; no external host needed).
4. Leave empty: "allow remote access" — keep it off.

---

## 3. Deploy the backend (Express API)

### 3.1 Create the Node.js app (hPanel)

1. hPanel → Websites → your site → **Node.js → Create Node.js application**.
2. Settings:
   - **Application root directory**: `/backend`
   - **Application startup file**: `src/index.js`
   - **Node.js version**: Node.js 20 LTS (Node 18+ required; 20 recommended)
   - **Application URL / domain**: `api.yourdomain.com`
   - Click **Create**.
3. Add the environment variables in the Node.js panel (or via `.env` file — see 3.3):
   | Key | Value |
   |---|---|
   | `PORT` | port shown by Hostinger (e.g. `4100`) |
   | `DB_HOST` | `localhost` |
   | `DB_PORT` | `3306` |
   | `DB_USER` | `u123456789_admin` |
   | `DB_PASSWORD` | `<mysql password>` |
   | `DB_NAME` | `u123456789_campusense` |
   | `JWT_SECRET` | `<long random string>` |
   | `JWT_EXPIRES_IN` | `7d` |

   > `JWT_SECRET`: the code falls back to `supersecret_campusense_jwt_key_change_this_in_prod`
   > (backend/src/middleware/auth.js). Always set a real one in production.
   > Generate e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3.2 Upload the backend folder

Via FTP/File Manager, upload the **`backend/`** folder to the site root so the
path becomes `/backend/src/index.js`.

⚠️ **Copy the local `backend/.env` aside and delete it from the upload.** The local one
points at your XAMPP MySQL (`root`/empty password) — it must NOT ship. Production
values go in the hPanel env vars (3.1) so a `.env` file is optional.

Also keep these local-only, do NOT upload:
- `node_modules/` (you reinstall on the server)
- `uploads/` (recreate empty; must be writable)
- `vite.log`, `npm-debug.log`, any `.log`

### 3.3 Install dependencies + run migrations + seed

Open **Terminal** (hPanel → Advanced → Terminal) and run:

```bash
cd backend
npm install --omit=dev
npm run migrate        # knex migrate:latest — creates all tables + alias columns
npm run seed           # knex seed:run — creates admin user + full demo data
```

> Only **migrate** is essential; **seed** can be skipped if you want to start with an
> empty system (but then register a user — registration is `/api/auth/register`).

### 3.4 Restart + verify

1. hPanel Node.js panel → **Restart** the app (or it auto-restarts on change).
2. Verify:
   ```
   https://api.yourdomain.com/api/health
   ```
   Returns `{"status":"ok","service":"campusense-backend",...}`.

---

## 4. Deploy the frontend (React + Vite)

### 4.1 Build with the production API URL

On your local machine (in `D:\campusense`):

```powershell
# PowerShell
$env:VITE_API_URL = "https://api.yourdomain.com/api"
npm run build
```

or one-shot:

```bash
VITE_API_URL=https://api.yourdomain.com/api npm run build
```

⚠️ **This is the #1 deploy gotcha.** `src/api/base44Client.js` falls back to
`http://localhost:5000/api` when `VITE_API_URL` is unset. If you forget this var, the
site loads but every API call hits localhost. The URL is baked into `dist/` at build
time — rebuild if you change it.

The build output lands in `D:\campusense\dist\`.

### 4.2 Upload to public_html

Upload the **contents of `dist/`** (not the folder itself) into `public_html/` via
File Manager or FTP. You should end up with `public_html/index.html`.

Delete any leftover files in `public_html` that could shadow the app (e.g. default
`index.html` from Hostinger).

### 4.3 SPA deep-link rewrite — `.htaccess`

The app uses `BrowserRouter` (`src/App.jsx`): refresh on `/StudentHouse` or `/ExamInsights`
would 404 without a rewrite. Create `public_html/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

Also add HTTP→HTTPS redirect (Hostinger usually applies auto-SSL):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 5. Verification checklist

1. `GET https://api.yourdomain.com/api/health` → 200.
2. `https://yourdomain.com` loads the login page.
3. Login `admin@campusense.com` / `admin123` → dashboard.
4. Open `https://yourdomain.com/StudentHouse` directly (URL bar) → renders, no 404.
5. Open `https://yourdomain.com/SchoolCalendar` directly → renders.
6. Check Hostinger Node.js **Logs** for the recent request noise and fix anything failing.

---

## 6. Go-live hardening (recommended, optional)

1. **Change the admin password** immediately after seeding.
2. **Tighten CORS** — `backend/src/index.js` currently allows all origins:
   ```js
   app.use(cors());                       // now
   // app.use(cors({ origin: 'https://yourdomain.com' }));   // after go-live
   ```
3. Rotate `JWT_SECRET` on a schedule / per environment.
4. Backend startup file `src/index.js` listens on `PORT` from env — Hostinger sets it.

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Site loads but blank / API fails | `VITE_API_URL` unset at build time → rebuild with it. |
| Deep links 404 on refresh | Missing `.htaccess` rewrite (section 4.3). |
| `ECONNREFUSED` DB | `DB_HOST` wrong — use `localhost` on the server, not a hostname. |
| `Access denied for user` | User/db are **prefixed**; check `u123456789_...` names + password. |
| Migrations table already exists | Re-run migrate is safe (knex tracks batches). Never edit applied migration files. |
| `Cannot find module 'knex'` | Ran install outside `backend/` — `cd backend && npm install --omit=dev`. |
| 413 Payload Too Large | Not this app (limit 25mb); check hosting limits for uploads >25mb. |
| Uploads don't show | `backend/uploads/` must exist and be writable. |

---

## Local dev recap (unchanged)

- Backend: `cd D:\campusense\backend && npm start` (port 5000).
- Frontend: `cd D:\campusense && npm run dev` (port 5173).
- See `README-LOCAL.md` for the full local workflow.