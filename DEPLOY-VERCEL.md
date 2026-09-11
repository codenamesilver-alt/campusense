# Deploying Campusense to Vercel (Supabase + Postgres)

This guide covers launching Campusense with a Supabase PostgreSQL database and
deploying frontend + backend on Vercel.

## Architecture

```
Browser ──► Vercel (campusense-frontend.vercel.app)   [Vite static build at repo root]
                │
                └──► Vercel (campusense-backend.vercel.app)  [Express serverless, rootDir: backend/]
                          │
                          └──► Supabase Postgres + Storage
```

## 1. Supabase Setup

### Database

1. Open your Supabase project: https://supabase.com/dashboard
2. Project Settings → Database → Connection string → copy the **Session pooler**
   string (format: `postgresql://postgres.qwrevgjyvorbfkmvqujg:...@aws-0-<region>.pooler.supabase.com:5432/postgres`)
3. Replace `<your-password>` with your database password.

### API keys

Dashboard → Settings → API:

- `Project URL`: `https://qwrevgjyvorbfkmvqujg.supabase.co`
- `anon public` key
- `service_role` key (secret — server only)

### Storage bucket

1. Dashboard → Storage → New bucket
2. Name: `school-uploads`
3. Visibility: **Public**
4. Create

### Run migrations against Supabase

From the `backend/` directory, with your local `backend/.env` filled in:

```bash
cd backend
npm install
npm run migrate        # creates all 67 tables in Supabase
npm run seed           # optional demo data + admin@campusense.com / admin123
```

## 2. Local environment variables

`backend/.env` (already created locally — never commit):

```
DATABASE_URL=postgresql://postgres.qwrevgjyvorbfkmvqujg:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://qwrevgjyvorbfkmvqujg.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
PORT=5000
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
```

Frontend `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Migrate MySQL to Supabase + Vercel deployment"
git branch -M main
git remote add origin https://github.com/codenamesilver-alt/campusense.git
git push -u origin main
```

> `.env` files are gitignored — secrets never reach the repo.

## 4. Vercel Deployment

Create **two** Vercel projects from the same repo. Vercel supports this via Root
Directory.

### Backend project (`campusense-backend`)

1. Vercel → Add New → Project → import `campusense`
2. Framework Preset: **Other**
3. Root Directory: `backend`
4. Build Command: (leave empty)
5. Environment Variables:
   - `DATABASE_URL` = session pooler string
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` = `7d`
   - `NODE_ENV` = `production`
   - `VERCEL` = `1`
6. Deploy → note the URL, e.g. `https://campusense-backend.vercel.app`

> The serverless function is `backend/api/index.js`. The Express app serves
> `/api/*` paths. Health check: `https://<your-backend-url>/api/health`

### Frontend project (`campusense`)

1. Vercel → Add New → Project → import `campusense`
2. Framework Preset: **Vite** (auto-detected)
3. Root Directory: `/` (default)
4. Environment Variables:
   - `VITE_API_URL` = `https://campusense-backend.vercel.app/api`
5. Deploy

## 5. Verify

1. Visit `https://<your-backend-url>/api/health` → `{"status":"ok",...}`
2. Log in at the frontend URL with `admin@campusense.com` / `admin123`
   (if you ran the seed).

## Notes

- **Serverless + Postgres**: connections are created per lambda invocation.
  The pool is capped at 5. For higher traffic, move the backend to a small Node
  VM/server or use Supabase Edge Functions later.
- **File uploads** now go to the `school-uploads` bucket via
  `/api/integrations/Core/UploadFile`. Public URLs are returned directly.
- **mysql2** was removed. The `pg` driver + Knex query builder power all routes.