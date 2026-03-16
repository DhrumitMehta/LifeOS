# Running the app (avoid "Failed to download remote update")

## The error

If you see **`java.io.IOException: Failed to download remote update`**, it comes from an **already-installed LifeOS APK** that was built when the project had update/OTA code. That old build tries to fetch an update on launch and fails.

## Fix: use Expo Go for development

1. **Uninstall the LifeOS app** from your Android device or emulator (the standalone APK you installed).
2. On your computer run:
   ```bash
   npx expo start
   ```
3. **Open the project in Expo Go only:**
   - On a physical device: scan the QR code with the **Expo Go** app (install from Play Store if needed).
   - On an emulator: press `a` in the terminal to open in the Android emulator; use an image that has **Expo Go** installed, or install Expo Go in the emulator and open the project from there.

Do **not** open the old “LifeOS” standalone APK. Use only **Expo Go** to load the project from the dev server.

## Web (laptop / browser)

You can run the app in the browser and use it on your laptop:

```bash
npx expo start --web
```

Or run `npm run web`. Then open the URL shown in the terminal (e.g. http://localhost:8081) in Chrome, Edge, or Safari. The app is responsive and centered on large screens (max width 1024px). Notifications are disabled on web.

## New standalone APK (preview/production)

When you need a new installable APK:

1. Run a fresh EAS build (e.g. `eas build --platform android --profile preview`).
2. Install the **new** APK from that build. Old APKs built before updates were disabled can still show the error until replaced.
