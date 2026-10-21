# ConfigFlow

> **Declarative JSON-Driven Full-Stack App Generator & Live Preview Studio**

ConfigFlow turns a JSON application configuration into an interactive preview and an exportable **Next.js (App Router) + Prisma + PostgreSQL + Tailwind CSS** project scaffold. Define entities, fields, pages, and authentication settings in one schema, then review and download the generated source code. Generated features depend on the configuration and the limitations described below; review and test an export before deploying it.

[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)

---

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [How It Works](#how-it-works)
- [Architecture & Monorepo Structure](#architecture--monorepo-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Initialization](#database-initialization)
  - [Running Locally](#running-locally)
- [App Configuration Schema](#app-configuration-schema)
- [API Reference](#api-reference)
- [Interactive Code Viewer & Export Pipeline](#interactive-code-viewer--export-pipeline)
- [Deployment Guides](#deployment-guides)
- [Workspace Scripts](#workspace-scripts)
- [Contributing & License](#contributing--license)

---

## Core Capabilities

- **Declarative Schema Compiler**: Define entities, fields, pages, and auth settings in a validated JSON configuration instead of hand-writing the initial app scaffold.
- **In-Browser Dynamic Runtime**:
  - **Table Views**: Search, pagination, column sorting, and configurable create, edit, and delete actions.
  - **Forms**: Field-aware inputs, create/edit modes, and server-side validation feedback.
  - **Dashboards**: Configurable metric cards, recharts visualizations (bar, line, pie), and recent activity lists.
- **Interactive Code Viewer**: Browse the generated codebase in-browser before exporting, using a file tree on larger screens and a compact file picker on smaller screens, with source previews (`prisma/schema.prisma`, `package.json`, API routes, and page components).
- **Vendor-Agnostic Source Code Export**: Exports a standard Next.js (App Router) project with Prisma ORM, PostgreSQL connection strings, Tailwind CSS styling, and PWA assets. No proprietary runtime lock-in.
- **ConfigFlow Platform Authentication & Security**:
  - JWT session tokens and bcrypt password hashing.
  - Email verification workflow with Nodemailer / Brevo API, token expiration, and resend recovery.
  - Google and GitHub OAuth 2.0 integration with automatic user profile sync.
- **Responsive Interface**:
  - Obsidian dark theme with glassmorphic accents and mobile-first responsiveness.
  - Mobile navigation drawer with backdrop dismissal, Escape-key closing, and body-scroll locking.
- **Real-Time Notification System**: Server-Sent Events (SSE) stream for instant event delivery and an in-app slide-out notification drawer.
- **Progressive Web App (PWA)**: Web App Manifest, Service Worker caching, and custom offline fallback page.

Generated projects support email/password registration and login with hashed passwords and HttpOnly session cookies. When app authentication is enabled, records are isolated by user only for entities marked `userScoped: true`; other entities are shared by authenticated users. Generated projects do not support OAuth, email verification, or password reset. Exporting a config with Google or GitHub enabled is rejected. With `auth.enabled: false` and no `userScoped` entities, export is supported only as a read-only app: every entity must set `publicAccess: true`, and the pages must not request write actions. A `userScoped` entity enables email/password authentication even when `auth.enabled` is false.

---

## How It Works

```
┌─────────────────────────────────┐
│     JSON Application Config     │
│  (Entities, Fields, UI, Auth)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     ConfigFlow Engine (API)     │
│   Validation & Schema Mapping   │
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ Live Dynamic │   │ Clean Next.js│
│   Preview    │   │  ZIP Export  │
└──────────────┘   └──────────────┘
```

1. **Define a Config**: Paste your JSON application configuration in `/builder`. Sample JSON configurations for Task Manager and Inventory Pro are available in [`configs/`](./configs/).
2. **Instant Live Preview**: Test your application immediately in the browser at `/builder/:appId`. Interact with live data tables, forms, and analytical dashboards backed by PostgreSQL.
3. **Inspect Code**: Switch to the **Code** tab to review the generated Prisma models, REST route handlers, and page components in the virtual file explorer.
4. **Download & Deploy**: Download a standard ZIP package and deploy it to a compatible Node.js host, such as Vercel, Render, Railway, Docker, or a Node.js server.

---

## Architecture & Monorepo Structure

ConfigFlow is organized as an npm workspace monorepo:

```text
ConfigFlow/
├── client/                     # Next.js 16 (App Router) Frontend
│   ├── src/
│   │   ├── app/                # App Router routes ((marketing), (auth), (app)/dashboard, builder)
│   │   ├── components/         # Renderers (Table, Form, Dashboard), Layouts, CodeViewer
│   │   └── lib/                # API client, AuthContext, ConfigContext, NotificationContext
│   └── public/                 # Static assets, PWA icons, Service Worker
├── server/                     # Express.js + TypeScript Backend
│   ├── prisma/                 # Prisma schema and email-verification SQL support script; no migrations directory is committed
│   ├── src/
│   │   ├── middleware/         # JWT authentication & request validation
│   │   ├── routes/             # Auth, Apps, Dynamic Entities, Notifications
│   │   └── services/           # Code Generator, Config Engine, Notification Bus
├── shared/                     # Shared TypeScript Types & Validators
│   └── src/                    # AppConfig interfaces, Zod schema validation
├── configs/                    # Sample JSON application configurations
├── scripts/                    # Feature and consistency verification test suite
├── docker-compose.yml          # Local container orchestration
└── package.json                # Monorepo workspaces configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: v20.9.0 or higher (required for Next.js 16)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: A local or cloud database such as [Neon](https://neon.tech) or [Supabase](https://supabase.com). CI currently verifies against PostgreSQL 16.

### Installation

Clone the repository and install all workspace dependencies:

```bash
git clone https://github.com/MohitGaur17/ConfigFlow.git
cd ConfigFlow
npm install
```

### Environment Setup

1. **Configure Server Environment**:
   Copy the example environment file in `server/`:

   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env` with your credentials:

   ```env
   # Database & Security
   DATABASE_URL="postgresql://postgres:password@localhost:5432/configflow?schema=public"
   JWT_SECRET="replace-with-a-secure-random-string-min-32-chars"
   PORT=4000
   CLIENT_URL="http://localhost:3000"
   SERVER_URL="http://localhost:4000"

   # OAuth - Google (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"

   # OAuth - GitHub (Optional)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   GITHUB_REDIRECT_URI="http://localhost:4000/api/auth/github/callback"

   # OAuth Client Return Target
   CLIENT_AUTH_CALLBACK_URL="http://localhost:3000/auth/callback"

   # Transactional Email / Verification (Optional for local testing)
   BREVO_API_KEY=""
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER=""
   SMTP_PASS=""
   SMTP_FROM="no-reply@configflow.ai"
   SMTP_SECURE=false
   EMAIL_FROM="no-reply@configflow.ai"
   ```

2. **Configure Client Environment**:
   Create `client/.env.local`:

   ```bash
   cp client/.env.example client/.env.local
   ```

   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

### Database Initialization

The checked-in database definition is `server/prisma/schema.prisma`; this repository does not include a Prisma migrations directory. Push the schema to your PostgreSQL database and generate the Prisma Client:

```bash
npm run prisma:push --workspace=server
npm run prisma:generate --workspace=server
```

*(Optional)* Seed sample data:

```bash
npm run seed --workspace=server
```

### Running Locally

Start both the backend server and client frontend concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **HTTP liveness check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Database readiness check**: [http://localhost:4000/api/ready](http://localhost:4000/api/ready)

---

## App Configuration Schema

Below is an annotated example of a valid ConfigFlow JSON configuration (`AppConfig`):

```json
{
  "app": {
    "name": "Project Tracker",
    "description": "Team project and task management dashboard",
    "version": "1.0.0",
    "theme": {
      "primaryColor": "#ff6b00",
      "mode": "dark"
    },
    "auth": {
      "enabled": true,
      "providers": {
        "email": true,
        "google": false,
        "github": false
      }
    }
  },
  "entities": {
    "projects": {
      "fields": {
        "title": { "type": "string", "required": true },
        "description": { "type": "string", "required": false },
        "status": { "type": "string", "required": true, "default": "Active" },
        "budget": { "type": "number", "required": false },
        "startDate": { "type": "date", "required": true }
      }
    },
    "tasks": {
      "fields": {
        "title": { "type": "string", "required": true },
        "priority": { "type": "string", "required": true, "default": "Medium" },
        "completed": { "type": "boolean", "required": false, "default": false },
        "dueDate": { "type": "date", "required": false }
      }
    }
  },
  "pages": [
    {
      "name": "Overview",
      "path": "/dashboard",
      "type": "dashboard",
      "widgets": [
        { "type": "stat", "title": "Active Projects", "entity": "projects" },
        { "type": "chart", "title": "Tasks by Priority", "entity": "tasks", "groupBy": "priority", "chartType": "bar" }
      ]
    },
    {
      "name": "Projects",
      "path": "/projects",
      "type": "table",
      "entity": "projects",
      "columns": ["title", "status", "budget", "startDate"]
    },
    {
      "name": "New Project",
      "path": "/projects/new",
      "type": "form",
      "entity": "projects",
      "fields": ["title", "description", "status", "budget", "startDate"],
      "submitAction": "create"
    }
  ]
}
```

Pre-made templates are available in the [`configs/`](./configs/) directory:
- `configs/task-manager.json`
- `configs/inventory.json`

#### Schema Guidelines & Defaults

- **Table Pages**: Specifying `columns` is optional. If omitted or empty, tables automatically fall back to rendering all fields declared in the target entity.
- **Dashboard Pages**: The `widgets` list is optional (defaults to `[]`). Widgets accept either `label` or `title` for descriptive text.
- **Authentication**: `auth.enabled` controls authentication requirements for preview entity operations. The platform runtime supports email/password and configured Google/GitHub OAuth; generated projects support email/password only. Generated exports reject configs that enable Google or GitHub. A `userScoped` entity also requires authentication; `publicAccess` cannot be combined with app authentication or user scoping.

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register an unverified account and attempt to send a verification email | No |
| `POST` | `/api/auth/login` | Sign in with email and password (returns JWT) | No |
| `GET` | `/api/auth/verify-email` | Confirm email verification token | No |
| `POST` | `/api/auth/resend-verification` | Resend verification email | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) |
| `GET` | `/api/auth/google/start` | Initiate Google OAuth 2.0 flow | No |
| `GET` | `/api/auth/google/callback`| Handle Google OAuth callback | No |
| `GET` | `/api/auth/github/start` | Initiate GitHub OAuth flow | No |
| `GET` | `/api/auth/github/callback`| Handle GitHub OAuth callback | No |

Email delivery requires a configured Brevo API key or SMTP credentials. Platform login rejects unverified accounts; generated-project email authentication does not include email verification.

### Apps & Generation (`/api/apps`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/apps` | Validate JSON config & initialize new project | Yes (Bearer) |
| `GET` | `/api/apps` | List all projects belonging to the user | Yes (Bearer) |
| `GET` | `/api/apps/:id` | Retrieve an application's JSON config & metadata | Yes (Bearer) |
| `PUT` | `/api/apps/:id` | Update an existing application's config | Yes (Bearer) |
| `DELETE`| `/api/apps/:id` | Delete an application and its preview data | Yes (Bearer) |
| `GET` | `/api/apps/:id/export` | Export and download full-stack codebase ZIP | Yes (Bearer) |
| `GET` | `/api/apps/:id/files` | Get generated virtual file tree and file contents | Yes (Bearer) |
| `GET` | `/api/apps/:id/auth/providers` | Query active OAuth providers for preview | Yes (Bearer) |

### Dynamic Entity Engine (`/api/entities`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/entities/:appId/:entityName` | Query records with pagination, sort, search | Conditional* |
| `POST` | `/api/entities/:appId/:entityName` | Create new entity record | Yes (Bearer) |
| `GET` | `/api/entities/:appId/:entityName/:id`| Retrieve single record by ID | Conditional* |
| `PUT` | `/api/entities/:appId/:entityName/:id`| Update single record by ID | Yes (Bearer) |
| `DELETE`| `/api/entities/:appId/:entityName/:id`| Delete single record by ID | Yes (Bearer) |
| `GET` | `/api/entities/:appId/:entityName/stats` | Aggregated record count & field statistics | Conditional* |
| `GET` | `/api/entities/:appId/:entityName/recent`| Fetch latest records for dashboard widgets | Conditional* |

All private entity operations require an authenticated user who owns the requested app. A non-owner receives `404 Not Found`. Authentication is required when the app specifies `auth.enabled: true` or the entity is `userScoped: true`. The only anonymous exception is `publicAccess: true` on a non-user-scoped entity in an app with authentication disabled; this allows GET requests only. All writes require an authenticated app owner. `userScoped: true` additionally filters records by the authenticated user across lists, reads, updates, deletes, recent records, and statistics.

Example public read policy:

```json
{
  "entities": {
    "announcements": {
      "publicAccess": true,
      "fields": { "title": { "type": "string", "required": true } }
    }
  }
}
```

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/notifications` | Fetch user notification history | Yes (Bearer) |
| `PATCH`| `/api/notifications/:id/read` | Mark individual notification as read | Yes (Bearer) |
| `POST` | `/api/notifications/read-all` | Mark all user notifications as read | Yes (Bearer) |
| `GET` | `/api/notifications/stream` | Real-time Server-Sent Events (SSE) notification stream | Yes (token) |

The notification stream accepts a Bearer token or a `token` query parameter for EventSource clients.

---

## Interactive Code Viewer & Export Pipeline

When you click **Download ZIP** or view code in the **Code Viewer**, the server's code generation engine (`server/src/services/code-generator.ts`) creates a Next.js App Router project scaffold containing:

1. **Prisma Configuration**: `prisma/schema.prisma` with entity models, UUID primary keys, user ownership relations for user-scoped entities, and a PostgreSQL datasource.
2. **REST API Handlers**: Next.js Route Handlers (`src/app/api/[entity]/route.ts` and `[id]/route.ts`) for list, create, read, update, and delete operations, with generated validation and authorization behavior based on the config.
3. **Interactive React Pages**: Next.js client pages (`src/app/(pages)/...`) leveraging Tailwind CSS, Lucide icons, and responsive layouts.
4. **PWA Files**: `manifest.ts`, service worker (`public/sw.js`), and registration hooks.
5. **Standard Tooling**: Fully configured `package.json`, `tsconfig.json`, `tailwind.config.ts`, and `.env.example`.

---

## Deployment Guides

### Docker Local Orchestration

You can spin up the full PostgreSQL, Express backend, and Next.js frontend stack with Docker Compose:

```bash
docker compose up --build
```

Compose starts PostgreSQL, then runs a one-shot `db-init` service that applies `server/prisma/schema.prisma` with `prisma db push`. The API starts only after that command succeeds, and its readiness check also verifies the database tables are available. This safely reuses the `postgres_data` volume; `docker compose down` keeps the data, while `docker compose down --volumes` deletes it.

This Compose setup is for local demos only. It uses local database credentials and defaults to a public demo JWT secret; never use those defaults in production. The server rejects missing, short, or local-demo JWT secrets when `NODE_ENV=production`. Production deployments must supply a unique, high-entropy `JWT_SECRET` of at least 32 characters from a secret manager. Generate one with `openssl rand -base64 48`.

`NEXT_PUBLIC_API_URL` is compiled into the browser frontend during the Docker image build. To use a different API address, set it in the shell or the Compose `.env` file and rebuild the client image, for example `NEXT_PUBLIC_API_URL=https://api.example.com docker compose up --build client`. Changing the container's runtime environment alone does not update the URL embedded in the frontend.

For production, set the server's `NODE_ENV=production` and provide a unique randomly generated `JWT_SECRET` of at least 32 characters through your deployment secret manager. The application exits before opening its HTTP port if the secret is missing, too short, or marked as a local-demo secret. Do not deploy this local-demo Compose configuration unchanged.

This repository does not yet contain a Prisma migrations directory. `prisma db push` is for local schema synchronization, not a production migration process; production database changes need reviewed migrations and a deployment migration job.

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:4000](http://localhost:4000)
- **PostgreSQL**: `localhost:5432`

### Cloud Deployment Guides

Deployment guides and checklists are included in the repository:

- [**DEPLOYMENT_QUICKSTART.md**](./DEPLOYMENT_QUICKSTART.md) — 5-minute setup with Vercel, Railway, and Neon.
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) — Deployment guide for a Vercel frontend and Railway or Render backend.
- [**CI_CD_DEPLOYMENT.md**](./CI_CD_DEPLOYMENT.md) — Guide to configuring deployment workflows with GitHub Actions.
- [**PRODUCTION_CHECKLIST.md**](./PRODUCTION_CHECKLIST.md) — Security audits, CORS configuration, and production hardening.

---

## Workspace Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Run server and client development servers concurrently |
| `npm run dev:server` | Start Express API backend with live-reload (`tsx watch`) |
| `npm run dev:client` | Start Next.js client with Turbopack |
| `npm run build` | Build `shared`, `server`, and `client` packages for production |
| `npm run prisma:generate --workspace=server` | Regenerate Prisma Client types |
| `npm run prisma:push --workspace=server` | Synchronize Prisma schema with database |
| `npm run prisma:migrate --workspace=server` | Create/apply a Prisma migration in development (`prisma migrate dev`) |
| `npm run verify:features` | Run static feature and configuration checks |
| `npm run verify:security` | Run database-backed authentication, app ownership, and entity isolation checks (requires `CONFIGFLOW_TEST_DATABASE_URL`) |
| `npm run verify:generation` | Install and build a generated project; database CRUD/API checks run only when `CONFIGFLOW_TEST_DATABASE_URL` is set |
| `npm run verify:docker-smoke` | Verify the Compose API health, database readiness, registration, and isolated test-data cleanup (requires a running Compose stack) |

---

## Contributing & License

Contributions, feedback, and issue reports are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to your branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.
