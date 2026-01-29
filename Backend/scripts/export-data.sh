#!/bin/bash
# Export data from local database

# Get local DATABASE_URL from .env or set manually
# Example: postgresql://user:password@localhost:5432/course_management

LOCAL_DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/course_management}"

echo "📦 Exporting data from local database..."
echo "Database URL: $LOCAL_DB_URL"

# Export schema + data
pg_dump "$LOCAL_DB_URL" --clean --if-exists --no-owner --no-acl -f local_backup.sql

echo "✅ Export completed: local_backup.sql"
echo "📁 File size: $(du -h local_backup.sql | cut -f1)"
