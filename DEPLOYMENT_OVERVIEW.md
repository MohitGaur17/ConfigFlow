# ConfigFlow Deployment Guide - Complete Overview

## 📋 Available Documentation

Choose the deployment guide that matches your needs:

| Guide | Purpose | Read Time |
|-------|---------|-----------|
| [**DEPLOYMENT_QUICKSTART.md**](./DEPLOYMENT_QUICKSTART.md) | **Start here!** Fastest way to deploy in 5 minutes | 5 min |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Complete guide for all deployment scenarios | 20 min |
| [**CI_CD_DEPLOYMENT.md**](./CI_CD_DEPLOYMENT.md) | GitHub Actions + Automated deployments | 10 min |
| [**PRODUCTION_CHECKLIST.md**](./PRODUCTION_CHECKLIST.md) | Pre-deployment safety checklist | 15 min |

## 🚀 Quick Start (5 minutes)

### For Impatient Developers

```bash
# 1. Get Neon connection string (you already have this)
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# 2. Go to https://railway.app → New Project → Deploy from GitHub
#    - Select ConfigFlow repo
#    - Add environment variables (DATABASE_URL, JWT_SECRET, etc.)
#    - Build: npm run build --workspace=server
#    - Start: npm run start --workspace=server

# 3. Go to https://vercel.com → Import → Select ConfigFlow
#    - Root: client
#    - Add NEXT_PUBLIC_API_URL = your Railway URL

# 4. Update Railway's CLIENT_URL with your Vercel URL and redeploy

# Done! ✨
```

## 🏗️ Architecture

```
Your Domain
    ↓
[Vercel - Frontend]  ←→  [Railway/Render - Backend]  ←→  [Neon - Database]
  https://app.*      API calls    https://api.*     DB connection  postgres://
   Next.js App       (CORS)        Express Server     (psql)         PostgreSQL
```

## 📚 Deployment Options

### Recommended (Easiest)
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Neon (already in use)
- **CI/CD**: GitHub Actions (auto-deploy on push)

### Alternatives
- **Frontend**: Netlify, AWS Amplify, GitHub Pages
- **Backend**: Render, Fly.io, Heroku, AWS App Runner, Google Cloud Run
- **Database**: AWS RDS, Azure Database, Heroku Postgres, Supabase

## 🔑 Key Concepts

### Environment Variables

Production needs these (different from development):

```
Backend:
  DATABASE_URL          = Your Neon PostgreSQL URL
  JWT_SECRET            = Secure random string (32+ chars)
  CLIENT_URL            = Your Vercel app URL (for CORS)
  NODE_ENV              = "production"
  GOOGLE_CLIENT_ID      = (optional) OAuth
  GOOGLE_CLIENT_SECRET  = (optional) OAuth

Frontend:
  NEXT_PUBLIC_API_URL   = Your backend API URL
  NEXT_PUBLIC_*         = Any public config (visible to browser)
```

### Database Migrations

Your Neon database needs schema initialized:

```bash
# Run once when setting up production database
npm run prisma:push --workspace=server
```

## 📋 Step-by-Step Overview

### Phase 1: Prepare (30 min)

- [ ] Set up Neon production database
- [ ] Generate secure JWT_SECRET
- [ ] Document all required environment variables
- [ ] Review code for hardcoded secrets

### Phase 2: Deploy Backend (15 min)

- [ ] Create Railway/Render account
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy and verify health check

### Phase 3: Deploy Frontend (10 min)

- [ ] Create Vercel account (can use GitHub login)
- [ ] Import GitHub repository
- [ ] Set NEXT_PUBLIC_API_URL
- [ ] Deploy and test

### Phase 4: Connect & Test (10 min)

- [ ] Update backend CLIENT_URL with Vercel domain
- [ ] Redeploy backend
- [ ] Test full workflow (login → create app → export code)
- [ ] Verify error logs are clean

## 🔒 Security Checklist

Before going live:

- [ ] No console.logs in production
- [ ] No hardcoded secrets in code
- [ ] CORS origin matches deployed frontend
- [ ] JWT_SECRET is cryptographically secure
- [ ] Database password is strong
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] API rate limiting enabled
- [ ] Error messages don't expose internals

## 🆘 Getting Help

### Common Issues

**CORS errors?**
```
Error: Access to XMLHttpRequest blocked by CORS policy

Fix: Update CLIENT_URL in backend to match your Vercel domain exactly
```

**API calls return 502?**
```
Error: Bad Gateway

Fix: Backend crashed - check logs in Railway/Render dashboard
```

**Database connection timeout?**
```
Error: timeout expired

Fix: Verify DATABASE_URL is correct, check Neon connection is active
```

**Build fails on deploy?**
```
Error: Could not find module

Fix: Missing environment variable or Node.js version mismatch
```

### Where to Find Help

- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- Neon docs: https://neon.tech/docs
- Stack Overflow: Tag with [deployment], [vercel], [railway], [postgresql]

## 📞 Support Channels

1. **For Vercel issues**: https://vercel.com/support
2. **For Railway issues**: https://railway.app/support
3. **For Neon issues**: https://neon.tech/docs/community
4. **For code issues**: GitHub Issues in your repo

## 🎯 Next Steps

1. **Immediately**: Read [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
2. **Then**: Follow the 5-minute deployment steps
3. **Finally**: Use [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) before launching

---

**Ready to deploy?** Start with [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) →

