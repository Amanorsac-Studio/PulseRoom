# PulseRoom

A desktop toolkit for music producers: tempo-synced reverb and delay calculators plus EQ, compression, mix-chain and mixing-guide references. Runs on Windows and macOS (Electron).

## What's inside

| Module | What it does |
|---|---|
| **Ask** | 707 answered mixing questions, searchable offline. Ask it "why does my 808 disappear on phones" or "how do I make my kick punchier" and get a one-line answer, numbered steps, the parameters to copy, an animated visual and the reasoning. Covers 29 sources across Gospel, Afrobeats, Hip-hop/Trap, R&B and Highlife. Answers that prescribe a note value or a reverb style link straight into the two calculators. |
| **Delay Calculator** | Every note value (1/1 to 1/64, straight / dotted / triplet) in ms and Hz at your project tempo. Click any card to copy the value. |
| **Reverb Designer** | Pick a space (ambience, room, chamber, plate, hall, cathedral) and get tempo-synced pre-delay, decay and total time, plus suggested low-cut / high-cut / mix settings. |
| **EQ Cheat Sheet** | Boost / cut zones for 13 sources (kick, snare, bass, 808, vocals, guitars, keys, mix bus...) on a visual spectrum. |
| **Compression** | Ratio, attack, release and gain-reduction starting points for 14 sources, with the reasoning. |
| **Mix Chains** | Proven plugin-order chains per source, from lead vocal to the mastering chain, each with a "why this order" explanation. |
| **Mixing Guide** | Gain staging, balance, EQ and compression philosophy, space, panning, references, loudness. |
| **Reference** | LUFS targets per platform, the frequency map, psychoacoustic timing windows, and note-to-frequency for tuning 808s. |

The tempo bar at the top is global: type a BPM, use the arrows, hit **TAP** (or press `T`) to tap the tempo — or click **DETECT** / drag an audio file (mp3, wav, flac, m4a…) anywhere into the window and PulseRoom analyzes the track and sets the tempo for you. Detection runs fully offline via the Web Audio API. Delay and reverb pages update live.

## Run it

```
npm install
npm start
```

On Windows you can also double-click `Start PulseRoom.bat`.

## Build installers

```
npm run dist:win   # Windows installer (run on Windows)
npm run dist:mac   # macOS .dmg (must be run on a Mac)
```

Official downloads for all platforms are published on the [GitHub Releases page](https://github.com/amanorsac/PulseRoom/releases) on every version tag (see `releases/DOWNLOAD_LINKS.md`). Local copies live in `releases/` (see `releases/HOW_TO_GET_THE_MAC_VERSION.md` for the macOS build paths — a Mac or the included GitHub Actions workflow at `.github/workflows/build-installers.yml` is required for the .dmg).

The build scripts call `electron-builder` and the Capacitor CLI through `node` directly, because the shell shims resolve the wrong path from a directory containing an `&`. If another tool trips over it, copy the project to a folder without special characters (e.g. `C:\PulseRoom`) and build from there.

## Mobile (Android & iOS)

The same app ships to phones via [Capacitor](https://capacitorjs.com). Native projects are generated in CI (not committed):

- **Android APK** — built by the `android` job in `.github/workflows/build-installers.yml` (artifact `PulseRoom-Android`). Users install it directly ("allow unknown sources"); Play Store submission needs a release keystore.
- **iOS** — the `ios` job builds an unsigned archive (artifact `PulseRoom-iOS-unsigned`) proving the project compiles. Apple does not allow installing apps from websites: shipping to users requires an Apple Developer account ($99/yr) and TestFlight / App Store via Xcode.

Local commands: `npm run build:www` copies the app into `www/`; `npx cap add android|ios` then `npm run cap:android|cap:ios` to sync.

## Tech

Plain HTML / CSS / JavaScript inside Electron. No build step, no frameworks, fully offline.

The Ask corpus lives in `v2/data/` as reviewed JSON, one file per batch. `node v2/validate.js` checks the schema and every cross-reference; `node scripts/build-answers.js` bundles the lot into `answers.js` as a plain global, because a `file://` page under `script-src 'self'` cannot fetch JSON. `node v2/build-question-bank.js` regenerates the backlog index and `v2/QUESTION_BANK.md`. Read-aloud uses the Web Speech API, so no audio ships.
