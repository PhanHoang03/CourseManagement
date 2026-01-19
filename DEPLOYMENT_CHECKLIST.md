# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### Code Preparation
- [ ] All code is committed and pushed to Git repository
- [ ] All environment variables are documented in `.env.example` files
- [ ] No hardcoded API URLs or secrets in code
- [ ] Database migrations are up to date
- [ ] All dependencies are listed in `package.json`
- [ ] Build scripts are configured correctly
- [ ] TypeScript compilation passes without errors

### Testing
- [ ] Application works locally
- [ ] All API endpoints tested
- [ ] Database connections working
- [ ] File uploads working (if applicable)
- [ ] Authentication/authorization working

---

## Database Deployment

### Render PostgreSQL
- [ ] Created PostgreSQL database on Render
- [ ] Copied database connection string
- [ ] Database is accessible
- [ ] Tested connection locally with production URL

### Alternative: External Database
- [ ] Database service account created (Supabase/Neon/etc.)
- [ ] Connection string obtained
- [ ] Database accessible from external IPs (if needed)

---

## Backend Deployment (Render)

### Repository Setup
- [ ] GitHub repository connected to Render
- [ ] Correct branch selected (usually `main` or `master`)
- [ ] Root directory set to `Backend` (if applicable)

### Build Configuration
- [ ] Build command: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
- [ ] Start command: `npm run start`
- [ ] Node version specified (if needed)

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (from PostgreSQL service)
- [ ] `JWT_SECRET` (strong random string generated)
- [ ] `JWT_REFRESH_SECRET` (strong random string generated)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `JWT_REFRESH_EXPIRES_IN=30d`
- [ ] `PORT=5000`
- [ ] `FRONTEND_URL` (will update after frontend deployment)

### Deployment
- [ ] Service deployed successfully
- [ ] Build logs show no errors
- [ ] Service is running (not sleeping)
- [ ] Health endpoint accessible: `https://your-api.onrender.com/health`
- [ ] API endpoints accessible: `https://your-api.onrender.com/api/v1/courses`

### Post-Deployment
- [ ] Database migrations run successfully
- [ ] Prisma client generated
- [ ] Logs show no errors
- [ ] API responds correctly

---

## Frontend Deployment (Vercel)

### Repository Setup
- [ ] GitHub repository connected to Vercel
- [ ] Correct branch selected
- [ ] Root directory set to `Frontend` (if applicable)

### Build Configuration
- [ ] Framework: Next.js (auto-detected)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` set to backend URL: `https://your-api.onrender.com/api/v1`

### Deployment
- [ ] Project deployed successfully
- [ ] Build completed without errors
- [ ] Frontend URL obtained: `https://your-project.vercel.app`
- [ ] Frontend loads correctly

### Post-Deployment
- [ ] Frontend can communicate with backend
- [ ] No CORS errors in browser console
- [ ] Authentication flow works
- [ ] All pages load correctly
- [ ] API calls succeed

---

## Backend CORS Update

- [ ] Updated `FRONTEND_URL` in Render environment variables
- [ ] Backend service restarted
- [ ] CORS errors resolved
- [ ] API calls from frontend work

---

## File Storage (If Applicable)

### Cloudinary Setup
- [ ] Cloudinary account created
- [ ] Cloud name obtained
- [ ] API key obtained
- [ ] API secret obtained
- [ ] Environment variables added to backend:
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
- [ ] File upload code updated to use Cloudinary
- [ ] File uploads tested

### Alternative: AWS S3
- [ ] S3 bucket created
- [ ] IAM user created with S3 access
- [ ] Access keys obtained
- [ ] Environment variables configured
- [ ] File upload code updated

---

## Security

- [ ] JWT secrets are strong and unique
- [ ] No secrets committed to Git
- [ ] Environment variables properly secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)
- [ ] HTTPS enabled (automatic on Vercel/Render)

---

## Testing After Deployment

### Backend Tests
- [ ] Health check: `GET /health`
- [ ] API endpoints: `GET /api/v1/courses`
- [ ] Authentication: `POST /api/v1/auth/login`
- [ ] Database queries working
- [ ] File uploads working (if applicable)

### Frontend Tests
- [ ] Home page loads
- [ ] Login page works
- [ ] Dashboard loads
- [ ] API calls succeed
- [ ] No console errors
- [ ] No CORS errors
- [ ] File uploads work (if applicable)

### Integration Tests
- [ ] User can log in
- [ ] User can access protected routes
- [ ] User can create/view courses
- [ ] User can enroll in courses
- [ ] User can complete assessments
- [ ] Progress tracking works

---

## Monitoring & Maintenance

- [ ] Monitoring set up (Render/Vercel built-in)
- [ ] Error tracking configured (optional: Sentry)
- [ ] Logs accessible
- [ ] Database backups configured
- [ ] Uptime monitoring (optional)

---

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Troubleshooting guide created
- [ ] Team members have access to deployment platforms

---

## Final Verification

- [ ] Application is fully functional
- [ ] All features working as expected
- [ ] Performance is acceptable
- [ ] No critical errors in logs
- [ ] Users can access and use the application
- [ ] Custom domains configured (if applicable)

---

## Notes

- **Render Free Tier**: Services may sleep after inactivity. First request after sleep may be slow.
- **Database**: Free tier PostgreSQL on Render has 90-day retention and may sleep.
- **File Storage**: Render free tier has ephemeral filesystem. Use cloud storage for production.
- **CORS**: Always update `FRONTEND_URL` in backend after frontend deployment.

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Backend URL**: _______________
**Frontend URL**: _______________
**Database**: _______________
