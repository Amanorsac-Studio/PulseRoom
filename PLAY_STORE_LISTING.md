# Google Play submission pack — PulseRoom

Everything the Play Console asks for, ready to paste. Graphics are in
[`play-assets/`](play-assets/); the `.aab` comes from the GitHub Actions build.

---

## 1. Store listing

**App name** (30 max)

```
PulseRoom
```

**Short description** (80 max)

```
Delay times, reverb, EQ and compression settings — synced to your song's tempo.
```

**Full description** (4000 max)

```
PulseRoom turns your song's tempo into every mixing answer you need.

Producers lose the thread every time they leave the session to look something up: what delay time fits this tempo, where the mud sits on a vocal, what attack keeps a kick punchy. The answers are scattered across ad-heavy calculator sites and half-remembered videos. PulseRoom collects them into one fast, offline app.

TEMPO DETECTION
Pick a song and PulseRoom works out its BPM in seconds. Analysis happens on your device — nothing is uploaded. Or tap the tempo in, type it, or halve and double it with one button.

DELAY CALCULATOR
Every note value in milliseconds at your tempo: straight, dotted and triplet. The eight values producers actually use are shown first, with a note on where each one shines, and the full grid is one tap away. Each card also shows the matching LFO rate in Hz for tremolo, auto-pan and sidechain shaping.

REVERB DESIGNER
Six spaces, from a tight ambience to a cathedral. Pre-delay and decay land on the bar grid so the tail breathes with the song instead of smearing it, and the send-EQ curve is drawn for you — the habit that keeps reverb out of the mud.

EQ CHEAT SHEET
Thirteen sources, from kick and 808 to lead vocal and the mix bus. Boost zones, cut zones and "listen and decide" zones are painted onto a real frequency spectrum, with a plain explanation of what lives in each band.

COMPRESSION SETTINGS
Fourteen sources with ratio, attack, release and target gain reduction — and a drawn gain-reduction envelope showing exactly what the compressor does to a hit at those settings. Attack and release stop being guesswork.

MIX CHAINS
The right plugin order for vocals, drums, bass, guitars, synths, the mix bus and a mastering chain, with the reasoning behind every step.

MIXING GUIDE AND REFERENCE
Gain staging, balance, panning, monitoring and loudness, condensed. Plus the numbers you look up constantly: LUFS targets for every streaming platform, the frequency map, psychoacoustic timing windows, and note-to-frequency values for tuning 808s to the key of the song.

BUILT THE WAY PRODUCERS WORK
• Works completely offline — no account, no sign-up, no ads
• Nothing is collected, tracked or uploaded
• Dark, plugin-style interface designed for late sessions
• Phone and tablet layouts
• Small download, opens instantly

Values in PulseRoom are starting points, not rules. Trust your ears first.
```

---

## 2. Graphics (in `play-assets/`)

| Play Console slot | File | Size |
|---|---|---|
| App icon | `icon-512.png` | 512 × 512 |
| Feature graphic | `feature-graphic-1024x500.png` | 1024 × 500 |
| Phone screenshots (2–8 required) | `phone-1-delay.png` … `phone-6-reference.png` | 540 × 1110 |
| 7-inch tablet screenshots | `tablet7-1-delay.png`, `tablet7-2-eq.png` | 820 × 1180 |
| 10-inch tablet screenshots | `tablet10-1-delay.png`, `tablet10-2-compression.png` | 1180 × 820 |

Regenerate any time with:

```
node_modules\electron\dist\electron.exe scripts/make-play-assets.js
```

---

## 3. Data safety declaration

PulseRoom has no servers, no analytics and no accounts, so every answer is "no".

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data encrypted in transit? | Not applicable — no data leaves the device |
| Do you provide a way for users to request that their data is deleted? | Not applicable — no data is stored off device |

If asked about audio files: the app reads a file the user picks in order to
measure its tempo. The audio is analysed in memory on the device, is never
uploaded, and is not retained. That is processing, not collection.

---

## 4. Content rating questionnaire

Category: **Utility, productivity, communication or other**. Every content
question (violence, sexuality, language, controlled substances, gambling, user
interaction, sharing location) is **No**. The expected result is *Everyone / PEGI 3*.

---

## 5. App content answers

| Section | Answer |
|---|---|
| Privacy policy | URL to the page in section 6 |
| Ads | No ads |
| App access | All functionality is available without restrictions — no login |
| Content rating | See section 4 |
| Target audience | 13+ (avoids the extra Families policy requirements) |
| News app | No |
| COVID-19 apps | No |
| Data safety | See section 3 |
| Government app | No |
| Financial features | None |

---

## 6. Privacy policy

Play requires a publicly reachable privacy policy URL for every app.
`play-assets/privacy-policy.html` is written and ready — upload it to your site
(for example `https://amanorsac.studio/pulseroom-privacy`) and paste that URL
into the Play Console.

---

## 7. Category and contact

| Field | Value |
|---|---|
| App category | Music & Audio |
| Tags | Music production, Audio tools |
| Contact email | amanorsac@gmail.com (or a support address you prefer) |
| Website | https://amanorsac.studio/pulseroom |

---

## 8. Release steps

1. Download the **PulseRoom-Android** artifact from the newest Actions run and unzip it.
2. Play Console → **Testing → Internal testing → Create new release**.
3. Upload `PulseRoom-<version>-Android.aab`.
4. Add release notes, save, review, and roll out to internal testing.
5. Install on your own device from the internal-testing link and check the app end to end.
6. When it looks right, promote the same release to **Production**.

Starting in internal testing is worth it: the build is live for your testers in
minutes without waiting for a full review, and promoting later reuses the exact
build you tested.

**One account check:** developer accounts registered as *personal* (rather than
an organisation) must run a closed test with at least 12 testers for 14 days
before they can publish to production. Organisation accounts are exempt. Check
which type Amanorsac Studio is registered as before planning the launch date.

---

## 9. Release notes (first release)

```
First release.

• Detect a song's tempo on device, or tap it in
• Delay times for every note value, including dotted and triplet
• Reverb pre-delay and decay that land on the bar grid, with send-EQ curves
• EQ zones for 13 instruments and compression settings for 14 sources
• Mix chains, a condensed mixing guide, and LUFS and frequency references

Works offline. No account, no ads, nothing collected.
```
