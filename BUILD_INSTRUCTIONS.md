# Building LifeOS APK

## Prerequisites
1. You're already logged into EAS CLI (username: dhrumit_21)
2. EAS CLI is installed

## Windows-Specific Setup (IMPORTANT)

### ⭐ RECOMMENDED: Use WSL (Best Solution)

**WSL completely avoids Windows permission issues.** If you haven't installed WSL yet:

1. **Install WSL (run as Administrator):**
   ```powershell
   .\install-wsl.ps1
   ```
   Or manually: `wsl --install` (requires restart)

2. **After restart, follow WSL_SETUP.md** to install Node.js and EAS CLI in WSL

3. **Build from WSL:**
   ```bash
   # In WSL terminal
   cd "/mnt/f/1. Project/LifeOS/LifeOS Codebase"
   bash build-wsl.sh
   ```

### Alternative: Build from Windows PowerShell

If you prefer not to use WSL, follow these steps **before** building:

1. **Run the permission fix script:**
   ```powershell
   .\fix-permissions.ps1
   ```

2. **Run the pre-build check:**
   ```powershell
   .\pre-build-check.ps1
   ```

3. **If issues persist:**
   - Close all file editors/IDEs (VS Code, etc.)
   - Run PowerShell as Administrator
   - Temporarily disable antivirus real-time scanning
   - Ensure no other processes are accessing project files

## Steps to Build APK

### 1. Initialize EAS Project (if not already done)
```bash
npx eas init
```
When prompted, choose to create a new project.

### 2. Build the APK
```bash
npx eas build --platform android --profile preview
```

This will:
- Build an APK file (not AAB)
- Use the "preview" profile from eas.json
- Upload the build to EAS servers
- Provide a download link when complete

### 3. Alternative: Build for Production
```bash
npx eas build --platform android --profile production
```

## Build Profiles

- **preview**: Builds an APK for testing (easier to install)
- **production**: Builds an APK optimized for production

## After Build Completes

1. You'll get a download link in the terminal
2. Download the APK file
3. Install it on your Android device:
   - Enable "Install from Unknown Sources" in Android settings
   - Transfer APK to device and install

## Troubleshooting Permission Errors

If you see errors like:
```
tar: assets/icon.png: Cannot open: Permission denied
tar: src/components: Cannot mkdir: Permission denied
```

**Solutions:**

1. **Run permission fix script:**
   ```powershell
   .\fix-permissions.ps1
   ```

2. **Check for file locks:**
   ```powershell
   .\pre-build-check.ps1
   ```

3. **Close all file handles:**
   - Close VS Code/Cursor
   - Close any file explorers with the project open
   - Stop any running Node processes: `taskkill /F /IM node.exe`

4. **Run as Administrator:**
   - Right-click PowerShell → "Run as Administrator"
   - Navigate to project directory
   - Run the build command

5. **Use WSL (Best Solution):**
   - Install WSL if not already installed
   - Build from WSL terminal instead of PowerShell

6. **Initialize Git Repository (Helps EAS):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   EAS works better with git repositories.

## Notes

- Builds are done on EAS servers (cloud build)
- First build may take 15-20 minutes
- Subsequent builds are faster due to caching
- You can monitor build progress at: https://expo.dev/accounts/dhrumit_21/projects/lifeos/builds
- **Windows users**: Consider using WSL for the most reliable builds

