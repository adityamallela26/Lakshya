# Lakshya — Android App (Capacitor build)

This package wraps your Lakshya web app (Vite + React + TS) in a native Android
shell using Capacitor. The native Android project is already generated and your
latest build of the app is already copied into it — you mainly need Android
Studio to turn it into an installed app / signed APK.

App ID: `com.adityasuresh.lakshya`
App name: `Lakshya`

## What's inside
- `src/`, `index.html`, `vite.config.ts`, etc. — your original AI Studio source, unchanged.
- `dist/` — the production web build (already generated).
- `android/` — the native Android (Gradle/Kotlin) project Capacitor generated.
  Your built web app is already inside it at
  `android/app/src/main/assets/public`, so Android Studio can build it as-is.
- `capacitor.config.ts` — Capacitor's config (app id, app name, web folder).
- `server.ts` — your AI Studio dev server with the Gemini habit-analysis API
  route. **Not used by the Android app** — the frontend doesn't currently call
  it (see note below).

## Option C — No local install, no disk space needed (GitHub Actions)
A workflow file is already included at `.github/workflows/build-apk.yml`. Push
this project to GitHub and it builds the APK in the cloud for you — nothing
installed on your computer.

1. Create a free GitHub account at github.com if you don't have one.
2. Create a new repository (public is fine, and gives unlimited free build
   minutes — call it `lakshya-app` or anything you like). Leave it empty
   (don't add a README).
3. On the new repo's page, click **uploading an existing file**, then drag
   the entire unzipped `Lakshya-Android` folder's contents into the browser
   (this includes the hidden `.github` folder — make sure your file browser
   shows hidden files before dragging, or use `git` if you have it — see
   note below). Commit the upload.
4. Go to the **Actions** tab of your repo. The "Build Android APK" workflow
   should already be running (or click **Run workflow** if it didn't
   trigger automatically).
5. Wait 2–4 minutes for it to finish (green checkmark).
6. Click into the finished run, scroll to **Artifacts**, and download
   `lakshya-debug-apk` — that's a zip containing your `.apk` file.
7. Transfer that `.apk` to your phone (Google Drive, email, USB, WhatsApp to
   yourself, etc.) and tap to install. You may need to allow "install from
   unknown sources" the first time.

Note: this produces a **debug-signed APK** — fully installable and usable on
your own phone, just not signed for Play Store distribution. That's fine for
personal use. If you later want a Play Store-ready signed release build, you
can add signing secrets to this same workflow — ask me and I'll set that up.

If GitHub's web upload won't show your `.github` folder (some OS file
pickers hide dot-folders), the easiest fix is to rename it temporarily to
`github` before uploading, then rename it back to `.github` using GitHub's
web file editor afterward — or just ask me and I'll talk you through it.

## Option A — Fastest: just open it in Android Studio
1. Install Android Studio if you don't have it (it bundles the Android SDK
   and Gradle, which this sandbox doesn't have, so the build couldn't be
   finished here).
2. Unzip this package, then `File → Open` the `android/` folder in Android
   Studio.
3. Let it sync (first sync downloads Gradle + SDK pieces — needs internet,
   give it a few minutes).
4. Plug in your phone (USB debugging on) or use an emulator, then click ▶ Run
   to install and launch the app.
5. To get an installable APK/AAB: `Build → Generate Signed Bundle / APK`,
   create a keystore (first time only — keep it safe, you'll reuse it for
   every future update), and build.

## Option B — If you want to change the app first
If you edit anything in `src/`, rebuild and re-sync before opening Android
Studio:
```bash
npm install
npx vite build          # rebuilds dist/
npx cap sync android    # copies the new build into android/app/src/main/assets/public
```
Then open/refresh the project in Android Studio as in Option A.

## Note on the AI habit-insights backend
`server.ts` exposes `/api/gemini/analyze-habits`, which calls the Gemini API
server-side. The current frontend doesn't call this endpoint yet, so it
doesn't affect the Android build. If you want AI-powered habit insights
inside the Android app later, you'd need to either:
- Deploy `server.ts` somewhere reachable (e.g. Cloud Run) and call that URL
  from the app (the `INTERNET` permission is already in the Android
  manifest), or
- Move the Gemini call client-side using the `@google/genai` SDK (not
  recommended for a public APK — your API key would be exposed inside the
  app).

## Notes
- Min/target Android SDK versions come from Capacitor's defaults; Android
  Studio will prompt you to install whatever's missing on first sync.
- App icon and splash screen are still Capacitor's defaults. If you want
  Lakshya's own icon, drop your artwork into `android/app/src/main/res/`
  (mipmap folders) — happy to generate the full icon set from a logo if you
  want, just share one.
- `node_modules/` is not included to keep the zip small — run `npm install`
  before any rebuild (Option B).
