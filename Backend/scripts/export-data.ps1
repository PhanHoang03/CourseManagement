# PowerShell script to export data from local database
# Run: .\scripts\export-data.ps1

# Get local DATABASE_URL from environment or set manually
$localDbUrl = $env:DATABASE_URL
if (-not $localDbUrl) {
    # Default local database URL - UPDATE THIS with your local database URL
    $localDbUrl = "postgresql://postgres:hong13102003@localhost:5432/course_management"
}

Write-Host "Exporting data from local database..." -ForegroundColor Cyan
Write-Host "Database URL: $localDbUrl" -ForegroundColor Gray

# Check if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Host "ERROR: pg_dump not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Export schema + data
Write-Host "Exporting..." -ForegroundColor Yellow
$result = & pg_dump $localDbUrl --clean --if-exists --no-owner --no-acl -f local_backup.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    if (Test-Path "local_backup.sql") {
        $fileSize = (Get-Item local_backup.sql).Length / 1MB
        Write-Host "SUCCESS: Export completed: local_backup.sql" -ForegroundColor Green
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Backup file was not created!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Export failed!" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}
