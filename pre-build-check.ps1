# Pre-build check script for Windows
# This script ensures all files are accessible before EAS build

Write-Host "Checking file accessibility for EAS build..." -ForegroundColor Cyan

$errors = @()

# Check asset files
$assetFiles = @(
    "assets\adaptive-icon.png",
    "assets\favicon.png",
    "assets\icon.png",
    "assets\splash.png"
)

Write-Host "`nChecking asset files..." -ForegroundColor Yellow
foreach ($file in $assetFiles) {
    if (Test-Path $file) {
        try {
            $fileInfo = Get-Item $file -Force
            if ($fileInfo.IsReadOnly) {
                Write-Host "  WARNING: $file is read-only" -ForegroundColor Yellow
                $fileInfo.IsReadOnly = $false
                Write-Host "  Fixed: Removed read-only attribute" -ForegroundColor Green
            }
            # Try to open file to check for locks
            $stream = [System.IO.File]::Open($file, 'Open', 'Read', 'None')
            $stream.Close()
            Write-Host "  OK: $file" -ForegroundColor Green
        } catch {
            $errors += "Cannot access $file : $_"
            Write-Host "  ERROR: $file - $_" -ForegroundColor Red
        }
    } else {
        $errors += "File not found: $file"
        Write-Host "  ERROR: $file not found" -ForegroundColor Red
    }
}

# Check source directories
$sourceDirs = @(
    "src\components",
    "src\config",
    "src\context",
    "src\database",
    "src\screens",
    "src\services",
    "src\theme",
    "src\types",
    "src\utils"
)

Write-Host "`nChecking source directories..." -ForegroundColor Yellow
foreach ($dir in $sourceDirs) {
    if (Test-Path $dir) {
        try {
            $dirInfo = Get-Item $dir -Force
            if ($dirInfo.Attributes -match 'ReadOnly') {
                $dirInfo.Attributes = $dirInfo.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
                Write-Host "  Fixed: Removed read-only from $dir" -ForegroundColor Green
            }
            Write-Host "  OK: $dir" -ForegroundColor Green
        } catch {
            $errors += "Cannot access directory $dir : $_"
            Write-Host "  ERROR: $dir - $_" -ForegroundColor Red
        }
    } else {
        $errors += "Directory not found: $dir"
        Write-Host "  ERROR: $dir not found" -ForegroundColor Red
    }
}

# Check critical source files
Write-Host "`nChecking critical source files..." -ForegroundColor Yellow
$criticalFiles = @(
    "src\components\NotificationScheduler.tsx",
    "src\components\NotionConnectionModal.tsx",
    "src\config\supabase.ts",
    "src\context\AppContext.tsx",
    "src\database\database.ts",
    "src\database\supabaseDatabase.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: $file not found (may be gitignored)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n" -NoNewline
if ($errors.Count -eq 0) {
    Write-Host "[OK] All checks passed! Ready for EAS build." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Close all file editors/IDEs" -ForegroundColor White
    Write-Host "  2. Run: npx eas build --platform android --profile preview" -ForegroundColor White
    exit 0
} else {
    Write-Host "[ERROR] Found $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host "`nPlease fix these issues before building." -ForegroundColor Yellow
    exit 1
}

