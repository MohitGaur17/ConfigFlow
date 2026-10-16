# ConfigFlow

> **Declarative JSON-Driven Full-Stack App Generator & Live Preview Studio**

ConfigFlow turns declarative JSON architecture specifications into fully functional, production-ready web applications. Define your data models, fields, relations, pages, and auth settings in a single JSON schema, preview the app interactively in your browser with dynamic CRUD engines, and export a clean, standard full-stack **Next.js (App Router) + Prisma + PostgreSQL + Tailwind CSS** codebase in a single click.

[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)

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

- **Declarative Schema Compiler**: Define complete apps (entities, fields, relations, UI pages, and auth providers) using standard, validated JSON schemas with zero imperative boilerplate.
- **In-Browser Dynamic Runtime**:
  - **Table Views**: Search, pagination, column sorting, and custom action buttons.
  - **Forms**: Dynamic validation, data type rendering (text, numbers, booleans, dates), and creation/edit modes.
  - **Dashboards**: Configurable metric cards, recharts visualizations (bar, line, pie), and recent activity lists.
  - **Detail Views**: Scoped record inspection and relation navigation.
- **Interactive Code Viewer**: Browse the generated codebase in-browser before exporting, featuring an interactive file tree and source previews (`prisma/schema.prisma`, `package.json`, API routes, and page components).
- **Vendor-Agnostic Source Code Export**: Exports a standard Next.js (App Router) project with Prisma ORM, PostgreSQL connection strings, Tailwind CSS styling, and PWA assets. No proprietary runtime lock-in.
- **Complete Authentication & Security**:
  - JWT session tokens and bcrypt password hashing.
  - Email verification workflow with Nodemailer / Brevo API, token expiration, and resend recovery.
  - Google and GitHub OAuth 2.0 integration with automatic user profile sync.
- **Responsive & Accessible Design**:
  - Obsidian dark theme with glassmorphic accents and mobile-first responsiveness.
  - Touch-friendly mobile navigation drawer with backdrop light-dismiss, keyboard navigation (<kbd>Esc</kbd>), and body-scroll locking.
- **Real-Time Notification System**: Server-Sent Events (SSE) stream for instant event delivery and an in-app slide-out notification drawer.
- **Progressive Web App (PWA)**: Web App Manifest, Service Worker caching, and custom offline fallback page.

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

1. **Create or Upload**: Select a pre-built starter template (e.g. Project Tracker or Inventory Manager) or paste your custom JSON architecture schema in `/builder`.
2. **Instant Live Preview**: Test your application immediately in the browser at `/builder/:appId`. Interact with live data tables, forms, and analytical dashboards backed by PostgreSQL.
3. **Inspect Code**: Switch to the **Code** tab to review the generated Prisma models, REST route handlers, and page components in the virtual file explorer.
4. **Download & Deploy**: Download a standard ZIP package and deploy it anywhere (Vercel, Render, Railway, Docker, or bare metal).

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
│   ├── prisma/                 # Prisma schema & migrations
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

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher (local instance or cloud like [Neon](https://neon.tech) / [Supabase](https://supabase.com))

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

Push the Prisma schema to your PostgreSQL database and generate the Prisma Client:

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
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

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
      "darkMode": true
    },
    "auth": {
      "enabled": true,
      "providers": {
        "email": true,
        "google": true,
        "github": true
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
        { "type": "chart", "title": "Tasks by Priority", "entity": "tasks", "chartType": "bar" }
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
- **Authentication**: `auth.enabled` toggles application authentication requirements. Custom OAuth providers and settings can be configured via environment variables.

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register user account & send verification email | No |
| `POST` | `/api/auth/login` | Sign in with email and password (returns JWT) | No |
| `GET` | `/api/auth/verify-email` | Confirm email verification token | No |
| `POST` | `/api/auth/resend-verification` | Resend verification email | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) |
| `GET` | `/api/auth/google/start` | Initiate Google OAuth 2.0 flow | No |
| `GET` | `/api/auth/google/callback`| Handle Google OAuth callback | No |
| `GET` | `/api/auth/github/start` | Initiate GitHub OAuth flow | No |
| `GET` | `/api/auth/github/callback`| Handle GitHub OAuth callback | No |

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
| `GET` | `/api/entities/:appId/:entityName` | Query records with pagination, sort, search | Yes (Bearer) |
| `POST` | `/api/entities/:appId/:entityName` | Create new entity record | Yes (Bearer) |
| `GET` | `/api/entities/:appId/:entityName/:id`| Retrieve single record by ID | Yes (Bearer) |
| `PUT` | `/api/entities/:appId/:entityName/:id`| Update single record by ID | Yes (Bearer) |
| `DELETE`| `/api/entities/:appId/:entityName/:id`| Delete single record by ID | Yes (Bearer) |
| `GET` | `/api/entities/:appId/:entityName/stats` | Aggregated record count & field statistics | Yes (Bearer) |
| `GET` | `/api/entities/:appId/:entityName/recent`| Fetch latest records for dashboard widgets | Yes (Bearer) |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/notifications` | Fetch user notification history | Yes (Bearer) |
| `PATCH`| `/api/notifications/:id/read` | Mark individual notification as read | Yes (Bearer) |
| `POST` | `/api/notifications/read-all` | Mark all user notifications as read | Yes (Bearer) |
| `GET` | `/api/notifications/stream` | Real-time Server-Sent Events (SSE) notification stream | Yes (Bearer) |

---

## Interactive Code Viewer & Export Pipeline

When you click **Download ZIP** or view code in the **Code Viewer**, the server's code generation engine (`server/src/services/code-generator.ts`) synthesizes a turnkey Next.js App Router project containing:

1. **Prisma Configuration**: `prisma/schema.prisma` with models, relations, CUID primary keys, and PostgreSQL datasource.
2. **REST API Handlers**: Type-safe Next.js Route Handlers (`src/app/api/[entity]/route.ts` and `[id]/route.ts`) implementing complete CRUD endpoints.
3. **Interactive React Pages**: Next.js client pages (`src/app/(pages)/...`) leveraging Tailwind CSS, Lucide icons, and responsive layouts.
4. **PWA Integration**: Ready-to-deploy `manifest.ts`, service worker (`public/sw.js`), and registration hooks.
5. **Standard Tooling**: Fully configured `package.json`, `tsconfig.json`, `tailwind.config.ts`, and `.env.example`.

---

## Deployment Guides

### Docker Local Orchestration

You can spin up the full PostgreSQL, Express backend, and Next.js frontend stack with Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:4000](http://localhost:4000)
- **PostgreSQL**: `localhost:5432`

### Cloud Deployment Guides

Detailed production deployment runbooks and checklists are included in the repository:

- [**DEPLOYMENT_QUICKSTART.md**](./DEPLOYMENT_QUICKSTART.md) — 5-minute setup with Vercel, Railway, and Neon.
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) — Complete manual deployment across AWS, Render, Vercel, and DigitalOcean.
- [**CI_CD_DEPLOYMENT.md**](./CI_CD_DEPLOYMENT.md) — Automated CI/CD pipelines with GitHub Actions.
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
| `npm run prisma:migrate --workspace=server` | Run Prisma database migrations |

---

## Contributing & License

Contributions, feedback, and issue reports are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to your branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Distributed under the **MIT License**. See `LICENSE` for more information.
