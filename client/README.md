# ConfigFlow Client

Next.js frontend for ConfigFlow.
It provides authentication pages, dashboard, config submission flow, and dynamic app preview rendering.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS

## Environment

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Local Development

Install from repo root:

```bash
npm install
```

Run client from repo root:

```bash
npm run dev:client
```

Or run in this workspace:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/` - landing and app config submission
- `/login` - login
- `/register` - registration
- `/dashboard` - user apps and actions
- `/builder/[appId]` - app preview shell
- `/builder/[appId]/[[...slug]]` - dynamic page rendering

## Build

From repo root:

```bash
npm run build --workspace=client
```

Or in this folder:

```bash
npm run build
```

## Notes

- Favicon and brand icon are served from `public/favicon.svg`.
- Dynamic rendering components are in `src/components/renderers`.
- i18n implementation is documented in `src/i18n/README.md`.
