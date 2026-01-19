# Deployment Plan: Frontend (Vercel) + Backend (Render) + Database

## Overview
This document provides a step-by-step guide to deploy:
- **Frontend**: Next.js application on Vercel
- **Backend**: Node.js/Express API on Render
- **Database**: PostgreSQL database (required - can be on Render or external service)

---

## Prerequisites

1. **GitHub Account** (or GitLab/Bitbucket)
   - Your code should be in a Git repository
   - Both Vercel and Render can connect to GitHub

2. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Free tier available

3. **Render Account**
   - Sign up at [render.com](https://render.com)
   - Free tier available (with limitations)

4. **PostgreSQL Database**
   - **YES, you need to deploy the database**
   - Options:
     - **Render PostgreSQL** (recommended for simplicity)
     - **Supabase** (free tier available)
     - **Neon** (free tier available)
     - **Railway** (free tier available)
     - **AWS RDS** (paid, production-ready)

---

## Part 1: Database Deployment

### Option A: Render PostgreSQL (Recommended)

1. **Create PostgreSQL Database on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"
   - Fill in:
     - **Name**: `course-management-db` (or your preferred name)
     - **Database**: `course_management` (or your preferred name)
     - **User**: Auto-generated (or custom)
     - **Region**: Choose closest to your users
     - **PostgreSQL Version**: Latest stable (15 or 16)
     - **Plan**: Free (for development) or Starter ($7/month for production)
   - Click "Create Database"

2. **Get Connection String**
   - After creation, Render will show:
     - **Internal Database URL**: For backend on Render (use this)
     - **External Database URL**: For local development
   - Copy the **Internal Database URL** (format: `postgresql://user:password@host:port/database`)

3. **Note**: Free tier PostgreSQL on Render:
   - Database sleeps after 90 days of inactivity
   - 90 days data retention
   - Limited to 1GB storage
   - For production, consider paid plans or external services

### Option B: Supabase (Alternative)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection string from Settings → Database → Connection String
4. Use the "URI" format

---

## Part 2: Backend Deployment on Render

### Step 1: Prepare Backend for Production

1. **Create `render.yaml` (Optional but Recommended)**

   Create `Backend/render.yaml`:
   ```yaml
   services:
     - type: web
       name: course-management-api
       env: node
       plan: free
       buildCommand: npm install && npm run build && npx prisma generate
       startCommand: npm run start
       envVars:
         - key: NODE_ENV
           value: production
         - key: DATABASE_URL
           fromDatabase:
             name: course-management-db
             property: connectionString
         - key: JWT_SECRET
           generateValue: true
         - key: JWT_REFRESH_SECRET
           generateValue: true
         - key: FRONTEND_URL
           value: https://your-frontend.vercel.app
   ```

2. **Update `package.json` Build Script**

   Ensure `Backend/package.json` has:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/server.js",
       "postinstall": "prisma generate"
     }
   }
   ```

3. **Create `.env.example` for Reference**

   Create `Backend/.env.example`:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d

   # Server
   PORT=5000
   NODE_ENV=production

   # Frontend URL (for CORS)
   FRONTEND_URL=https://your-frontend.vercel.app

   # AI Configuration (Optional)
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5:3b
   AI_MAX_FILE_SIZE=10485760
   AI_RATE_LIMIT=10
   AI_TIMEOUT=120000
   ```

### Step 2: Deploy Backend on Render

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service**
   - **Name**: `course-management-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `Backend` (if your backend is in a subfolder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start`
   - **Plan**: Free (for development) or Starter ($7/month for production)

3. **Environment Variables**
   Add these in Render dashboard → Environment:
   ```
   NODE_ENV=production
   DATABASE_URL=<from your PostgreSQL service>
   JWT_SECRET=<generate a strong random string>
   JWT_REFRESH_SECRET=<generate a different strong random string>
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   PORT=5000
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

   **Generate JWT Secrets**:
   ```bash
   # Use Node.js to generate random strings
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Database Migrations**
   - After first deployment, run migrations:
     - Go to Render dashboard → Your service → Shell
     - Run: `npx prisma migrate deploy`
   - Or add to build command: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`

5. **File Uploads Consideration**
   - **Render free tier**: Ephemeral filesystem (uploads will be lost on restart)
   - **Solutions**:
     - Use **Cloudinary** (already in dependencies) for file storage
     - Use **AWS S3** or **DigitalOcean Spaces**
     - Use **Render Disk** (paid addon) for persistent storage
   - Update file upload logic to use cloud storage instead of local filesystem

### Step 3: Verify Backend Deployment

1. Check logs in Render dashboard
2. Test health endpoint: `https://your-api.onrender.com/health`
3. Test API: `https://your-api.onrender.com/api/v1/courses`

---

## Part 3: Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Production

1. **Update API Base URL**

   Ensure `Frontend/src/lib/api.ts` uses environment variable:
   ```typescript
   const API_BASE_URL = typeof window !== 'undefined' 
     ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
     : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
   ```

