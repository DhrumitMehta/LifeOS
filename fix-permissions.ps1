# Fix file permissions for EAS build on Windows
# Run this script as Administrator if you encounter permission issues

Write-Host "Fixing file permissions for EAS build..." -ForegroundColor Cyan

# Function to remove read-only attributes recursively
function Remove-ReadOnlyAttribute {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Get-ChildItem -Path $Path -Recurse -Force | ForEach-Object {
            if ($_.Attributes -match 'ReadOnly') {
                $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
                Write-Host "  Fixed: $($_.FullName)" -ForegroundColor Green
            }
        }
    }
}

Write-Host "`nRemoving read-only attributes from project files..." -ForegroundColor Yellow

# Fix assets
Remove-ReadOnlyAttribute -Path "assets"

# Fix source directory
Remove-ReadOnlyAttribute -Path "src"

# Fix root files
Get-ChildItem -Path . -File -Force | ForEach-Object {
    if ($_.Attributes -match 'ReadOnly') {
        $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
        Write-Host "  Fixed: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "`nPermission fixes complete!" -ForegroundColor Green
Write-Host "`nNote: If issues persist, try:" -ForegroundColor Cyan
Write-Host "  1. Close all file editors/IDEs" -ForegroundColor White
Write-Host "  2. Run PowerShell as Administrator" -ForegroundColor White
Write-Host "  3. Temporarily disable antivirus real-time scanning" -ForegroundColor White
Write-Host "  4. Use WSL (Windows Subsystem for Linux) if available" -ForegroundColor White

