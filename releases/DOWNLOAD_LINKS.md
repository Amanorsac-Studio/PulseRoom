# PulseRoom 1.0.0 — official downloads

All installers are built by GitHub Actions and published on the GitHub Release page:
**https://github.com/amanorsac/PulseRoom/releases/tag/v1.0.0**

Direct links (stable, public — use these on your website):

| Platform | File | Link |
|---|---|---|
| Windows | `PulseRoom.Setup.1.0.0.exe` (82 MB) | https://github.com/amanorsac/PulseRoom/releases/download/v1.0.0/PulseRoom.Setup.1.0.0.exe |
| macOS (universal: Intel + Apple Silicon) | `PulseRoom-1.0.0-universal.dmg` (179 MB) | https://github.com/amanorsac/PulseRoom/releases/download/v1.0.0/PulseRoom-1.0.0-universal.dmg |
| Android | `PulseRoom-1.0.0-Android.apk` (5 MB) | https://github.com/amanorsac/PulseRoom/releases/download/v1.0.0/PulseRoom-1.0.0-Android.apk |
| iOS (unsigned — not user-installable) | `PulseRoom-1.0.0-iOS-unsigned.ipa` | https://github.com/amanorsac/PulseRoom/releases/download/v1.0.0/PulseRoom-1.0.0-iOS-unsigned.ipa |

## Notes for the download page

- **Windows:** unsigned — SmartScreen may say "Windows protected your PC" → *More info → Run anyway*.
- **macOS:** unsigned — first launch: *right-click the app → Open*.
- **Android:** debug-signed APK — Android asks to allow installs from this source once. (Google Play submission requires a release keystore.)
- **iOS:** Apple does not permit installing apps from websites. The .ipa exists to prove the project builds; real distribution needs an Apple Developer account ($99/yr), then TestFlight / App Store via Xcode.

## Shipping a new version

1. Bump `"version"` in `package.json` and the `1.0.0` file names in `.github/workflows/build-installers.yml`.
2. Commit, then: `git tag v1.0.1 && git push origin main v1.0.1`
3. GitHub builds all four platforms and publishes a new Release automatically.
