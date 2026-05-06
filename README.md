# AI App Generator

A **config-driven full-stack runtime** that reads JSON configuration and dynamically generates forms, tables, dashboards, REST APIs, and database structures.

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Recharts
- **Backend**: Express.js + TypeScript + JWT Auth
- **Database**: PostgreSQL + Prisma ORM (JSONB for dynamic entities)
- **Deployment**: Vercel (frontend) + Railway (backend) + Neon (PostgreSQL)

## ✨ Features

### Core System
- **Dynamic UI Rendering** — Forms, tables, dashboards generated from JSON config
- **Dynamic API Generation** — CRUD endpoints auto-created for any entity
- **Component Registry** — Extensible pattern for adding new page types
- **Config Hot-Swap** — Switch between configs without restart

### 3 Mandatory Features
1. **JWT Authentication** — Register/login, user-scoped data access
2. **CSV Import** — Upload → column mapping UI → validation → batch insert
3. **Responsive UI** — Mobile-first design, collapsible sidebar, horizontal-scroll tables

### Edge Case Handling
- Missing/unknown fields → graceful fallbacks
- Unknown page types → fallback renderer with warning
- Invalid data → field-level validation errors
- Empty states → helpful CTAs
- Schema mismatches → renders available fields

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up database (update server/.env with your PostgreSQL URL)
cd server && npx prisma db push

# Start both servers
npm run dev
```

## 📁 Project Structure

```
├── client/          # Next.js frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types & validators
└── configs/         # Sample JSON configs (Task Manager, Inventory)
```

## 🔧 Sample Configs

The system ships with two sample configs to prove it's truly config-driven:

1. **Task Manager** — 2 entities (tasks, projects), dashboard with charts, CRUD tables
2. **Inventory Pro** — 3 entities with relations (products, suppliers, orders)

You can upload any valid JSON config via the Config Manager page.
