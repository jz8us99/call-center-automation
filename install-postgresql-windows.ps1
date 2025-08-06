# PostgreSQL Client Tools Installation Script for Windows
# Run this in PowerShell as Administrator

Write-Host "PostgreSQL Client Tools Installation for Windows" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Option 1: Download and install PostgreSQL (includes client tools)
Write-Host "`n1. Downloading PostgreSQL installer..." -ForegroundColor Yellow

$url = "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"
$output = "$env:TEMP\postgresql-installer.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "✅ Downloaded PostgreSQL installer to: $output" -ForegroundColor Green
    
    Write-Host "`n2. Running installer..." -ForegroundColor Yellow
    Write-Host "IMPORTANT: During installation, you can:" -ForegroundColor Cyan
    Write-Host "- Uncheck 'PostgreSQL Server' if you only need client tools" -ForegroundColor Cyan
    Write-Host "- Keep 'Command Line Tools' checked" -ForegroundColor Cyan
    Write-Host "- This will install pg_dump and psql" -ForegroundColor Cyan
    
    # Run installer (user will interact with GUI)
    Start-Process -FilePath $output -Wait
    
    Write-Host "`n3. Checking installation..." -ForegroundColor Yellow
    
    # Add PostgreSQL to PATH if not already there
    $pgPath = "C:\Program Files\PostgreSQL\16\bin"
    if (Test-Path $pgPath) {
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$pgPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$pgPath", "Machine")
            Write-Host "✅ Added PostgreSQL to system PATH" -ForegroundColor Green
        }
        
        # Refresh current session PATH
        $env:PATH += ";$pgPath"
        
        Write-Host "`n4. Testing installation..." -ForegroundColor Yellow
        & "$pgPath\pg_dump.exe" --version
        & "$pgPath\psql.exe" --version
        
        Write-Host "✅ PostgreSQL client tools installed successfully!" -ForegroundColor Green
        Write-Host "`nYou can now run the Supabase migration scripts." -ForegroundColor Cyan
    } else {
        Write-Host "❌ PostgreSQL installation directory not found." -ForegroundColor Red
        Write-Host "Please check if the installation completed successfully." -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error downloading or installing PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nAlternative: Download manually from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Green
Write-Host "1. Open a new PowerShell/Command Prompt window" -ForegroundColor White
Write-Host "2. Test: pg_dump --version" -ForegroundColor White
Write-Host "3. Test: psql --version" -ForegroundColor White
Write-Host "4. Configure your Supabase migration scripts" -ForegroundColor White