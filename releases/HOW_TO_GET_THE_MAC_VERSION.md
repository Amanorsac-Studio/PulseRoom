# Getting the official macOS version

macOS installers (.dmg) can only be built on a Mac — that's an Apple restriction, not a project one. Two ways to get it:

## Option A — GitHub Actions (no Mac needed, recommended)

1. Push this project to a GitHub repository.
2. Go to the repo's **Actions** tab → **Build installers** → **Run workflow**
   (the workflow file already exists at `.github/workflows/build-installers.yml`).
3. Wait ~5 minutes. Download the **PulseRoom-macOS** artifact (the .dmg) and the freshly built **PulseRoom-Windows** artifact.

Free for public repositories; private repos get generous free minutes.

## Option B — Any Mac

1. Copy `PulseRoom-source-1.0.0.zip` (in this folder) to the Mac and unzip it to a path **without special characters** (e.g. `~/PulseRoom`).
2. In Terminal:
   ```
   cd ~/PulseRoom
   npm install
   npm run dist:mac
   ```
3. The installer appears at `dist/PulseRoom-1.0.0.dmg`.

## Signing note (applies to both platforms)

These builds are **unsigned**:
- **Windows:** SmartScreen may show "Windows protected your PC" — users click *More info → Run anyway*. Removing that requires a code-signing certificate (~$100-400/yr, or Azure Trusted Signing).
- **macOS:** Gatekeeper will block the first open — users **right-click the app → Open** once. Removing that requires an Apple Developer account ($99/yr) plus notarization.

Unsigned is normal for free indie tools at launch; mention the workaround on your download page.
