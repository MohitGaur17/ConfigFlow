# Deployment Guide

Complete step-by-step guide for deploying ConfigFlow to production.

## Prerequisites

- Neon PostgreSQL account (or existing database)
- Vercel account (for frontend)
- Backend hosting account (Railway, Render, or similar)
- GitHub repository with CI/CD configured

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Vercel)                      │
│                   Next.js 16.2.4 App                        │
│              https://your-app.vercel.app                    │
└────────────────────┬────────────────────────────────────────┘
                     │ API Requests
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Railway/Render)                    │
│              Express.js + TypeScript                        │
│            https://api.your-domain.com                      │
└────────────────────┬────────────────────────────────────────┘
                     │ Database Queries
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Neon PostgreSQL                            │
│              Managed Database Service                       │
└─────────────────────────────────────────────────────────────┘
```

## 1. Database Setup (Neon)

### Create Production Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new database:
   - **Project**: Create or use existing
   - **Branch**: `production` or `main`
   - **Database name**: `configflow`
3. Copy the **Connection String**:
   ```
   postgresql://user:password@host/configflow
   ```

### Initialize Schema

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://user:password@host/configflow"

# Run migrations
npm run prisma:push --workspace=server

# Verify migrations applied
npm run prisma:generate --workspace=server
```

## 2. Backend Deployment (Railway or Render)

### Option A: Railway (Recommended)

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Create new project → Import from GitHub
   - Select `ConfigFlow` repository
   - Grant permissions

2. **Add Environment Variables**
   - In Railway Dashboard → Variables tab
   - Add from [Environment Variables](#environment-variables) section below

3. **Configure Build & Start**
   - **Build Command**: `npm run build --workspace=server`
   - **Start Command**: `npm run start --workspace=server`
   - **Root Directory**: `server`

4. **Deploy**
   - Connect PostgreSQL service (add Neon connection)
   - Deploy from main branch
   - Note the backend URL (e.g., `https://configflow-api.railway.app`)

### Option B: Render.com

1. **Create Web Service**
   - New → Web Service
   - Connect GitHub repository

2. **Configure**
   - **Build Command**: `npm run build --workspace=server`
   - **Start Command**: `npm run start --workspace=server`
   - **Root Directory**: `server`

3. **Environment Variables**
   - Add all variables from [Environment Variables](#environment-variables) section

4. **Database**
   - Add Neon PostgreSQL connection string

## 3. Frontend Deployment (Vercel)

### Deploy to Vercel

1. **Import Project**
   - Go to [Vercel](https://vercel.com)
   - New Project → Import Git Repository
   - Select `ConfigFlow` repository

2. **Configure Project**
   - **Framework**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build --workspace=client`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add to Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

4. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Note your Vercel URL (e.g., `https://configflow.vercel.app`)

### Update Backend CORS

After getting Vercel URL, update backend `server/src/index.ts`:

```typescript
const CLIENT_URL = process.env.CLIENT_URL || "https://configflow.vercel.app";

app.use(cors({
  origin: [CLIENT_URL, "http://localhost:3000"],
  credentials: true,
}));
```

Deploy updated backend with new `CLIENT_URL` environment variable.

## 4. Environment Variables

### Client (`client/.env.local` in Vercel)

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# OAuth (if using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Feature flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

### Server (`server/.env` or Vercel/Railway)

```env
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host/configflow

# CORS
CLIENT_URL=https://your-app.vercel.app

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (if sending notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/tmp/uploads
```

## 5. Domain Setup

### Custom Domain on Vercel

1. **Add Domain**
   - Vercel Dashboard → Settings → Domains
   - Enter your domain (e.g., `app.example.com`)
   - Update DNS records as instructed

2. **SSL Certificate**
   - Automatically provisioned by Vercel
   - HTTPS enabled by default

### Backend Domain (Optional)

If using Railway/Render:
- Use auto-assigned URL or
- Point subdomain (e.g., `api.example.com`) to backend service

## 6. Database Backups

### Neon Backups

1. Automatic daily backups (14-day retention)
2. Manual backup:
   ```bash
   pg_dump postgresql://user:password@host/configflow > backup.sql
   ```
3. Restore:
   ```bash
   psql postgresql://user:password@host/configflow < backup.sql
   ```

## 7. Monitoring & Logs

### Vercel Logs
- Dashboard → Deployments → View logs
- Real-time logs for frontend issues

### Backend Logs

**Railway**:
- Dashboard → Deployments → View Logs

**Render**:
- Dashboard → Service → Logs

### Database Logs

**Neon**:
- Console → Monitoring section
- Query performance insights

## 8. CI/CD Pipeline

Automatic deployment on push to `main`:

```yaml
# .github/workflows/ci.yml (already configured)
1. Run tests
2. Build server (npm run build --workspace=server)
3. Build client (npm run build --workspace=client)
4. Deploy to Vercel (automatic with GitHub integration)
5. Deploy backend (automatic with Railway/Render GitHub integration)
```

## 9. Post-Deployment Checklist

- [ ] Test frontend URL loads without errors
- [ ] Test API health endpoint: `GET /api/health`
- [ ] Test authentication flow
- [ ] Test database queries (create, read, update, delete)
- [ ] Verify environment variables are set
- [ ] Check CORS is working (no 403 errors)
- [ ] Test file uploads if applicable
- [ ] Monitor error logs
- [ ] Set up email notifications (if applicable)
- [ ] Configure monitoring/alerting

## 10. Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Neon console for active connections limit
```

### CORS Errors
- Ensure `CLIENT_URL` in server matches Vercel deployment URL
- Check `origin` in `cors()` middleware includes frontend domain

### Build Failures
- Check GitHub Actions logs for compilation errors
- Run local build: `npm run build --workspace=server`
- Verify all environment variables are set

### 404 API Errors
- Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Test API URL directly: `curl https://your-api-url/api/health`
- Verify backend is running and responsive

## 11. Scaling Considerations

- **Database**: Neon auto-scaling available
- **Backend**: Railway/Render horizontal scaling
- **Frontend**: Vercel automatic scaling
- **CDN**: Vercel Edge Network (automatic)

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs

