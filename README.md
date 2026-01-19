# Course Management System

A comprehensive learning management system built with Next.js (Frontend) and Node.js/Express (Backend).

## 🚀 Quick Start

### For Development

1. **Backend Setup**:
   ```bash
   cd Backend
   npm install
   cp .env.example .env  # Create .env file with your configuration
   npx prisma migrate dev
   npx prisma generate
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd Frontend
   npm install
   cp .env.example .env  # Create .env file with API URL
   npm run dev
   ```

### For Deployment

📖 **Start here**: Read `DEPLOYMENT_START_HERE.md` for step-by-step deployment instructions.

## 📚 Documentation

- **`DEPLOYMENT_START_HERE.md`** - Quick start guide for deployment
- **`DEPLOYMENT_PLAN.md`** - Comprehensive deployment guide
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment checklist
- **`QUICK_DEPLOYMENT_GUIDE.md`** - Quick reference
- **`GIT_SETUP_GUIDE.md`** - Git repository setup guide

## 🏗️ Project Structure

```
.
├── Backend/          # Node.js/Express API
│   ├── src/         # Source code
│   ├── prisma/      # Database schema and migrations
│   └── uploads/     # File uploads (use cloud storage in production)
│
├── Frontend/        # Next.js application
│   ├── src/         # Source code
│   └── public/      # Static assets
│
└── Documentation/    # Project documentation
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Prisma** (PostgreSQL)
- **JWT** Authentication
- **Zod** Validation

### Frontend
- **Next.js 16**
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **React Hook Form**

## 📋 Features

- User Management (Admin, Instructor, Trainee roles)
- Course Management
- Module and Content Management
- Assessments and Assignments
- Progress Tracking
- Enrollment System
- AI-Powered Quiz Generation
- Organization and Department Management

## 🔐 Environment Variables

### Backend
See `Backend/.env.example` for required variables.

### Frontend
See `Frontend/.env.example` for required variables.

## 🗄️ Database

The project uses PostgreSQL with Prisma ORM. Run migrations with:
```bash
cd Backend
npx prisma migrate dev
```

## 📝 License

ISC

## 👥 Contributors

- PhanHoang03

---

**Ready to deploy?** Check out `DEPLOYMENT_START_HERE.md`! 🚀
