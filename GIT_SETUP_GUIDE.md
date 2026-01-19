# Git Setup and Deployment Guide

This guide will help you push your code to GitHub and prepare for deployment.

## Step 1: Install Git (If Not Already Installed)

1. Download Git from: https://git-scm.com/download/win
2. Install with default settings
3. Restart your terminal/PowerShell after installation

## Step 2: Initialize Git Repository

Open PowerShell or Git Bash in your project directory (`D:\Do An`) and run:

```bash
# Initialize git repository
git init

# Add remote repository
git remote add origin https://github.com/PhanHoang03/CourseManagement.git

# Verify remote
git remote -v
```

## Step 3: Configure Git (First Time Only)

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 4: Stage and Commit Files

```bash
# Add all files
git add .

# Check what will be committed
git status

# Commit with a message
git commit -m "Initial commit: Course Management System with deployment config"
```

## Step 5: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or use GitHub Desktop for easier authentication

## Step 6: Verify on GitHub

1. Go to https://github.com/PhanHoang03/CourseManagement
2. Verify all files are uploaded
3. Check that `.env` files are NOT included (they should be in `.gitignore`)

---

## Important Files to Commit

✅ **Should be committed:**
- All source code (`Backend/src/`, `Frontend/src/`)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Prisma schema and migrations (`Backend/prisma/`)
- Deployment configs (`render.yaml`, `DEPLOYMENT_PLAN.md`)
- Documentation files

❌ **Should NOT be committed:**
- `.env` files (contains secrets)
- `node_modules/` (will be installed during build)
- `dist/` or `build/` folders (generated during build)
- Log files
- Uploaded videos/files

---

## After Pushing to GitHub

Once your code is on GitHub, you can proceed with deployment:

1. **Deploy Database** (Render PostgreSQL)
2. **Deploy Backend** (Render Web Service)
3. **Deploy Frontend** (Vercel)

See `DEPLOYMENT_PLAN.md` for detailed instructions.

---

## Troubleshooting

### Authentication Issues

If you get authentication errors when pushing:

1. **Use Personal Access Token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Use token as password when pushing

2. **Or use GitHub Desktop:**
   - Download from: https://desktop.github.com/
   - Easier authentication through GUI

### Large Files

If you have large video files in `Backend/uploads/videos/`:
- They are already in `.gitignore`
- For production, use cloud storage (Cloudinary/S3) instead

### Prisma Migrations

Migrations should be committed. If you see them in `.gitignore`, they've been updated to be included.

---

## Quick Commands Reference

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main

# Pull latest changes
git pull origin main

# Check remote
git remote -v
```

---

**Next Step**: After pushing to GitHub, follow `DEPLOYMENT_PLAN.md` to deploy your application.
