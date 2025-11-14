# WSL Setup Guide for LifeOS Builds

Using WSL (Windows Subsystem for Linux) is the **recommended way** to build on Windows as it completely avoids Windows file permission issues.

## Step 1: Install WSL

### Quick Install (Recommended)
Open PowerShell **as Administrator** and run:
```powershell
wsl --install
```

This will:
- Install WSL with Ubuntu (default distribution)
- Set up everything automatically
- Require a system restart

### Manual Install (Alternative)
If the quick install doesn't work:
```powershell
# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart your computer, then:
wsl --set-default-version 2
wsl --install -d Ubuntu
```

## Step 2: After Installation

1. **Restart your computer** (required after WSL installation)
2. **Launch Ubuntu** from Start Menu
3. **Create a user account** when prompted (username and password)
4. **Update the system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Step 3: Install Node.js and EAS CLI in WSL

```bash
# Install Node.js (using NodeSource repository for latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install EAS CLI globally
npm install -g eas-cli

# Login to EAS (if not already logged in)
eas login
```

## Step 4: Navigate to Your Project

Your Windows drives are mounted under `/mnt/` in WSL. Your project path would be:

```bash
# Navigate to your project
cd "/mnt/f/1. Project/LifeOS/LifeOS Codebase"

# Or use the WSL build script (see below)
```

## Step 5: Build from WSL

### Option A: Use the WSL Build Script
```bash
# From WSL terminal
cd "/mnt/f/1. Project/LifeOS/LifeOS Codebase"
bash build-wsl.sh
```

### Option B: Manual Build
```bash
cd "/mnt/f/1. Project/LifeOS/LifeOS Codebase"
npx eas build --platform android --profile preview
```

## Troubleshooting

### WSL Installation Issues
- Make sure you're running PowerShell **as Administrator**
- Enable Virtualization in BIOS if WSL2 doesn't work
- Check Windows version: WSL requires Windows 10 version 2004 or later

### File Path Issues
- Use quotes around paths with spaces: `"/mnt/f/1. Project/..."`
- WSL uses forward slashes `/` not backslashes `\`

### Permission Issues in WSL
If you get permission errors in WSL:
```bash
# Fix ownership (replace 'yourusername' with your WSL username)
sudo chown -R $USER:$USER "/mnt/f/1. Project/LifeOS/LifeOS Codebase"
```

### Node.js Not Found
Make sure Node.js is installed in WSL, not just Windows:
```bash
which node
# Should show: /usr/bin/node or similar
# If not, install Node.js in WSL (see Step 3)
```

## Benefits of Using WSL

✅ No Windows file permission issues  
✅ Native Linux environment (same as EAS build servers)  
✅ Better compatibility with development tools  
✅ Faster file operations  
✅ No need to close file editors  

## Quick Reference

**Open WSL Terminal:**
- Type `wsl` in PowerShell/CMD
- Or launch "Ubuntu" from Start Menu

**Access Windows Files from WSL:**
- Windows C: drive = `/mnt/c/`
- Windows F: drive = `/mnt/f/`

**Access WSL Files from Windows:**
- `\\wsl$\Ubuntu\home\yourusername\`




