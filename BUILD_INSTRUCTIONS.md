# Building LifeOS APK

## Prerequisites
1. You're already logged into EAS CLI (username: dhrumit_21)
2. EAS CLI is installed

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

## Notes

- Builds are done on EAS servers (cloud build)
- First build may take 15-20 minutes
- Subsequent builds are faster due to caching
- You can monitor build progress at: https://expo.dev/accounts/dhrumit_21/projects/lifeos/builds

