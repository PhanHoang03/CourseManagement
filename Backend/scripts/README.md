# Database Migration Scripts

Scripts to export/import data between local and production databases.

## Prerequisites

1. **PostgreSQL client tools installed:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Make sure `pg_dump` and `psql` are in your PATH

2. **Local database running:**
   - Your local PostgreSQL database should be running
   - Check your local `DATABASE_URL` in `.env` file

## Step 1: Export Data from Local Database

### Windows (PowerShell):
```powershell
cd Backend
.\scripts\export-data.ps1
```

### Linux/Mac:
```bash
cd Backend
chmod +x scripts/export-data.sh
./scripts/export-data.sh
```

**Or manually:**
```bash
# Get your local DATABASE_URL from .env
# Example: postgresql://postgres:postgres@localhost:5432/course_management

pg_dump "postgresql://postgres:postgres@localhost:5432/course_management" \
  --clean --if-exists --no-owner --no-acl \
  -f local_backup.sql
```

This will create `local_backup.sql` file in the Backend directory.

## Step 2: Import Data to Production Database

### Windows (PowerShell):
```powershell
cd Backend
.\scripts\import-data.ps1
```

### Linux/Mac:
```bash
cd Backend
psql "postgresql://phanhoang:Pk0ZCICTTMur4mnSAfZbZgRliyUbLKcU@dpg-d5n28tsmrvns73cbivd0-a.singapore-postgres.render.com/course_management_zpdw" < local_backup.sql
```

**Or manually:**
```bash
psql "postgresql://phanhoang:Pk0ZCICTTMur4mnSAfZbZgRliyUbLKcU@dpg-d5n28tsmrvns73cbivd0-a.singapore-postgres.render.com/course_management_zpdw" < local_backup.sql
```

## Important Notes

⚠️ **WARNING:**
- Importing will **REPLACE** all existing data in production database
- Make sure you have a backup of production data if needed
- This includes all tables: users, courses, enrollments, etc.

✅ **Before importing:**
1. Make sure migrations have been run on production (tables exist)
2. Export completed successfully
3. You have the correct production database URL

## Troubleshooting

### Error: "pg_dump: command not found"
- Install PostgreSQL client tools
- Add PostgreSQL bin directory to PATH

### Error: "connection refused"
- Check if local PostgreSQL is running
- Verify DATABASE_URL is correct

### Error: "permission denied"
- Check database user permissions
- Verify connection string credentials

### Error: "relation already exists"
- This is normal if tables already exist
- The `--clean` flag will drop and recreate tables

## Alternative: Using Prisma Studio

If you prefer GUI:
1. Open local Prisma Studio: `npx prisma studio` (port 5555)
2. Manually copy important data
3. Or use database GUI tools (pgAdmin, DBeaver, etc.)
