# PulseRoom 2.0 — Assets

What to generate, what to download, what must stay as code, and what to record.

---

## 1. The one thing not to generate: the EQ curves

Generated images are the right tool for atmosphere and the wrong tool for the
visuals. Three reasons, in order of how much they would hurt:

**They cannot be driven by the answer.** The whole point of the Answer screen
is that the curve is drawn *from* `params.eq`. Change the entry from +2 dB at
210 Hz to +3 dB at 180 Hz and the picture changes with it. A generated image
is one fixed picture, so we would need 693 of them and every correction to a
number would mean re-generating art.

**They cannot animate the way you want.** You said you do not want it to feel
like a still picture — agreed, and that is exactly the problem. A raster image
can be faded, slid or parallaxed, but it cannot *morph from flat into the
move*, which is the animation that teaches. The curve in the prototype
genuinely redraws itself along the filter response. You cannot get that from a
PNG, and a video file of it would be enormous across 693 answers.

**An image model will draw audio wrong.** It does not know that a high-pass is
−12 dB/octave, that 210 Hz sits a third of the way along a log axis, or that a
compressor's release is longer than its attack. Producers will see it
immediately, and in an app they are paying for, a wrong-looking curve is worse
than no curve.

So the EQ curves, compression envelopes, masking plots, delay grids and chain
diagrams all stay as code-drawn SVG. What I owe you there is that they look
*much* better than v1 — which is the work I'll do next, and which you can
already see the direction of in the prototype.

---

## 2. What generated imagery IS right for

Atmosphere, where accuracy is not the job. These are worth generating:

| Asset | Count | Where it appears |
|---|---|---|
| Genre playbook covers | 10 | Behind the title on each playbook card and header |
| Unlock screen backdrop | 1 | Behind the Pro paywall |
| Onboarding backdrops | 3 | First-run screens |
| Store feature graphic backdrop | 2 | Play feature graphic, App Store marketing |
| Empty-state texture | 1 | Behind "no exact match" |

### The style block — append this to every prompt

Consistency across a set is the hard part. Paste this at the end of *every*
image prompt so the ten covers look like one family:

