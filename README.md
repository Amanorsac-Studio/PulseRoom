# PulseRoom

A desktop toolkit for music producers: tempo-synced reverb and delay calculators plus EQ, compression, mix-chain and mixing-guide references. Runs on Windows and macOS (Electron).

## What's inside

| Module | What it does |
|---|---|
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

Note: if a build tool complains about the `&` in this folder's path, copy the project to a folder without special characters (e.g. `C:\PulseRoom`) and build from there.

## Tech

Plain HTML / CSS / JavaScript inside Electron. No build step, no frameworks, fully offline.
