# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment (1-2 hours)

### Code & Security
- [ ] All code reviewed and merged to `main`
- [ ] No console.log() statements in production code
- [ ] No hardcoded secrets or API keys
- [ ] API rate limiting implemented
- [ ] CORS properly configured
- [ ] SQL injection prevention reviewed
- [ ] Password hashing working (bcrypt)
- [ ] JWT validation on all protected routes

### Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing of auth flow
- [ ] Manual testing of main features
- [ ] Mobile browser testing (responsive design)
- [ ] Error handling tested (API returns proper error codes)

### Database
- [ ] Database backups configured
- [ ] Migrations tested on staging database
- [ ] Data seed scripts working
- [ ] Database indexes created for performance
- [ ] Connection pool size optimized

### Environment Variables
- [ ] All required `.env` variables documented
- [ ] Production values different from dev (especially secrets)
- [ ] `JWT_SECRET` is cryptographically secure (32+ random chars)
- [ ] `DATABASE_URL` points to production database
- [ ] `CLIENT_URL` points to production frontend domain
- [ ] `NODE_ENV=production`
- [ ] OAuth credentials updated for production

### Frontend
- [ ] Build succeeds locally: `npm run build --workspace=client`
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] PWA manifest configured correctly
- [ ] Service Worker caching strategy working
- [ ] Images optimized (Next.js Image component used)
- [ ] Fonts loaded efficiently
- [ ] Analytics tracking configured (if applicable)

### Backend
- [ ] Build succeeds locally: `npm run build --workspace=server`
- [ ] No TypeScript errors
- [ ] API health check endpoint working
- [ ] Graceful error handling
- [ ] Request/response logging configured
- [ ] CORS headers correct
- [ ] Rate limiting enabled
- [ ] File upload validation and limits set

### DevOps
- [ ] Deployment platform selected (Railway/Render/AWS/etc)
- [ ] Environment variables created in deployment platform
- [ ] Database connection string verified
- [ ] Firewall/security groups configured
- [ ] Health checks configured
- [ ] Auto-restart/recovery enabled
- [ ] Monitoring/alerting set up
- [ ] Error tracking (Sentry/LogRocket) configured

## Deployment (30 minutes)

### Pre-Flight Checks
- [ ] Database backups taken
- [ ] Notification sent to team
- [ ] Deployment window agreed with stakeholders
- [ ] Rollback plan documented

### Backend Deployment
- [ ] Push code to `main` branch
- [ ] Verify CI/CD pipeline passes in GitHub Actions
- [ ] Approve deployment in Railway/Render dashboard
- [ ] Verify backend health check: `GET /api/health`
- [ ] Check error logs for any issues
- [ ] Test API endpoints from Postman/curl
- [ ] Note backend URL

### Frontend Deployment
- [ ] Add backend URL to Vercel environment variables
- [ ] Approve deployment in Vercel dashboard
- [ ] Verify build completes successfully
- [ ] Check frontend loads in browser
- [ ] Test API calls work (no CORS errors)
- [ ] Note frontend URL

### Database
- [ ] Run migrations if needed
- [ ] Verify data integrity
- [ ] Check query performance
- [ ] Monitor connection pool usage

## Post-Deployment (1 hour)

### Monitoring
- [ ] Monitor error logs (first 30 minutes)
- [ ] Check API response times
- [ ] Verify database connections stable
- [ ] Monitor CPU/memory usage
- [ ] Check frontend performance (Lighthouse)

### User Acceptance Testing
- [ ] Test registration and login
- [ ] Test OAuth login (Google/GitHub)
- [ ] Test main user flows
- [ ] Test on mobile browser
- [ ] Test file uploads (if applicable)
- [ ] Test email notifications (if applicable)
- [ ] Verify app persists data correctly

### Alerts & Monitoring
- [ ] Error rate normal (<1%)
- [ ] Response times normal
- [ ] Database queries optimized
- [ ] No critical errors in logs

## Post-Launch (Next 24-48 hours)

- [ ] Monitor error logs daily
- [ ] Review user feedback
- [ ] Check analytics/usage metrics
- [ ] Prepare hotfix if critical issues found
- [ ] Update status page
- [ ] Notify users of new deployment

## Rollback Plan

If critical issues found:

```bash
# Get previous stable version
git log --oneline | head -5

# Revert to previous commit
git revert <commit-hash>
git push origin main

# Redeploy in Railway/Render (should auto-trigger CI)
# Or manually trigger in dashboard
```

Estimated rollback time: **5-10 minutes**

## Communication

### Before Deployment
```
Subject: Scheduled Deployment Tonight
Scheduled for: [TIME] [TIMEZONE]
Expected duration: 15-30 minutes
Expected downtime: None (blue-green deployment)
```

### During Deployment
```
Subject: Deployment in Progress
Status: Deploying backend... → Deploying frontend... → Testing
```

### After Deployment
```
Subject: Deployment Complete
Version: v1.x.x
What's new: [Feature list]
Status: All systems operational
```

## Troubleshooting During Deployment

| Issue | Quick Fix |
|-------|-----------|
| Backend won't start | Check logs for missing env vars, database connection |
| CORS errors | Update CLIENT_URL in backend to match Vercel domain |
| Database connection timeout | Verify DATABASE_URL is correct, check Neon connection |
| 502 Bad Gateway | Backend crashed - check error logs |
| Slow API response | Check database query performance, add indexes |
| High memory usage | May need to increase container memory |

---

**Questions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides.

