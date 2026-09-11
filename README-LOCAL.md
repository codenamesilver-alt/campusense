# Campusense - School Management ERP (Local)

Frontend (React + Vite) + Backend (Express + MySQL). Originally built on Base44 BaaS; this version runs fully local with a custom Express/MySQL backend.

## Requirements

- Node.js 18+
- XAMPP (MySQL/MariaDB running on port 3306)

## First-time setup

### 1. Start MySQL (XAMPP)

Start the `MySQL` service in XAMPP Control Panel, or:

```powershell
Start-Process -FilePath "D:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=D:\xampp\mysql\bin\my.ini","--standalone" -WorkingDirectory "D:\xampp\mysql\bin"
```

### 2. Install frontend dependencies

```powershell
cd D:\campusense
npm install
```

### 3. Install backend dependencies

```powershell
cd D:\campusense\backend
npm install
```

### 4. Configure database connection

Edit `backend/.env` to match your XAMPP MySQL:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=campusense
PORT=5000
JWT_SECRET=change_me
```

### 5. Create DB, run migrations, seed

```powershell
& "D:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS campusense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd D:\campusense\backend
npx knex migrate:latest
npx knex seed:run
```

Seeds create the admin user, school settings, classes, sections, subjects, demo students and notices.

### 6. Start backend

```powershell
cd D:\campusense\backend
npm start
```

Backend runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 7. Start frontend

New terminal:

```powershell
cd D:\campusense
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Login

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@campusense.com   |
| Password | admin123               |

## Daily start

```powershell
# Terminal 1
Start-Process -FilePath "D:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=D:\xampp\mysql\bin\my.ini","--standalone" -WorkingDirectory "D:\xampp\mysql\bin"
# (or start MySQL in XAMPP Control Panel)

# Terminal 2
cd D:\campusense\backend; npm start

# Terminal 3
cd D:\campusense; npm run dev
```

## Architecture

```
Frontend (React/Vite, :5173)
   │  axios
   ▼
Express REST API (:5000)  /api/entities/:Resource  (generic CRUD)
   │  knex
   ▼
MySQL (XAMPP, :3306)  database: campusense   (~60 tables)
```

- **Auth**: JWT (7d expiry), bcrypt password hashing
- **Entities**: generic CRUD router maps any entity name to a table. Same interface as Base44 SDK: `list`, `filter`, `create`, `bulkCreate`, `update`, `delete`
- **Integrations** (stubbed locally): `UploadFile` saves to `backend/uploads/`; `InvokeLLM`, `SendEmail`, `SendSMS`, `GenerateImage` return placeholders
- **Functions** (stubbed): backup/restore, attendance insights, Excel sync return safe defaults
- **File uploads** served at `http://localhost:5000/uploads/...`

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/register` | Create user |
| GET | `/api/entities/:Resource` | List (query: sort, limit, skip) |
| GET | `/api/entities/:Resource/filter` | Filter (query params; supports `$gte`, `$lte`, `$in`, `$like` etc.) |
| GET | `/api/entities/:Resource/:id` | Get one |
| POST | `/api/entities/:Resource` | Create |
| POST | `/api/entities/:Resource/bulk` | Bulk create |
| PATCH | `/api/entities/:Resource/:id` | Update |
| DELETE | `/api/entities/:Resource/:id` | Delete |
| POST | `/api/integrations/Core/UploadFile` | File upload (multipart) |

All endpoints except login/register/health require `Authorization: Bearer <token>`.

## Notes

- **Keeping data**: re-running `npx knex seed:run` clears and re-seeds the core tables.
- **Changing schema**: edit `backend/migrations/`, then `npx knex migrate:latest`. Never edit existing production tables by hand.
- **Reset everything**: drop the DB, re-create, migrate, seed.