> Dark, cinematic, photographic. Near-black background (#0A0B0E), deep shadow,
> a single cool teal light source from the upper right. Heavy negative space in
> the lower left third. Shallow depth of field, soft film grain, no lens flare.
> Muted, desaturated colour. No text, no letters, no numbers, no logos, no
> watermarks, no user interface, no faces. Square 1:1 composition with the
> subject off-centre to the right.

**Hard rules for every prompt:** no text or numbers anywhere (models always
spell studio gear wrong), no faces, no readable plugin interfaces, no
waveforms or EQ curves. The subject should be *objects and light*, not
information.

### The ten playbook prompts

Append the style block to each.

1. **Gospel — Traditional**
   > A vintage Hammond organ drawbar panel and a worn wooden Leslie cabinet in a
   > dim empty church sanctuary, dust in a single shaft of light, brass pedal
   > rail catching the highlight.

2. **Gospel — Contemporary**
   > A modern stage in darkness after a service: in-ear monitor packs coiled on a
   > riser, a closed keyboard case, cables taped to the floor, one cool spotlight
   > still on.

3. **Gospel — Praise & Worship**
   > An acoustic guitar leaning against a bare wooden stool in a large empty room,
   > early morning light through a high window, a folded lyric sheet on the floor.

4. **Gospel — African**
   > A hand-carved talking drum and a beaded shekere resting on a woven cloth,
   > deep shadow, cool rim light along the drum's leather lacing.

5. **Gospel — Trap**
   > A sub-bass cabinet in a dark concrete room, grille cloth texture in extreme
   > close-up, a faint teal glow behind it, condensation on the metal edge.

6. **Gospel — Urban**
   > A Rhodes electric piano with the lid off, tines and hammers visible in
   > shallow focus, dark studio, a single cool light across the harp.

7. **Afrobeats**
   > Layered hand percussion — congas, a gourd shaker, a cowbell — stacked in a
   > dark room, warm wood against cool teal light, tight overhead crop.

8. **Hip-hop & Trap**
   > A large-diaphragm condenser microphone behind a dark mesh pop filter in an
   > unlit vocal booth, foam panels barely visible, deep shadow, cool highlight on
   > the grille.

9. **R&B**
   > Dark velvet studio curtains and a single vintage ribbon microphone, very
   > shallow depth of field, warm amber bleeding into cool teal shadow.

10. **Highlife**
    > A hollow-body electric guitar and a brass trumpet bell resting together on a
    > worn studio sofa, late afternoon light, dust, muted colour.

### The other four

11. **Unlock backdrop** (9:16, not square — drop "Square 1:1" from the style block)
    > A mixing console channel strip in extreme close-up, faders at different
    > heights, dark metal and shadow, one cool light raking across the surface.

12. **Onboarding 1 — Ask**
    > An empty studio chair in front of a dark console, overhead light off, the
    > room waiting.

13. **Onboarding 2 — Answer**
    > A notebook of handwritten settings on a console surface, pen resting on it,
    > writing deliberately out of focus and unreadable.

14. **Onboarding 3 — Offline**
    > A pair of studio headphones on a desk in a room with no windows, a single
    > lamp, nothing else.

### What to send me back

PNG or WebP, **2048 × 2048** for the square covers, **1500 × 2668** for the
unlock backdrop. Put them in `v2/assets/covers/` named by playbook id —
`gospel-trad.png`, `gospel-contemporary.png`, `gospel-worship.png`,
`gospel-african.png`, `gospel-trap.png`, `gospel-urban.png`, `afrobeats.png`,
`hiphop.png`, `rnb.png`, `highlife.png` — and `v2/assets/unlock.png`,
`v2/assets/onboarding-1.png` and so on. I'll compress, crop and tint them to
the palette so the set matches even if the generations drift.

---

## 3. Assets to download rather than generate

**Type.** The app is offline, so fonts get bundled, not linked — which means
licensing matters. Safe and free for commercial bundling:

- **Satoshi** or **General Sans** — fontshare.com, free for commercial use
  including app embedding. Either works as a display face if you want PulseRoom
  to stop looking like every other iOS app.
- **JetBrains Mono** — SIL Open Font License. This is what numbers should be
  set in; parameters have to line up vertically.
- Do **not** bundle anything from Google Fonts without checking — most are OFL
  and fine, but a few are not.

Right now the prototype uses the system face, which gives you SF Pro on iPhone
and Mac free. That is genuinely a good default. Bundling Satoshi is a
preference, not a need — tell me which you want.

**Icons.** Phosphor Icons (MIT) or Lucide (ISC), both free for commercial use.
I am currently drawing them inline as SVG, which is lighter and keeps the
stroke weight consistent. No download needed unless you want a specific set.

**Texture and grain.** Generated in the app with SVG filters — no file, no
weight, no licence. Already working in the prototype.

So the only thing you actually need to source is the fourteen images above.

---

## 4. Voice

I don't know VoiceBox specifically, so take the spec below as tool-agnostic —
it applies to whatever locally generates the audio.

**The arithmetic decides what gets recorded.** At 24 kbps mono Opus, speech is
about 3 KB per second:

| What is voiced | Length each | 693 answers |
|---|---|---|
| `short` only | ~10 s | ~21 MB |
| `short` + `watch` | ~18 s | ~37 MB |
| Everything including steps | ~45 s | ~94 MB |

The last row is too heavy — it roughly doubles the download for content the OS
can already speak. **The recommendation is row two:** record `short` and
`watch` in your voice, and let on-device TTS read the numbered steps. That
split is not a compromise, it is the right one — the one-line answer and the
warning are where personality helps, and "high-pass at 80 Hz, bell plus 1.5 dB
at 210" is *clearer* read flatly by the system voice.

**Format:** Opus in `.ogg` at 24 kbps mono, 24 kHz, or AAC `.m4a` at 32 kbps
mono if your tool cannot do Opus. Normalise to −16 LUFS. Trim silence to under
200 ms at both ends.

**Naming:** one file per line, `voice/<question-id>-short.ogg` and
`voice/<question-id>-watch.ogg`. The ids are the ones in
`v2/QUESTION_BANK.md` — `kick-punchier`, `leadvocal-fix-thin`,
`ab-log-drum` and so on.

**What I owe you before you can start:** the script. It is generated from the
answers, and the answers are the next batch of work. When the first 100 are
written I'll export `v2/voice-script.csv` with columns `id, line_type, text`
so you can batch the whole thing rather than copying lines one at a time.

So: don't start recording yet. Source the images first — those aren't blocked
on anything.

---

## 5. Platforms

One codebase, four layouts. The prototype shows the phone; the others follow
the same system.

| Layout | Width | What changes |
|---|---|---|
| Phone (iOS, Android) | < 768 | Bottom tab bar, one column, sheet for overflow |
| Tablet / iPad | 768–1180 | Two columns: question list left, answer right, no tab bar |
| Desktop (Windows, macOS) | > 1180 | Three columns: source rail, question list, answer. Keyboard-first — type to search from anywhere |
| iPad landscape / wide desktop | > 1600 | Third column becomes the visual, pinned and full height |

The important difference: on the phone you read one answer at a time, on
desktop you keep the list and the answer on screen together and arrow through
them. Same content, genuinely different interaction — not a stretched phone
layout, which is what makes most cross-platform apps feel wrong on desktop.

I'll build the tablet and desktop views of the Ask screen next so you can see
them the same way you saw the phone.
