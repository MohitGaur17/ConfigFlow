# Quick Deployment Setup

## Fastest Way to Deploy (5 minutes)

### 1. Prepare Neon Database

```bash
# Copy your existing Neon connection string
# Format: postgresql://user:password@host/database?sslmode=require

# Test it works:
psql "postgresql://user:password@host/database?sslmode=require" -c "SELECT 1;"

# Run migrations (if not already done):
export DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
npm run prisma:push --workspace=server
```

### 2. Deploy Backend (Choose one)

#### Option A: Railway (1 click)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select `ConfigFlow` repository
4. Add these environment variables:
   - `DATABASE_URL`: Your Neon connection string
   - `PORT`: `4000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Will update after Vercel deploy (e.g., `https://your-app.vercel.app`)
   - `JWT_SECRET`: Generate secure key → `openssl rand -base64 32`
5. **Build Command**: `npm run build --workspace=server`
6. **Start Command**: `npm run start --workspace=server`
7. Deploy and note your URL (e.g., `https://configflow-api-prod.railway.app`)

#### Option B: Render.com

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub, select `ConfigFlow`
4. **Build Command**: `npm run build --workspace=server`
5. **Start Command**: `npm run start --workspace=server`
6. Add environment variables (same as Railway above)
7. Deploy and note your URL

### 3. Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. New Project → Import Git Repository
3. Select `ConfigFlow` repository
4. **Root Directory**: `client`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend URL from step 2 (e.g., `https://configflow-api-prod.railway.app`)
6. Deploy
7. Note your Vercel URL (e.g., `https://configflow.vercel.app`)

### 4. Update Backend CORS (Important!)

After Vercel deploys:

1. Go back to Railway/Render dashboard
2. Add environment variable:
   - `CLIENT_URL`: Your Vercel URL (e.g., `https://configflow.vercel.app`)
3. Redeploy backend

### 5. Test

```bash
# Test backend is running
curl https://your-backend-url/api/health

# Open frontend in browser
https://your-app.vercel.app

# Test login and API calls work
```

## Environment Variables Checklist

### Server (Railway/Render)
- [ ] `DATABASE_URL` - Neon connection string
- [ ] `JWT_SECRET` - Generated secure key (32+ chars)
- [ ] `PORT` - `4000`
- [ ] `NODE_ENV` - `production`
- [ ] `CLIENT_URL` - Your Vercel URL
- [ ] `GOOGLE_CLIENT_ID` - (Optional)
- [ ] `GOOGLE_CLIENT_SECRET` - (Optional)

### Client (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Your backend URL
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - (Optional)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" errors | Make sure Node.js 20.x is selected in Railway/Render |
| CORS errors (403) | Update `CLIENT_URL` in server with exact Vercel URL |
| Database connection timeout | Check DATABASE_URL is correct, Neon is accessible |
| API returns 502 | Backend crashed - check logs for errors |
| "JWT_SECRET is undefined" | Add JWT_SECRET to environment variables |

## Useful Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Check Neon connection
psql $DATABASE_URL -c "SELECT 1;"

# View production logs
# Railway: Dashboard → Deployments → Logs
# Render: Dashboard → Service → Logs

# Update environment variable
# Go to deployment dashboard and edit in Settings → Environment
```

## Next Steps

- [ ] Add custom domain (Vercel dashboard)
- [ ] Set up monitoring/alerts
- [ ] Configure automated backups for database
- [ ] Set up email notifications (SMTP)
- [ ] Enable OAuth for production
- [ ] Update privacy policy / terms of service

---

**Need more details?** See full [DEPLOYMENT.md](./DEPLOYMENT.md)