2. **Create `.env.example`**

   Create `Frontend/.env.example`:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
   ```

3. **Update `next.config.mjs` (if needed)**

   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
       images: {
           remotePatterns: [
               { hostname: "images.pexels.com" },
               { hostname: "your-api.onrender.com" }, // For uploaded images
               { hostname: "res.cloudinary.com" }, // If using Cloudinary
           ],
       },
   };

   export default nextConfig;
   ```

### Step 2: Deploy Frontend on Vercel

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `Frontend` (if your frontend is in a subfolder)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Environment Variables**
   Add in Vercel dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a URL like: `https://your-project.vercel.app`

### Step 3: Update Backend CORS

1. **Update Backend Environment Variable**
   - Go to Render dashboard → Your backend service → Environment
   - Update `FRONTEND_URL` to your Vercel URL:
     ```
     FRONTEND_URL=https://your-project.vercel.app
     ```
   - Restart the service

2. **Verify CORS**
   - Check browser console for CORS errors
   - Test API calls from frontend

---

## Part 4: Post-Deployment Steps

### 1. Run Database Migrations

   If not done during build:
   ```bash
   # In Render shell or locally with production DATABASE_URL
   cd Backend
   npx prisma migrate deploy
   ```

### 2. Seed Database (Optional)

   If you need initial data:
   ```bash
   # In Render shell
   cd Backend
   npm run prisma:seed
   ```

### 3. Set Up File Storage

   **Option A: Cloudinary** (Recommended)
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get API keys
   - Add to backend environment:
     ```
     CLOUDINARY_CLOUD_NAME=your-cloud-name
     CLOUDINARY_API_KEY=your-api-key
     CLOUDINARY_API_SECRET=your-api-secret
     ```
   - Update file upload code to use Cloudinary

   **Option B: AWS S3**
   - Create S3 bucket
   - Get access keys
   - Add to backend environment
   - Update file upload code

### 4. Configure Custom Domains (Optional)

   **Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

   **Render**:
   - Go to Service Settings → Custom Domains
   - Add your custom domain
   - Configure DNS records

### 5. Set Up Monitoring

   - **Vercel**: Built-in analytics
   - **Render**: Built-in logs and metrics
   - Consider: **Sentry** for error tracking, **LogRocket** for session replay

---

## Part 5: Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
DATABASE_URL=postgresql://... (from Render PostgreSQL)
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-random-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app

# Optional: File Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional: AI
OLLAMA_BASE_URL=...
OLLAMA_MODEL=...
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
```

---

## Part 6: Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database is running (Render PostgreSQL may be sleeping)
   - Ensure migrations are run: `npx prisma migrate deploy`

2. **CORS Errors**
   - Verify `FRONTEND_URL` in backend matches Vercel URL exactly
   - Check for trailing slashes
   - Restart backend service after changing CORS settings

3. **Build Failures**
   - Check build logs in Render/Vercel
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

4. **File Upload Issues**
   - Render free tier has ephemeral filesystem
   - Use cloud storage (Cloudinary, S3) instead

5. **Environment Variables Not Working**
   - Restart service after adding variables
   - Check variable names match code exactly
   - Frontend: Only `NEXT_PUBLIC_*` variables are exposed to browser

---

## Part 7: Production Checklist

- [ ] Database deployed and accessible
- [ ] Database migrations run successfully
- [ ] Backend deployed on Render
- [ ] Backend environment variables configured
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variables configured
- [ ] CORS configured correctly
- [ ] File storage configured (Cloudinary/S3)
- [ ] JWT secrets are strong and unique
- [ ] Health endpoints working
- [ ] API endpoints accessible
- [ ] Frontend can communicate with backend
- [ ] Custom domains configured (if needed)
- [ ] SSL certificates active (automatic on Vercel/Render)
- [ ] Monitoring/logging set up

---

## Cost Estimation

### Free Tier (Development)
- **Vercel**: Free (unlimited deployments, 100GB bandwidth)
- **Render**: Free (limited hours, sleeps after inactivity)
- **Render PostgreSQL**: Free (90-day retention, sleeps after inactivity)
- **Total**: $0/month

### Production Tier (Recommended)
- **Vercel**: Free or Pro ($20/month for team features)
- **Render Web Service**: Starter ($7/month)
- **Render PostgreSQL**: Starter ($7/month)
- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth)
- **Total**: ~$14-34/month

---

## Next Steps

1. **Security**
   - Enable rate limiting
   - Set up API keys for external services
   - Review and update CORS policies
   - Enable HTTPS (automatic on Vercel/Render)

2. **Performance**
   - Enable caching where appropriate
   - Optimize database queries
   - Use CDN for static assets (Vercel handles this)
   - Implement pagination for large datasets

3. **Backup**
   - Set up automated database backups
   - Export database regularly
   - Version control all code changes

4. **Scaling**
   - Monitor usage and performance
   - Upgrade plans as needed
   - Consider load balancing for high traffic

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Last Updated**: January 2026
**Version**: 1.0
