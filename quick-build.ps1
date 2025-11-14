# Quick build script for LifeOS
# This script prepares the project and runs the EAS build

Write-Host "=== LifeOS Quick Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix permissions
Write-Host "Step 1: Fixing file permissions..." -ForegroundColor Yellow
& .\fix-permissions.ps1

Write-Host ""

# Step 2: Pre-build check
Write-Host "Step 2: Running pre-build checks..." -ForegroundColor Yellow
$checkResult = & .\pre-build-check.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Pre-build checks failed. Please fix the issues above before building." -ForegroundColor Red
    Write-Host "`nCommon fixes:" -ForegroundColor Yellow
    Write-Host "  1. Close all file editors (VS Code, Cursor, etc.)" -ForegroundColor White
    Write-Host "  2. Close file explorer windows with the project open" -ForegroundColor White
    Write-Host "  3. Stop Node processes: taskkill /F /IM node.exe" -ForegroundColor White
    Write-Host "  4. Run this script as Administrator" -ForegroundColor White
    exit 1
}

Write-Host ""

# Step 3: Check if git is initialized (optional but recommended)
Write-Host "Step 3: Checking Git repository..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    Write-Host "  Git repository not found. Initializing..." -ForegroundColor Yellow
    Write-Host "  (This helps EAS build work more reliably)" -ForegroundColor Gray
    
    $initGit = Read-Host "  Initialize git repository? (y/n)"
    if ($initGit -eq 'y' -or $initGit -eq 'Y') {
        git init
        git add .
        git commit -m "Initial commit for EAS build"
        Write-Host "  [OK] Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "  Skipping git initialization" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [OK] Git repository found" -ForegroundColor Green
}

Write-Host ""

# Step 4: Prompt for build profile
Write-Host "Step 4: Select build profile" -ForegroundColor Yellow
Write-Host "  1. Preview (APK for testing)" -ForegroundColor White
Write-Host "  2. Production (APK for production)" -ForegroundColor White
$profile = Read-Host "  Enter choice (1 or 2, default: 1)"

if ($profile -eq '2') {
    $buildProfile = "production"
} else {
    $buildProfile = "preview"
}

Write-Host ""

# Step 5: Run the build
Write-Host "Step 5: Starting EAS build..." -ForegroundColor Yellow
Write-Host "  Profile: $buildProfile" -ForegroundColor White
Write-Host "  Platform: android" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "  Proceed with build? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "  Build cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting build... This may take 15-20 minutes for the first build." -ForegroundColor Cyan
Write-Host ""

npx eas build --platform android --profile $buildProfile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Build failed. Check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see permission errors, try:" -ForegroundColor Yellow
    Write-Host "  1. Run this script as Administrator" -ForegroundColor White
    Write-Host "  2. Use WSL (Windows Subsystem for Linux)" -ForegroundColor White
    Write-Host "  3. Close all file editors and try again" -ForegroundColor White
}

