# Quick Start: Building with WSL

## Fast Track (3 Steps)

### 1. Install WSL
Open PowerShell **as Administrator** and run:
```powershell
.\install-wsl.ps1
```
Or manually: `wsl --install`

**⚠️ You'll need to restart your computer after installation.**

### 2. After Restart
1. Ubuntu will launch automatically
2. Create a username and password
3. Run these commands in Ubuntu:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install EAS CLI
   npm install -g eas-cli
   
   # Login to EAS
   eas login
   ```

### 3. Build Your App
```bash
# Navigate to your project
cd "/mnt/f/1. Project/LifeOS/LifeOS Codebase"

# Run the build script
bash build-wsl.sh
```

That's it! 🎉

## Why WSL?

✅ **No permission errors** - Linux handles file permissions better  
✅ **Same environment as EAS servers** - Better compatibility  
✅ **Faster builds** - No Windows file system overhead  
✅ **No need to close editors** - Files aren't locked  

## Need More Help?

See `WSL_SETUP.md` for detailed instructions and troubleshooting.




