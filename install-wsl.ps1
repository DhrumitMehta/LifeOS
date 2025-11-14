# WSL Installation Script for LifeOS
# Run this script as Administrator to install WSL

Write-Host "=== WSL Installation Script for LifeOS ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Right-click PowerShell" -ForegroundColor White
    Write-Host "  2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "  3. Navigate to this directory" -ForegroundColor White
    Write-Host "  4. Run: .\install-wsl.ps1" -ForegroundColor White
    exit 1
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Check if WSL is already installed
Write-Host "Checking if WSL is already installed..." -ForegroundColor Yellow
$wslInstalled = $false

try {
    $wslStatus = wsl --status 2>&1
    if ($LASTEXITCODE -eq 0) {
        $wslInstalled = $true
        Write-Host "[OK] WSL is already installed" -ForegroundColor Green
        Write-Host ""
        Write-Host "WSL Status:" -ForegroundColor Cyan
        wsl --list --verbose
        Write-Host ""
        Write-Host "You can skip installation and proceed to build setup." -ForegroundColor Yellow
        $skip = Read-Host "Skip installation? (y/n)"
        if ($skip -eq 'y' -or $skip -eq 'Y') {
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "  1. Open WSL (Ubuntu) from Start Menu" -ForegroundColor White
            Write-Host "  2. Install Node.js and EAS CLI (see WSL_SETUP.md)" -ForegroundColor White
            Write-Host "  3. Run: bash build-wsl.sh" -ForegroundColor White
            exit 0
        }
    }
} catch {
    # WSL not installed, continue with installation
}

if (-not $wslInstalled) {
    Write-Host "WSL is not installed. Proceeding with installation..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "This will:" -ForegroundColor Cyan
    Write-Host "  1. Install WSL with Ubuntu" -ForegroundColor White
    Write-Host "  2. Require a system restart" -ForegroundColor White
    Write-Host "  3. Take a few minutes to complete" -ForegroundColor White
    Write-Host ""
    
    $confirm = Read-Host "Proceed with WSL installation? (y/n)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "Installing WSL..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    
    try {
        wsl --install
        Write-Host ""
        Write-Host "[OK] WSL installation initiated!" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: You need to restart your computer to complete the installation." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "After restart:" -ForegroundColor Cyan
        Write-Host "  1. Ubuntu will launch automatically" -ForegroundColor White
        Write-Host "  2. Create a username and password when prompted" -ForegroundColor White
        Write-Host "  3. Follow the steps in WSL_SETUP.md to install Node.js and EAS CLI" -ForegroundColor White
        Write-Host "  4. Run: bash build-wsl.sh to build your app" -ForegroundColor White
        Write-Host ""
        
        $restart = Read-Host "Restart now? (y/n)"
        if ($restart -eq 'y' -or $restart -eq 'Y') {
            Restart-Computer
        } else {
            Write-Host "Please restart manually when ready." -ForegroundColor Yellow
        }
    } catch {
        Write-Host ""
        Write-Host "[ERROR] Installation failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Try manual installation:" -ForegroundColor Yellow
        Write-Host "  1. Open PowerShell as Administrator" -ForegroundColor White
        Write-Host "  2. Run: wsl --install" -ForegroundColor White
        Write-Host "  3. Or follow instructions at: https://aka.ms/wslinstall" -ForegroundColor White
        exit 1
    }
}




