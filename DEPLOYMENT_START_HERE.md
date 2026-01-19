# 🚀 Deployment Start Here

Welcome! This guide will walk you through deploying your Course Management System.

## Repository Status

Your GitHub repository: https://github.com/PhanHoang03/CourseManagement.git

**Current Status**: Repository appears to be empty. You need to push your code first.

---

## Step-by-Step Deployment Process

### Phase 1: Push Code to GitHub ⬆️

**Time**: 10-15 minutes

1. **Install Git** (if not installed)
   - Download: https://git-scm.com/download/win
   - Install with default settings

2. **Push Your Code**
   - Follow `GIT_SETUP_GUIDE.md` for detailed instructions
   - Quick version:
     ```bash
     git init
     git remote add origin https://github.com/PhanHoang03/CourseManagement.git
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git push -u origin main
     ```

3. **Verify**
   - Check https://github.com/PhanHoang03/CourseManagement
   - All files should be visible

---

### Phase 2: Deploy Database 🗄️

**Time**: 5 minutes  
**Cost**: Free (with limitations)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign up/Login
3. Click "New +" → "PostgreSQL"
4. Configure:
   - **Name**: `course-management-db`
   - **Database**: `course_management`
   - **Plan**: Free
   - **Region**: Choose closest to you
5. Click "Create Database"
6. **Copy the Internal Database URL** (you'll need this for backend)

---

### Phase 3: Deploy Backend on Render 🖥️

**Time**: 15-20 minutes  
**Cost**: Free (with limitations)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select repository: `PhanHoang03/CourseManagement`
5. Configure:
   - **Name**: `course-management-api`
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && npm run build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**: `npm run start`
   - **Plan**: Free

6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=<paste from Phase 2>
   JWT_SECRET=<generate random string>
   JWT_REFRESH_SECRET=<generate random string>
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   PORT=5000
   FRONTEND_URL=<will update after Phase 4>
   ```

   **Generate JWT Secrets**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Run this twice to get two different secrets.

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. **Note your backend URL**: `https://your-api.onrender.com`

---

### Phase 4: Deploy Frontend on Vercel 🌐

**Time**: 10 minutes  
**Cost**: Free

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Sign up/Login with GitHub
3. Click "Add New..." → "Project"
4. Import repository: `PhanHoang03/CourseManagement`
5. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

6. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
   ```
   (Replace with your actual backend URL from Phase 3)

7. Click "Deploy"
8. Wait for deployment (2-5 minutes)
9. **Note your frontend URL**: `https://your-project.vercel.app`

---

### Phase 5: Update Backend CORS 🔗

**Time**: 2 minutes

1. Go back to Render → Your backend service
2. Go to "Environment" tab
3. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
4. Save changes
5. Service will automatically restart

---

### Phase 6: Test Deployment ✅

**Time**: 5 minutes

1. **Test Backend**:
   - Visit: `https://your-api.onrender.com/health`
   - Should return success message

2. **Test Frontend**:
   - Visit: `https://your-project.vercel.app`
   - Should load the application

3. **Test Integration**:
   - Try logging in
   - Check browser console for errors
   - Verify API calls work

---

## Quick Reference

### Your Deployment URLs

After deployment, you'll have:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-api.onrender.com`
- **API Base**: `https://your-api.onrender.com/api/v1`

### Important Notes

1. **Database**: Free tier may sleep after inactivity. First request may be slow.
2. **File Uploads**: Render free tier has ephemeral storage. Use Cloudinary for production.
3. **CORS**: Always update `FRONTEND_URL` in backend after frontend deployment.
4. **Environment Variables**: Never commit `.env` files. Use platform environment variables.

---

## Need Help?

- **Detailed Guide**: See `DEPLOYMENT_PLAN.md`
- **Checklist**: Use `DEPLOYMENT_CHECKLIST.md`
- **Quick Reference**: See `QUICK_DEPLOYMENT_GUIDE.md`
- **Git Setup**: See `GIT_SETUP_GUIDE.md`

---

## Estimated Total Time

- **Phase 1** (Git Push): 10-15 minutes
- **Phase 2** (Database): 5 minutes
- **Phase 3** (Backend): 15-20 minutes
- **Phase 4** (Frontend): 10 minutes
- **Phase 5** (CORS): 2 minutes
- **Phase 6** (Testing): 5 minutes

**Total**: ~50-60 minutes

---

## Cost Summary

- **Free Tier**: $0/month (perfect for development/testing)
- **Production**: ~$14-34/month (if you need better performance)

---

**Ready to start?** Begin with Phase 1: Push your code to GitHub! 🚀
