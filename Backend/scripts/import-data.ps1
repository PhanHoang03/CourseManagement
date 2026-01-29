# PowerShell script to import data to production database
# Run: .\scripts\import-data.ps1

# Production database URL
$prodDbUrl = "postgresql://phanhoang:Pk0ZCICTTMur4mnSAfZbZgRliyUbLKcU@dpg-d5n28tsmrvns73cbivd0-a.singapore-postgres.render.com/course_management_zpdw"

# Check if backup file exists
if (-not (Test-Path "local_backup.sql")) {
    Write-Host "ERROR: local_backup.sql not found!" -ForegroundColor Red
    Write-Host "Please run export-data.ps1 first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Importing data to production database..." -ForegroundColor Cyan
Write-Host "WARNING: This will replace all data in production database!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Import cancelled." -ForegroundColor Yellow
    exit 0
}

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Import data
Write-Host "Importing..." -ForegroundColor Yellow
Get-Content local_backup.sql | & psql $prodDbUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Import completed successfully!" -ForegroundColor Green
    Write-Host "Your production database now has all local data!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Import failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    exit 1
}
