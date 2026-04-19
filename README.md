# Harbor PM

Harbor PM is now scaffolded as a full-stack property management platform with:

- `frontend/`: React + Vite application
- `backend/`: Express API with JWT auth and Prisma
- PostgreSQL via Docker Compose
- Seeded portfolio, tenant, lease, payment, and document-aware demo data
- Configurable document storage with a local provider now and Google Cloud Storage planned next

The original static prototype is still available at the repo root in `index.html`, `styles.css`, and `app.js` as a visual reference.

## Stack

- Frontend: React, React Router, Vite
- Backend: Express
- Auth: Email/password with `bcryptjs` and JWT bearer tokens
- Database: PostgreSQL
- ORM: Prisma
- Files: Local pilot storage today, provider abstraction for future Google Cloud Storage

## Project Structure

```text
.
|-- frontend/
|   |-- src/
|   |-- package.json
|-- backend/
|   |-- prisma/
|   |-- src/
|   |-- package.json
|-- docker-compose.yml
|-- package.json
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop or a local PostgreSQL instance
- Git

## Dependencies To Install

### System dependencies

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop 4+ with `docker compose`
- PostgreSQL 16 if you are not using Docker
- Git

### JavaScript workspace dependencies

These are installed from the root with one command:

```powershell
npm install
```

Root workspace uses npm workspaces and will install packages for both `frontend` and `backend`.

### Frontend packages

- `react` `^18.3.1`
- `react-dom` `^18.3.1`
- `react-router-dom` `^6.30.1`
- `vite` `^5.4.10`
- `@vitejs/plugin-react` `^4.4.1`

### Backend packages

- `@prisma/client` `^5.22.0`
- `bcryptjs` `^2.4.3`
- `cors` `^2.8.5`
- `dotenv` `^16.4.5`
- `express` `^4.21.1`
- `jsonwebtoken` `^9.0.2`
- `multer` `^1.4.5-lts.1`
- `nodemon` `^3.1.7`
- `prisma` `^5.22.0`

## Install Tools First

### Windows

1. Install Node.js LTS from the official installer.
2. Open a new terminal and verify:

```powershell
node -v
npm -v
```

3. Install Docker Desktop and verify:

```powershell
docker -v
docker compose version
```

4. If you want Git locally, verify:

```powershell
git --version
```

### Optional direct PostgreSQL install

If you do not want Docker, install PostgreSQL 16 locally and update `backend/.env` with your real connection string.

## First Run

1. Copy env files:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

2. Start PostgreSQL:

```powershell
docker compose up -d
```

3. Install dependencies:

```powershell
npm install
```

4. Generate Prisma client and migrate:

```powershell
npm run db:generate
npm run db:migrate
```

5. Seed demo data:

```powershell
npm run db:seed
```

6. Start the backend and frontend in separate terminals:

```powershell
npm run dev:backend
npm run dev:frontend
```

Frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Environment Files

### Frontend

File: `frontend/.env`

```env
VITE_API_URL=http://localhost:4000/api
```

### Backend

File: `backend/.env`

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/harbor_pm?schema=public
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=uploads
```

## Useful Commands

### Root

