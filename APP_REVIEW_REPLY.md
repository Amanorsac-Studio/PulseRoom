# App Review — reply for Guideline 2.1 (Information Needed)

Submission ID: 2bf80715-fd39-4f20-bc94-3ecf730adda1 · Build 1.0 (24)

Apple asks for six things. Items 2–6 are written out below and can be pasted
verbatim, both as a reply in App Store Connect **and** into the **App Review
Information → Notes** field. Item 1 (a screen recording on a physical device)
has to be captured by you — instructions are at the end.

---

## Paste this as the reply, and into the Notes field

```
Thank you for reviewing PulseRoom. The information requested is below.

1. SCREEN RECORDING
A screen recording captured on a physical iPhone running the latest iOS is
attached to this reply. It begins with launching the app and shows the typical
user flow through every screen. PulseRoom has no account registration, no login,
no account deletion, no user-generated content and no paid content or features,
so none of those flows appear.

2. PURPOSE AND TARGET AUDIENCE
PulseRoom is an offline reference tool for music producers and home-studio
engineers.

Problem it solves: when mixing a song, producers constantly need values that
depend on the song's tempo or on the instrument being processed — what delay
time fits the tempo, how long a reverb tail should be, which frequencies to cut
on a vocal, what compressor attack and release to start from. These answers are
normally scattered across advertising-supported calculator websites, PDF cheat
sheets and video tutorials, which means leaving the recording session to look
them up.

Value it provides: PulseRoom collects those references into one app that works
entirely offline. The user enters, taps, or detects the song's tempo once, and
the app converts it into delay times in milliseconds, reverb pre-delay and decay
times, and matching LFO rates. It also contains static reference material:
equalisation frequency ranges for 13 instruments, compression starting points
for 14 sources, recommended plugin ordering, a condensed mixing guide, and
loudness targets for streaming platforms.

Target audience: music producers, mixing engineers, and audio-production
students, aged 16 and above. It is a professional utility, not a game or a
social app.

3. SETTING UP AND ACCESSING THE MAIN FEATURES
No setup, account, login or credentials are required. Every feature is available
immediately when the app launches. There is no paid content and nothing is
locked.

How to exercise each screen:

- Delay Calculator (opens by default): type a tempo into the BPM field at the
  top, or press TAP four times in rhythm, or press the 1/2x or 2x buttons. All
  delay values on screen recalculate immediately. Tapping any card copies that
  value to the clipboard and shows a confirmation.

- Tempo detection (optional feature): press DETECT in the top bar and choose an
  audio file. A test file is available here if the review device has no music
  on it:
  https://amanorsac-studio.github.io/PulseRoom-App/pulseroom-test-128bpm.wav
  Download it in Safari on the device (it saves to the Files app), then press
  DETECT, choose Browse, and select it. The app analyses the audio on the device
  and sets the tempo to 128 BPM. Nothing is uploaded; the file is read only to
  measure its tempo.
  This feature is entirely optional — the rest of the app works without it.

- Reverb Designer: select any of the six spaces in the list to see pre-delay,
  decay and total time recalculated for the current tempo.

- EQ Cheat Sheet, Compression, Mix Chains: select any instrument or source
  button to display the corresponding reference information.

- Mixing Guide and Reference: static text and tables; tap a heading to expand.

4. EXTERNAL SERVICES, TOOLS AND PLATFORMS
None. PulseRoom makes no network requests of any kind and requires no internet
connection to function.

Specifically, the app contains:
- no data providers or external APIs
- no authentication or account services
- no payment processors or in-app purchases
- no artificial-intelligence or machine-learning services
- no analytics, crash-reporting, advertising or tracking SDKs
- no third-party content delivered at runtime

All calculations are performed on the device in local code. Tempo detection uses
Apple's own Web Audio implementation in WKWebView to analyse a file the user
selects; the audio never leaves the device and is not stored. The app is built
with Capacitor, an open-source framework that wraps local HTML, CSS and
JavaScript in a native iOS shell. All of that code is written by the developer
and bundled in the app; nothing is loaded from a remote server.

5. REGIONAL DIFFERENCES
There are none. The app behaves identically in every region. There is no
region-locked content, no geographic restriction, no location detection and no
localisation — the interface is English only. No feature depends on the user's
country or network.

6. REGULATED INDUSTRY OR PROTECTED THIRD-PARTY MATERIAL
Not applicable. PulseRoom does not operate in a regulated industry and contains
no protected third-party material.

All content in the app — the interface, the icon and graphics, and the written
reference material about equalisation, compression and mixing practice — was
created by the developer, Stephen Amanor Sackey. The reference values are
general audio-engineering knowledge, presented as suggested starting points,
and the app states that the user should rely on their own judgement. No
copyrighted text, audio, samples or trademarks belonging to others are included.

PulseRoom does not handle health, financial, legal or personal data of any kind.

Please let us know if any further information would help.
```

---

## Item 1 — the screen recording (you must do this)

Apple requires it to be captured on a **physical device**, not a simulator.

**Get the app onto your iPhone or iPad**

1. Install **TestFlight** from the App Store on the device.
2. In App Store Connect → TestFlight → Internal Testing, add your own Apple ID
   as a tester, then open the invitation on the device.
3. Install PulseRoom 1.0 (24) from TestFlight.

**Record**

1. Add the screen recorder to Control Centre if it is not there:
   Settings → Control Centre → add **Screen Recording**.
2. Swipe down from the top-right corner, press the record button, wait for the
   countdown, then go to the Home Screen.
3. **Start the recording from the Home Screen and tap the PulseRoom icon** —
   Apple asks that the recording begins with launching the app.

**Show this sequence (about 60–90 seconds is plenty)**

1. The app opening on the Delay Calculator.
2. Type a tempo, for example 140, and let the values visibly change.
3. Press TAP four times in rhythm.
4. Press 1/2x and then 2x.
5. Tap a delay card so the "Copied" confirmation appears.
6. Press DETECT, choose the downloaded test file, and let it set 128 BPM.
   (If you have not downloaded the file, skip this and mention it in the reply.)
7. Visit each remaining page: Reverb Designer (select two different spaces),
   EQ Cheat Sheet (select two instruments), Compression (select two sources),
   Mix Chains, Mixing Guide (expand a section), Reference (scroll).
8. Stop the recording.

**Send it**

The video saves to Photos. In App Store Connect open the rejection message,
press **Reply**, paste the text above, and attach the recording. Apple accepts
attachments up to 500 MB; a 90-second recording is far smaller.

---

## Why this happened

This rejection is not about the app's quality or a defect in the build. Guideline
2.1 "Information Needed" is routinely applied to the first submission from a
developer account with little review history. Providing the description and the
recording usually resolves it on the next pass.

Two details in the message worth noting for the future:

- Apple points out that App Store screenshots must show the app in use rather
  than title art or a splash screen. The screenshots already uploaded show real
  app screens, so no change is needed.
- Adding this same text to the **App Review Information → Notes** field means
  future submissions carry the explanation automatically.
