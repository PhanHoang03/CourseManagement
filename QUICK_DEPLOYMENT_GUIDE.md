# Quick Deployment Guide

A condensed version of the deployment plan for quick reference.

## TL;DR - Yes, You Need to Deploy the Database

**Answer**: Yes, you need to deploy the database. PostgreSQL is required and can be deployed on:
- Render (recommended for simplicity)
- Supabase (free tier available)
- Neon (free tier available)
- Railway (free tier available)

---

## Quick Steps

### 1. Database (5 minutes)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Fill in name, select free plan
4. Copy the **Internal Database URL**

### 2. Backend on Render (10 minutes)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm run start`
5. Add environment variables:
   ```
   DATABASE_URL=<from step 1>
   JWT_SECRET=<generate random string>
   JWT_REFRESH_SECRET=<generate random string>
   FRONTEND_URL=<will update after step 3>
   ```
6. Deploy

### 3. Frontend on Vercel (5 minutes)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Configure:
   - **Root Directory**: `Frontend`
5. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
   ```
6. Deploy

### 4. Update Backend CORS (2 minutes)
1. Go back to Render → Your backend service
2. Update `FRONTEND_URL` to your Vercel URL
3. Restart service

---

## Generate JWT Secrets

Run this command to generate secure random strings:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it twice to get two different secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Required Environment Variables

### Backend (Render)
```
DATABASE_URL=postgresql://...
JWT_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
```

---

## Important Notes

1. **File Uploads**: Render free tier has ephemeral storage. Use Cloudinary or S3 for production.
2. **Database Sleep**: Free tier PostgreSQL may sleep after inactivity. First request may be slow.
3. **CORS**: Always update `FRONTEND_URL` in backend after frontend deployment.
4. **Migrations**: Run `npx prisma migrate deploy` after first deployment (or include in build command).

---

## Cost

- **Free Tier**: $0/month (with limitations)
- **Production**: ~$14-34/month (Render Starter + PostgreSQL Starter)

---

## Need Help?

See `DEPLOYMENT_PLAN.md` for detailed instructions and troubleshooting.
