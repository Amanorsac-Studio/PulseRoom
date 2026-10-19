# Ask: rendered voice in Nene's cloned voice

Design spec, 2026-10-19. Status: awaiting review.

## What this is for

The Ask page can already read an answer aloud, using whatever text-to-speech
the operating system provides. On Windows that is Microsoft David, a SAPI5
voice from the Windows 7 era, because Chromium cannot see the newer Windows 11
neural voices at all. The result sounds like a screen reader reading a manual.

PulseRoom is a $19 tool from a named studio. The answers are opinionated and
written in a specific voice, and the person whose opinions they are has a
recording studio. This replaces the system voice with his.

Success looks like: a producer with their hands on the faders taps play, hears
Nene tell them what to do, and never thinks about the fact that it was
synthesised.

## What was decided before this spec, and on what evidence

**Ship rendered audio, not a model that synthesises at runtime.** A runtime
model is larger than the audio it would produce: Kokoro 82M quantised is
86-92 MB plus 10-25 MB of onnxruntime, against 44 MB for rendering every line
in the corpus. It also cannot work here. The app's own Electron runtime
refuses `WebAssembly.instantiate` under `script-src 'self'`, and
`crossOriginIsolated` is `false` on `file://` with no way to set the COOP/COEP
headers that would change it, so onnxruntime would be limited to a single
thread. Measured, not assumed.

**Render on rented hardware, not locally.** The target machine is a 12th Gen
i5-1235U with Intel Iris Xe graphics and no CUDA. VoiceBox reports
`gpu_available: false` and runs its PyTorch backend on CPU. The cleanest
measurement taken - `chatterbox_turbo`, model warm, nothing else in the queue -
produced 10.8 seconds of audio in 411 seconds of compute. That is an RTF of
38, which puts the full corpus at 239 hours. Ten days.

**Use Nene's cloned voice, not a stock one.** The Amanorsac profile is built
from 22 reference samples totalling 6.2 minutes, cut from an 8-minute studio
recording, each under VoiceBox's 30-second server-side sample limit and each
paired with text verified to match its audio.

## Scope

Render all 4,788 spoken lines across 707 answers: the one-line verdict
(`short`), every numbered step, and the `watch` warning. 6.3 hours of speech,
44 MB at 16 kbps Opus.

See **Open decision 1** - there is a strong case for rendering only `short` and
`watch`, which is 1,414 lines and 16 MB. The full render is specified here
because that is what was asked for.

Out of scope: any change to answer text, the search engine, the visuals, or
the calculators.

## Architecture

Five units, each independently testable.

### 1. `voice-text.js` - the normaliser

A pure function, `speakable(text) -> text`, shared by the renderer and the
app. This is the only part that both the build pipeline and the shipped
product use, so it lives in the project root beside `answers.js` and loads the
same way: a plain script defining a global, because a `file://` page under
`script-src 'self'` cannot import a module or fetch JSON.

It exists because the corpus is unusually notation-dense. Across the 4,788
spoken lines:

| Pattern | Count | Read raw as |
|---|---|---|
| ranges like `30–40` | 1,334 | "thirty forty" |
| `dB` | 737 | "dee bee" |
| `Hz` | 679 | "huzz" |
| `kHz` | 522 | "kay huzz" |
| ratios like `4:1` | 137 | a clock time |
| `ms` | 103 | "mss" |
| `808` | 96 | "eight hundred eight" |
| minus sign `−` | 74 | skipped |

One line in every 3.6 contains a range. The on-screen text is never touched -
`30–40 Hz` is correct typography and stays. Only the string handed to a speech
engine is rewritten.

The same function serves the OS-voice fallback, so a device that never
downloads the audio still gets "thirty to forty hertz" instead of "thirty
forty huzz". This is why it is one shared unit and not two copies.

### 2. `scripts/render-voice.js` - the render loop

Runs on the rented box against VoiceBox's REST API at `127.0.0.1:17493`.

```
POST /generate    { text, profile_id, language, engine, seed }
GET  /history/{id}      poll until status === "completed"
GET  /audio/{id}        fetch the wav
```

VoiceBox processes a serial queue, so throughput is one line at a time and the
whole job is bounded by RTF. A fixed `seed` is passed on every call so prosody
and energy stay consistent across 4,788 independent generations - without it
the clone drifts between lines and the result sounds like 707 different takes.

The loop is **resumable**. A manifest at `voice-build/manifest.json` records
`{id, line_type, index, text, status, wav, seconds}` per line, written after
each completion. Re-running skips anything already `completed`. A 4,788-item
job on rented hardware will be interrupted, and restarting from zero is not
acceptable.

Failures retry three times, then mark `failed` and continue. The run ends with
a report of what failed so it can be re-driven rather than silently shipping
gaps.

### 3. `scripts/pack-voice.js` - encode and index

Takes the rendered wavs and produces what ships.

- Loudness-normalise to −16 LUFS, two-pass `loudnorm`, so no answer is
  noticeably louder than another.
- Trim leading and trailing silence to under 200 ms.
- Encode Opus, 16 kbps mono at 24 kHz.
- **Concatenate per answer, not per line.** One file per answer id -
  `voice/kick-punchier.opus` - containing that answer's lines in order, with a
  timing index giving each line's start and duration.

The concatenation matters for packaging. 4,788 individual files slow Android
asset builds and bloat the asar index; 707 files at roughly 62 KB each do not.
Playback seeks to an offset rather than loading a separate file per line.

The index is `voice/index.json`:

```json
{ "kick-punchier": { "d": 41.2,
    "l": [["short",0,4.1],["step",4.3,6.0],["step",10.5,5.2],["watch",35.8,5.4]] } }
```

### 4. `voice.js` - playback in the app

Replaces the `speak()` function in `ask.js` section 3. Given an answer and a
line index it plays from that answer's file at the indexed offset, advancing
through lines, driving the existing waveform and the current-step highlight
from real playback position rather than a CSS loop.

**Falls back to `speechSynthesis` whenever the audio is unavailable** - file
missing, decode error, index entry absent, or the platform did not ship the
pack. The fallback path uses `speakable()` so it is still intelligible. The
feature degrades to exactly today's behaviour rather than breaking.

### 5. Packaging

- **Electron**: `voice/**/*` added to `build.files` in `package.json`.
- **Capacitor**: `voice` added to `ASSET_DIRS` in `build-www.js`, which already
  copies directories and already fails the build when the page references a
  file it does not copy.

Both manifests have been wrong before - `ask.js`, `ask.css` and `answers.js`
were missing from them and would have shipped an app with no Ask page - so the
existing guard in `build-www.js` is extended to check the voice index too.

## Delivery

Bundled on every platform. No download, no hosting, no network call. The app's
claim to work entirely offline is a real feature and simplifies store review;
adding a first-run download would cost `connect-src` in the CSP, a hosting
bill, and that claim.

Desktop installer goes from 78 MB to roughly 122 MB. Mobile bundle goes from
1.2 MB to roughly 45 MB.

That mobile number is the uncomfortable one, and it is the subject of the open
decision below.

## Testing

**`speakable()`** is a pure function and gets real tests with `node:test` -
zero dependencies, nothing added to the app. Cases: every pattern in the table
above, plus the ones that bite, such as `1 dB` becoming "1 decibel" and not
"1 decibels", and `−4 dB @ 140 Hz` surviving intact. It is then run across all
4,788 lines to check for double substitution and the output is sampled by eye.

**The render** is verified by sampling: 40 random lines re-listened against
their text, plus a mechanical pass checking every file for plausible duration
against its character count. The speech-rate check already caught five
misaligned reference chunks during clone preparation; the same technique
catches a truncated or silent render.

**Playback** is verified in the running app on desktop and at 375 px: correct
line, correct offset, waveform tracking real position, and the fallback
exercised by deliberately removing the index.

## Cost and time

| | |
|---|---|
| GPU box | L4 or A10, roughly $0.50-1.00/hour |
| Expected render | under 1 hour at GPU RTF of 0.1-0.3 |
| Expected spend | $1-3 including setup and a re-run |
| Render count | 3-5, because the first will have pronunciation errors |

The iteration count is the real cost. The plan is to render 50 of the
nastiest lines first, listen, fix the normaliser, repeat - then do the full
run once. Renting for the sample passes is unnecessary; they are 50 lines and
can be done locally overnight if needed.

## Open decisions

**1. Full render, or `short` + `watch` only?**

Specified above as the full 4,788 lines because that is the instruction. The
case for the smaller set is strong enough that it should be an explicit choice
rather than a default:

| | lines | size | mobile bundle |
|---|---|---|---|
| everything | 4,788 | 44 MB | ~45 MB |
| `short` + `watch` | 1,414 | 16 MB | ~17 MB |

PulseRoom is priced for a market where mobile data is a real cost, and the
current mobile bundle is 1.2 MB. The one-line verdict and the warning are
where a human voice earns its place; "high-pass at eighty hertz, bell plus
1.5 dB at two hundred and ten" is arguably clearer read flatly. It also cuts
render time and cost by about two thirds.

Recommendation: `short` + `watch`. The architecture is identical either way -
only the line filter in the render loop changes - so this can be decided after
the sample renders are heard.

**2. The 23rd sample.**

The Amanorsac profile still carries the original 30-second recording, whose
stored transcript reads "This is me recording my voice for avoidance clone" -
an ASR mishearing of "a voice clone". Its text does not match its audio, which
is exactly the condition the other 22 were carefully built to avoid.

Recommendation: delete it. Requires confirmation, as it is destructive and it
is Nene's recording.

**3. Was the source recording processed?**

The reference audio came off a Studio One mixdown bus at 320 kbps stereo. If
master-bus EQ or compression was printed on it, the clone has learned that
colour and every rendered line carries it. Unanswered. It does not block the
render, but it determines whether the output needs corrective EQ or a
re-record before the full run.

## Risks

**The clone drifts across 4,788 generations.** Mitigated by a fixed seed and
by loudness normalisation, but not eliminated. The sample render is where this
shows up; if it does, the fallback is to render in larger multi-line passes so
prosody carries across sentences.

**VoiceBox is a moving target.** Version 1 of this pipeline pins whatever
version is used on the box, because an engine change mid-render would make the
second half sound different from the first.

**Opus at 16 kbps may be too aggressive for a male voice with low
fundamentals.** Verified during the sample pass by comparing 16, 24 and 32
kbps on the same line. 24 kbps costs 22 MB more for the full set and is the
fallback if 16 sounds swirly.

## What this does not change

The OS-voice path stays in the code permanently. It is the fallback, it is
what runs before a download completes if delivery ever changes, and it is what
a platform without the pack uses. It gets the normaliser, which is an
improvement to the current behaviour regardless of whether a single audio file
ever ships.
