# GitHub Actions Deployment Setup

This guide helps you set up automatic deployments via GitHub Actions.

## 1. Create GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Click **New repository secret** for each variable:

### For Railway Deployment

```
RAILWAY_TOKEN          → Get from https://railway.app/account/tokens
RAILWAY_PROJECT_ID    → From Railway dashboard project URL
```

### For Render Deployment

```
RENDER_API_KEY        → Get from https://dashboard.render.com/account/api-keys
RENDER_SERVICE_ID     → From Render service dashboard
```

### For Vercel Deployment

```
VERCEL_TOKEN          → Get from https://vercel.com/account/tokens
VERCEL_PROJECT_ID     → From Vercel project settings
VERCEL_ORG_ID         → From Vercel account settings
```

### Environment Variables

```
DATABASE_URL          → Your Neon PostgreSQL connection string
JWT_SECRET            → Generated secure key (openssl rand -base64 32)
CLIENT_URL            → Your deployed frontend URL (e.g., https://app.vercel.app)
GOOGLE_CLIENT_ID      → (Optional) Your Google OAuth ID
GOOGLE_CLIENT_SECRET  → (Optional) Your Google OAuth secret
```

## 2. Create Deployment Workflows

### Option A: Railway Auto-Deploy

Create `.github/workflows/deploy-railway.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Backend to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up -d server --token $RAILWAY_TOKEN
```

### Option B: Render Auto-Deploy

Create `.github/workflows/deploy-render.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Backend to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl https://api.render.com/deploy/$RENDER_SERVICE_ID?key=$RENDER_API_KEY -X POST
```

### Option C: Vercel Auto-Deploy

Vercel auto-deploys when connected to GitHub - no extra config needed!

## 3. Enable CI/CD Integration

### Railway
1. Go to Railway dashboard
2. Settings → Tokens
3. Create API token
4. Add to GitHub Secrets as `RAILWAY_TOKEN`

### Render
1. Go to Render dashboard
2. Account → API Keys
3. Create key
4. Add to GitHub Secrets as `RENDER_API_KEY`

### Vercel
1. Connect repository in Vercel dashboard
2. Automatic deployments enabled by default
3. Add environment variables in Vercel project settings

## 4. Manual Deployment

If you prefer manual deployments:

### Railway CLI
```bash
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Render CLI
```bash
# No CLI needed - use dashboard or API

# Trigger deploy via API
curl https://api.render.com/deploy/YOUR_SERVICE_ID?key=YOUR_KEY -X POST
```

## 5. Verify Deployments

After each push to `main`:

1. Check GitHub Actions tab for workflow status
2. Verify backend URL responds: `curl https://your-api.railway.app/api/health`
3. Check Vercel deployment in dashboard
4. Test frontend app loads without errors

## 6. Troubleshooting CI/CD

### Build Fails
- Check logs in GitHub Actions tab
- Verify environment variables are set
- Ensure Node.js 20.x is selected

### Deployment Hangs
- Check Railway/Render logs for errors
- May need to increase deployment timeout
- Contact support if service is slow

### Environment Variables Not Applied
- Changes take 2-5 minutes to propagate
- Force redeploy after updating secrets
- Verify in deployment logs that vars are read

## 7. Production Checklist

Before going live:

- [ ] Database migrations applied
- [ ] All environment variables set in deployment platform
- [ ] Backend URL updated in Vercel
- [ ] CORS origin updated to Vercel URL
- [ ] JWT_SECRET is secure (32+ random chars)
- [ ] Testing done on deployed version
- [ ] Monitoring/alerting configured
- [ ] Backups enabled for database

---

**Reference**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide

