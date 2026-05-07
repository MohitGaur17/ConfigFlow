# ConfigFlow

ConfigFlow is a config-driven full-stack app builder.
Users submit JSON app configs, then preview, manage, and export generated apps from a single dashboard.

## Architecture

- Frontend: Next.js (App Router), React, Tailwind CSS
- Backend: Express.js, TypeScript, JWT auth
- Database: PostgreSQL with Prisma
- Monorepo: npm workspaces (`client`, `server`, `shared`)

## Current Product Flow

1. User registers or logs in.
2. User pastes a JSON app config on the landing page.
3. Backend validates config and creates a user-owned app record.
4. User is redirected to `/builder/:appId` for live preview.
5. Dynamic routes render pages from that app's config.
6. User can export generated source code as a ZIP.

## Key Features

- JWT authentication with protected API routes
- Multi-app, per-user app management
- Dynamic CRUD API routes scoped by `appId` and `entityName`
- Dashboard widgets (stats/charts/recent data)
- CSV preview and import with mapping suggestions
- Code export endpoint that returns a generated ZIP

## Repository Structure

```text
.
|- client/              # Next.js frontend
|- server/              # Express API + Prisma integration
|- shared/              # Shared types and config validation utilities
|- configs/             # Example JSON app configs
|- package.json         # Workspace scripts
`- tsconfig.base.json   # Base TypeScript config
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database

## Environment Variables

Create `server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=replace-with-a-strong-secret
PORT=4000
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:4000

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# OAuth (GitHub)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:4000/api/auth/github/callback

# Optional: where server redirects after successful OAuth callback
CLIENT_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

Optional for frontend (`client/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Local Development

Install dependencies:

```bash
npm install
```

Prepare Prisma schema:

```bash
npm run prisma:push --workspace=server
```

Run frontend and backend together:

```bash
npm run dev
```

Default URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

## Main API Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/auth/github/start`
- `GET /api/auth/github/callback`

Apps:

- `POST /api/apps`
- `GET /api/apps`
- `GET /api/apps/:id`
- `DELETE /api/apps/:id`
- `GET /api/apps/:id/export`

Entities (dynamic):

- `GET /api/entities/:appId/:entityName`
- `GET /api/entities/:appId/:entityName/:id`
- `POST /api/entities/:appId/:entityName`
- `PUT /api/entities/:appId/:entityName/:id`
- `DELETE /api/entities/:appId/:entityName/:id`
- `GET /api/entities/:appId/:entityName/stats`
- `GET /api/entities/:appId/:entityName/recent`

CSV:

- `POST /api/csv/:appId/:entityName/preview`
- `POST /api/csv/:appId/:entityName/import`

## Build

```bash
npm run build
```

This builds both server and client workspaces.