```powershell
npm install
npm run dev:frontend
npm run dev:backend
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Docker database

```powershell
docker compose up -d
docker compose down
docker compose logs -f
```

## Demo Login

- Email: `owner@harborpm.com`
- Password: `password123`

## Implemented Features

- Auth screens with register/login flow
- Protected React management workspace route
- Property creation and unit setup
- Tenant registration with government ID and police verification fields
- Lease creation with rent, deposit, and key commercial terms
- Tenant and lease document uploads with storage metadata
- PostgreSQL schema for users, properties, units, tenants, leases, payments, documents, and maintenance
- Seed script matching the new setup workflow

## Document Storage

Document records are now split into:

- file metadata in PostgreSQL
- file bytes in a storage provider

Current provider:

- `local`

Planned provider:

- `gcs` for Google Cloud Storage

### Why local first?

This lets the pilot workflows work immediately without blocking on cloud bucket setup. The app already stores:

- storage provider name
- storage bucket/container
- storage object key

That means we can switch from local storage to Google Cloud Storage later without redesigning the data model.

### Storage environment variables

```env
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=uploads
```

### Google Cloud Storage handoff point

The next infrastructure setup milestone is when you are ready to:

1. create a Google Cloud Storage bucket
2. create a service account with bucket access
3. provide the bucket name and credentials securely
4. switch `STORAGE_PROVIDER` from `local` to `gcs`

Once you are ready for that, we will wire the real GCS provider into the existing storage abstraction.

## Server Deployment Notes

When we take this to a server later, plan to install:

- Node.js 20+
- npm 10+
- PostgreSQL 16+ or a managed PostgreSQL service
- A process manager such as PM2 or systemd
- Nginx or another reverse proxy for HTTPS and routing

Recommended production setup:

1. Build the frontend with `npm run build --workspace frontend`.
2. Run the backend with `npm run start --workspace backend`.
3. Set production env vars on the server.
4. Use a strong `JWT_SECRET`.
5. Point `CLIENT_URL` to the real frontend domain.
6. Use HTTPS and a reverse proxy.
7. Run Prisma migrations against the production database before starting the app.

Suggested production environment variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/harbor_pm?schema=public
JWT_SECRET=use-a-long-random-secret
CLIENT_URL=https://your-frontend-domain.com
```

## Render Deployment

If you are focusing on Render first, you do not need to install PostgreSQL locally right now unless you also want local development.

### What to create on Render

- 1 static frontend service
- 1 Node backend web service
- 1 Render PostgreSQL database

### Render-ready files included

- [render.yaml](C:\Vishal\Apps\Codex\Property Management\render.yaml)
- root scripts in [package.json](C:\Vishal\Apps\Codex\Property Management\package.json)
- backend production migration script in [backend/package.json](C:\Vishal\Apps\Codex\Property Management\backend\package.json)

### Important note about Postgres on Render

Yes, you should provision Postgres on Render for the deployed app. You do not need to install the PostgreSQL software on your own machine for the Render deployment itself.

### Recommended Render setup

Backend service:

- Build command: `npm install && npm run db:generate --workspace backend`
- Start command: `npm run start --workspace backend`

Frontend service:

- Build command: `npm install && npm run build --workspace frontend`
- Publish directory: `frontend/dist`

### Backend environment variables on Render

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=<Render Postgres connection string>`
- `JWT_SECRET=<long random secret>`
- `CLIENT_URL=https://your-frontend-domain.onrender.com`

### Frontend environment variables on Render

- `VITE_API_URL=https://your-backend-domain.onrender.com/api`

These two public URL variables should be set manually in the Render dashboard because Render Blueprint `fromService.host` provides an internal hostname, not the public HTTPS URL.

### Migrations on Render

Run this against the production database before or during deploy:

```bash
npm run render:migrate
```

This uses Prisma's production-safe migration command.

### First-time database setup on Render

Because this pilot project does not yet include committed Prisma migration files, the fastest first production setup is:

```bash
npm run render:db:push
npm run db:seed
```

Use `db:push` once to create the schema on the Render Postgres database, then seed demo data if you want the starter login and portfolio data.

For Render free-tier deployments without shell access, the backend startup now runs:

```bash
npm run db:push && node src/bootstrap.js && node src/server.js
```

That means:

- the schema is created automatically on startup
- demo data is inserted automatically only if the database is empty
- later restarts will skip seeding once users already exist

## Good Next Steps

- Add owner, manager, and staff roles
- Switch from local token storage to secure HTTP-only cookies
- Replace local document storage with Google Cloud Storage
- Add payment ledger CRUD and reporting exports
- Add lease renewals, move-out flow, and role-based permissions
- Add tests for auth, dashboard serialization, and API routes
