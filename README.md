# ConfigFlow

ConfigFlow is a config-driven full-stack app builder.
Users submit JSON app configs, preview apps, manage generated projects, and export a complete codebase ZIP.

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
- OAuth start/callback routes for Google and GitHub
- Multi-app, per-user app management
- Dynamic CRUD API routes scoped by `appId` and `entityName`
- Dashboard widgets (stats/charts/recent data)
- Code export endpoint that returns a generated ZIP
- i18n support (including RTL)
- Notification and email delivery support

## Implementation Status

Current delivery snapshot:

- Config runtime: complete
- Dynamic frontend renderers: complete
- Dynamic backend entity layer: complete
- Export pipeline: complete
- Automated test suite: in progress
- CI expansion (lint/tests/smoke): in progress
- Deployment runbook: pending

Detailed execution plan and phase-wise roadmap are maintained in:

- `implementation_plan.md`

## Near-Term Roadmap

1. Add server/shared unit tests for validation and config engine behavior.
2. Add integration tests for app and entity endpoints.
3. Add generator snapshot tests for output integrity.
4. Expand CI to run lint, tests, and build smoke checks.
5. Add startup env validation and basic production hardening.

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

Optional seed:

```bash
npm run prisma:seed --workspace=server
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

## Build

```bash
npm run build
```

This builds both server and client workspaces.

## Workspace Scripts

- `npm run dev` - run server and client together
- `npm run dev:server` - run server workspace only
- `npm run dev:client` - run client workspace only
- `npm run build` - build all workspaces

## Troubleshooting

- If Prisma client is out of date, run:

```bash
npm run prisma:generate --workspace=server
```

- If API requests fail locally, verify:
	- `CLIENT_URL` and `SERVER_URL` in `server/.env`
	- `NEXT_PUBLIC_API_URL` in `client/.env.local`
