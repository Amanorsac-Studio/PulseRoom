# PulseRoom — Complete Product Marketing Package

> **Purpose of this document:** everything a designer, copywriter, or another Claude Code instance needs to build a world-class marketing site for PulseRoom without asking a single follow-up question. Grounded in the actual shipped application (v1.0.0, Electron, Windows + macOS).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Positioning](#2-product-positioning)
3. [Elevator Pitch](#3-elevator-pitch)
4. [Feature Inventory](#4-feature-inventory)
5. [User Journey](#5-user-journey)
6. [UI Analysis](#6-ui-analysis)
7. [Screenshot Plan](#7-screenshot-plan)
8. [Animation Plan](#8-animation-plan)
9. [Product Photography Direction](#9-product-photography-direction)
10. [Landing Page Content](#10-landing-page-content)
11. [Visual Style Guide](#11-visual-style-guide)
12. [Competitive Analysis](#12-competitive-analysis)
13. [Assets Needed](#13-assets-needed)
14. [Image Generation Prompts](#14-image-generation-prompts)
15. [Motion Storyboard](#15-motion-storyboard)
16. [Landing Page Structure](#16-landing-page-structure)
17. [Developer Handoff (JSON)](#17-developer-handoff-json)
18. [Final Checklists](#18-final-checklists)

---

## 1. Executive Summary

### What the application is
**PulseRoom** is a desktop toolkit for music producers (Windows + macOS, Electron). It bundles seven modules into one dark, plugin-style workspace: a tempo-synced **Delay Calculator**, a **Reverb Designer** with send-EQ curves, an **EQ Cheat Sheet** for 13 sources, a visual **Compression** reference for 14 sources, **Mix Chains** (plugin-order recipes), a condensed **Mixing Guide**, and a **Reference** page (LUFS targets, frequency map, note-to-Hz tables). One global tempo bar (typed, stepped, or tapped) drives every time-based calculation live.

### Why it exists
Every producer alt-tabs out of their DAW mid-session to Google "delay time calculator," squint at a 2009-era web table full of ads, then digs through bookmarks for an EQ cheat-sheet PDF and a compression settings blog post. The knowledge exists — scattered across ten tabs, none of them beautiful, none of them synced to the session tempo.

### The problem it solves
**Context-switching kills creative flow.** PulseRoom replaces the browser-tab graveyard with one offline, instant, gorgeous reference that thinks in the producer's own units: bars, note values, dB, and Hz — all locked to the song's BPM.

### Who it is for
- Bedroom producers and beatmakers (hip-hop, trap, EDM, pop) who mix their own records
- Home-studio engineers leveling up from presets to intentional decisions
- Producers who learn visually — curves and colors, not paragraphs

### Why it is different
1. **Tempo-native.** Every delay, pre-delay, and decay value recalculates live from the project BPM — tap it in and the whole app follows.
2. **Visual, not tabular.** Reverb send-EQ is drawn as a filter curve; compression is drawn as a gain-reduction envelope; EQ zones are painted onto a log-scale spectrum.
3. **Opinionated, with reasons.** Every number ships with the *why* ("slower attack = punchier"), so the tool teaches while it answers.
4. **Offline and instant.** No ads, no accounts, no loading. It opens faster than a browser tab.

### The emotional value it creates
Confidence and momentum. The moment of doubt ("what decay time fits this tempo?") becomes a two-second glance instead of a five-minute detour. Producers feel like they have a mentor sitting in the second chair — one who answers in their language and never breaks their flow.

### The business value it creates
- **Acquisition wedge:** an eternally-searched query cluster ("delay time calculator," "reverb pre-delay chart," "vocal compression settings") with weak, ugly incumbents.
- **Brand halo:** a free, beautiful desktop tool builds the trust and mailing list that premium products (sample packs, courses, pro tier) monetize later.
- **Retention surface:** a daily-use utility keeps the brand open on-screen during every session.

---

## 2. Product Positioning

| Field | Definition |
|---|---|
| **Mission** | Put every mixing decision one glance away, in the producer's own tempo. |
| **Vision** | Become the default second screen of every home studio — the reference layer between raw knowledge and finished records. |
| **Target market** | The ~50M home-studio musicians worldwide; core: producers aged 16–35 mixing their own music in Ableton, FL Studio, Logic, or Cubase. |
| **Primary users** | Self-taught bedroom producers and beatmakers who mix as they write. |
| **Secondary users** | Mixing students, audio-school instructors (teaching aid), podcast editors borrowing the loudness/EQ references. |
| **USP** | The only desktop app that turns tempo into every time-based mix setting — visually, offline, instantly. |

### Personas

**1. "Trap-first Tyler" (19, FL Studio, primary).** Makes beats nightly, sells on BeatStars. Knows what sounds right but not why. Googles "808 EQ" weekly. Wants answers fast, hates reading. *PulseRoom moment:* taps his tempo, copies the 1/8-dotted value into Delay 2, done in 8 seconds.

**2. "Singer-producer Sam" (27, Logic, primary).** Writes and records vocals at home; mixes are 90% there but muddy. Watches mixing YouTube at 2× speed. *PulseRoom moment:* the Lead Vocal mix chain shows them the de-esser goes *before* the compressor — the mud was sibilance pumping all along.

**3. "Studio-teacher Dana" (41, Cubase, secondary).** Teaches audio production; tired of drawing the same attack/release diagram on the whiteboard. *PulseRoom moment:* projects the gain-reduction envelope in class and switches sources live.

### Brand Personality
The **calm senior engineer**: precise, generous, quietly confident. Never gatekeeps, never over-explains. Speaks in numbers and reasons, not mystique.

### Brand Voice
Direct, technical-but-warm, second person. Verbs first. Zero filler, zero hype-words ("revolutionary," "game-changing" are banned).

### Tone by context
- **Marketing:** confident, rhythmic, a little bold ("Stop Googling delay times.")
- **In-app:** neutral and instructive ("Values are starting points. Trust your ears first.")
- **Docs/support:** patient, plain-spoken.

### Core Values
1. **Flow over friction** — every answer within two clicks.
2. **Teach the why** — numbers always ship with reasons.
3. **Ears above numbers** — the app says so itself, in the sidebar.
4. **Offline is a feature** — no accounts, no telemetry, no ads.

---

## 3. Elevator Pitch

**10-second pitch**
"PulseRoom is a desktop app that turns your song's BPM into every delay, reverb, EQ, and compression setting you need — instantly, visually, offline."

**30-second pitch**
"Producers lose their flow every time they leave the DAW to Google a delay chart or dig up an EQ cheat sheet. PulseRoom puts all of it in one beautiful desktop app: tap your tempo once and get tempo-synced delay times, reverb decay and pre-delay, visual EQ and compression guides for every instrument, plugin-order chains, and loudness targets. It's the mentor in your second monitor — free, offline, Windows and Mac."

**2-minute pitch**
"Every producer knows the moment: the mix is flowing, and then a small question stops everything. What delay time fits 140 BPM? Where do I cut the mud on this vocal? What attack time keeps the kick punchy? The answers exist — spread across ad-choked calculator sites, PDF cheat sheets, and half-remembered YouTube videos. Each lookup costs five minutes and, worse, the creative thread.

PulseRoom collapses that entire reference stack into one desktop app. A global tempo bar — type it, nudge it, or tap it — drives everything: a delay calculator that leads with the eight values producers actually use, a reverb designer that sizes pre-delay and decay to the bar grid and draws the send-EQ curve you should copy, an EQ cheat sheet that paints boost and cut zones for 13 instruments onto a real spectrum, a compression page that animates the gain-reduction envelope for 14 sources, plugin-order chains with the reasoning behind each step, a condensed mixing guide, and every reference table producers look up — LUFS targets per platform, note-to-Hz for tuning 808s.

It's built like a premium audio plugin — dark, color-coded, instant — because producers live in that aesthetic ten hours a day. And it's offline-first: no account, no ads, no spinner. PulseRoom is the wedge into a producer-tools brand: the free daily-use utility that earns the trust everything else builds on."

**Investor pitch**
"Reference lookups are the highest-frequency unmet need in the 50-million-strong home-studio market — 'delay calculator' alone draws six-figure monthly searches onto pages that haven't been redesigned in a decade. PulseRoom captures that intent with a free, beautiful, offline desktop utility that producers open every session, then converts attention into a producer-tools brand: pro presets, education, and team features. Think 'Raycast for music production' — win the daily habit, monetize the ecosystem."

**Website hero statement**
"Your tempo knows every answer. PulseRoom turns one BPM into every delay time, reverb tail, EQ move, and compression setting your mix needs — in one beautiful desktop app."

**App Store description (macOS)**
"PulseRoom is the producer's reference desk: tempo-synced delay and reverb calculators, visual EQ and compression cheat sheets, mix-chain recipes, and a condensed mixing guide — all in one fast, offline, plugin-style app. Tap your tempo once; every value follows. Copy any number with a click and get back to the music. No account. No ads. Just answers."

**Google Play description (future mobile companion)**
"Every mixing answer, one tap away. PulseRoom syncs delay times, reverb decay, and pre-delay to your song's BPM, shows EQ boost/cut zones for 13 instruments, and gives you compression settings you can see. Built by producers, for the moment mid-session when you need a number — not a tutorial. Works fully offline."

---

## 4. Feature Inventory

Priority: **P0** = hero features (lead marketing), **P1** = strong support, **P2** = depth/completeness.

### 4.1 Global Tempo Bar — P0
- **Purpose:** one BPM input (20–300, 0.1 precision) driving every time-based value in the app.
- **User benefit:** set tempo once; delay and reverb pages recalculate live. No per-page re-entry.
- **Technical:** header component with stepper buttons, numeric input, TAP button (averages up to 8 taps, resets after 2.2 s gap, also bound to the `T` key), and live readouts: ms/beat, ms/bar, Hz/beat.
- **Why users care:** it mirrors the DAW's transport — the one number they already know.
- **When used:** first action of every session.
- **Vs. competitors:** web calculators require re-entering BPM per page/tool; nothing else offers tap tempo in a reference app.
- **Screenshot ref:** S2 (tempo bar close-up). **Animation idea:** numerals roll like a hardware counter as BPM changes; TAP button emits a cyan pulse ring on each hit.

### 4.1b Tempo Detect — P0
- **Purpose:** set the project tempo from an actual song instead of typing it.
- **User benefit:** drag any audio file (mp3, wav, flac, m4a…) anywhere onto the window — or click **DETECT** — and PulseRoom analyzes the track offline and sets the BPM, with a confidence rating and a half-time hint for fast tempos.
- **Technical:** Web Audio API pipeline using the standard MIR approach — decode → three-band onset-strength envelope (kick/snare bands weighted above hats) → autocorrelation over 60–200 BPM → harmonic comb scoring with perceptual tempo preference → octave correction against the evidence → parabolic refinement → snap to the integer/half-integer grids modern productions use. Analyzes up to 75 s, skipping quiet intros. No network, no upload.
- **Why users care:** remixing, sampling, or referencing a track whose tempo you don't know is a constant chore; this kills it in one gesture.
- **When used:** start of any remix/flip session; checking a reference track's tempo.
- **Vs. competitors:** online BPM detectors require uploading audio to a server; PulseRoom does it locally in ~2 seconds.
- **Screenshot ref:** drop overlay (dashed cyan "Drop your track" full-screen state). **Animation idea:** waveform ripples across the overlay while analyzing; BPM numerals roll to the detected value.

### 4.2 Delay Calculator — P0
- **Purpose:** convert BPM into delay times for every note value.
- **User benefit:** opens to the **Essentials** view — the 8 values producers actually use (1/2, 1/4, 1/4D, 1/8, 1/8D, 1/8T, 1/16, 1/32), each with a usage note ("the famous U2 rhythm delay"). One toggle reveals all 21 values with straight/dotted/triplet filters.
- **Technical:** ms = (60000/BPM × 4)/division; dotted ×1.5, triplet ×⅔; each card also shows the equivalent LFO rate in Hz; click-to-copy with toast confirmation.
- **Why users care:** copy the exact ms into any delay plugin in seconds; the Hz value doubles for tremolo/auto-pan/sidechain LFOs.
- **When used:** setting up sends; sound design; syncing modulation.
- **Vs. competitors:** web tables dump 30 rows with zero guidance and no copy button; PulseRoom is curated-first, complete-on-demand.
- **Screenshot ref:** S1, S3. **Animation idea:** card values flip-morph as the user drags BPM; copied card flashes its accent border.

### 4.3 Reverb Designer — P0
- **Purpose:** size a reverb to the song instead of guessing.
- **User benefit:** pick one of six spaces (Tight Ambience → Cathedral/Epic); get pre-delay (musical: 1/128–1/32 note), decay, and total time landing exactly on the bar grid, plus a drawn **send-EQ curve** (12 dB/oct low/high cut), decay-envelope visual, and wet-level/diffusion suggestions with a "where it shines" note.
- **Technical:** total = bars × barMs; decay = total − pre-delay; all three values click-to-copy; SVG filter-response curve regenerates per style.
- **Why users care:** tails that end on the grid keep mixes clean; the EQ curve is the pro habit most tutorials never show.
- **When used:** building send buses at session start; rescuing muddy mixes.
- **Vs. competitors:** no mainstream calculator draws the send EQ or explains diffusion; plugin manuals bury it.
- **Screenshot ref:** S4, S5. **Animation idea:** morph between space presets — curve, envelope, and numbers tween together over 400 ms.

### 4.4 EQ Cheat Sheet — P0
- **Purpose:** show where 13 sources live on the spectrum and what to do there.
- **User benefit:** pick an instrument chip (Kick → Full Mix Bus); colored zones — green boost, rose cut, blue "listen & decide" — are painted onto a log-scale 20 Hz–20 kHz spectrum, with band-by-band explanations beneath ("Cardboard: boxy energy lives at 200–400 Hz…").
- **Technical:** SVG regions positioned by log-frequency; per-band cards with color-coded frequency labels; gridlines at standard octave points.
- **Why users care:** it converts abstract advice into a picture their eyes can carry back to the DAW's EQ.
- **When used:** every EQ decision, especially kick/bass carving and vocal cleanup.
- **Vs. competitors:** the classic "EQ cheat sheet" JPEG is unreadable and generic; this is interactive, legible, and per-instrument.
- **Screenshot ref:** S6. **Animation idea:** zones slide/fade to new positions when switching instruments (FLIP transition).

### 4.5 Compression Settings — P0
- **Purpose:** visual compression starting points for 14 sources.
- **User benefit:** pick a source chip; see a **gain-reduction envelope** — a hit lands, GR dives through the shaded attack window, holds at target GR, recovers through the shaded release window — beside four big tiles (ratio, attack, release, GR) and a source-specific pro note.
- **Technical:** SVG envelope scaled to the source's actual ms ranges; attack band tinted amber, release tinted green, curve in rose.
- **Why users care:** attack/release is the most misunderstood concept in mixing; seeing the envelope ends the confusion.
- **When used:** dialing any compressor; teaching moments.
- **Vs. competitors:** blogs give tables; nobody draws the envelope per-source.
- **Screenshot ref:** S7. **Animation idea:** envelope draws itself left-to-right (stroke-dashoffset) each time a source is picked.

### 4.6 Mix Chains — P1
- **Purpose:** correct plugin order for 10 sources, lead vocal → mastering chain.
- **User benefit:** numbered nodes flow left-to-right (HPF → subtractive EQ → de-esser → comp 1 → comp 2 → saturation → tone EQ → sends) with per-step settings and a **"Why this order"** card.
- **Why users care:** order mistakes (de-esser after compressor) cause problems EQ can't fix.
- **When used:** setting up templates; auditing a broken chain.
- **Vs. competitors:** forum answers conflict; this is one opinionated, explained standard.
- **Screenshot ref:** S8. **Animation idea:** nodes cascade in with 40 ms stagger; a signal "pulse" travels the chain on load.

### 4.7 Mixing Guide — P1
- **Purpose:** the habits behind professional mixes, condensed to nine expandable sections (gain staging → common-mistakes checklist).
- **User benefit:** a checklist-dense read-once/refer-forever guide with hard numbers (−18 dBFS average, 3–6 dB bus headroom, mono below 120–150 Hz).
- **Screenshot ref:** S9. **Animation idea:** accordion chevron rotates; body height-animates.

### 4.8 Reference Tables — P1
- **Purpose:** the numbers producers look up constantly.
- **Contents:** LUFS targets per platform (Spotify −14 / Apple −16 / club −7 to −5 / EBU −23); seven-zone frequency map; psychoacoustic timing windows (Haas 1–30 ms, slapback 60–120 ms, echo threshold >35 ms); note-to-Hz grid C0–B4 for tuning 808s.
- **Screenshot ref:** S10. **Animation idea:** counters count up on scroll-into-view (marketing site only).

### 4.9 Quality-of-life details — P2
Click-to-copy everywhere with toast · keyboard tap-tempo (`T`) · reduced-motion support · custom scrollbars · responsive down to a 68 px icon rail · offline, no-account, ~2 MB of app code.

---

## 5. User Journey

### First launch
Double-click → window opens in under two seconds straight onto the Delay Calculator at 120 BPM. No splash, no account wall, no tour. The interface teaches itself: sidebar lists seven clearly-named modules; the tempo bar looks like a DAW transport. First "aha" within 10 seconds: type your BPM, watch every card recalculate.

### Onboarding (implicit)
There is none to skip — the empty-state *is* the product. The sidebar footer sets the philosophy immediately: "Values are starting points. Trust your ears first."

### Daily workflow
1. Open project in DAW → open PulseRoom on second monitor (or Alt-Tab).
2. Tap tempo to match the session (or type it).
3. Delay page: copy 1/4 and 1/8-dotted into send delays.
4. Reverb page: pick Plate for vocals, copy pre-delay + decay, mirror the send-EQ curve.
5. Mid-session: EQ page while carving kick vs. 808; Compression page while dialing the vocal.
6. End of session: Reference page to check the master against −14 LUFS.

### Advanced workflow
Uses the Hz column to set tremolo/auto-pan LFO rates; switches delay view to **All note values** for 1/64 comb-filter sound design; reads Mix Chains' "why" cards to restructure a template; uses note-to-Hz to tune 808s to the song key.

### Power-user workflow
Keeps PulseRoom pinned during client sessions as an explainer: projects the GR envelope to justify attack settings; screenshots the EQ spectrum into session notes; teaches from the Mixing Guide checklist.

### Exit experience
Close the window; the app quits (macOS keeps dock convention). Nothing to save — state is intentionally ephemeral, tempo takes two seconds to restore.

### Return experience
Identical to first launch: instant, familiar, zero friction. The consistency *is* the feature — it always opens faster than the browser tab it replaced.

---

## 6. UI Analysis

**Global frame:** 236 px sidebar + main column (tempo bar header + scrollable content, max-width 1060 px, centered). Window 1280×840 default, 980×660 minimum. Dark-only by design (see §11). Base font 14.5 px system sans (Segoe UI Variable / SF Pro); all numerics in mono (Cascadia Code / SF Mono).

### 6.1 Sidebar
- **Purpose:** identity + navigation.
- **Components:** brand mark (five rounded bars in the five module accent colors — an abstract waveform), "PulseRoom / Producer Toolkit" wordmark, 7 nav items, philosophy footer.
- **Interactions:** hover = 4% white wash; active = 6% wash + accent-glowing 7 px dot (each module keeps its own accent).
- **Responsive:** below 900 px collapses to a 68 px icon rail (dots only).

### 6.2 Tempo bar (persistent header)
- **Components:** "Project tempo" label · stepper − / input / + cluster (38 px controls, cyan mono BPM numerals, 20 px) · "BPM" unit · TAP pill button · right-aligned readout trio (ms/beat, ms/bar, Hz/beat).
- **States:** input focus = inset cyan ring; TAP active = cyan fill flash + scale 0.97; readouts update per keystroke.
- **Hierarchy:** the only cyan in the header is the number that matters.

### 6.3 Delay Calculator page
- **Components:** page title (accent word "Calculator" in cyan) · description · segmented control Essentials/All · (in All view) second segment Straight/Dotted/Triplet · card grid (auto-fill, min 215 px) · Haas/slapback hint strip.
- **Card anatomy:** division ("1/8") + kind pill (STRAIGHT cyan / DOTTED amber / TRIPLET violet) → 25 px mono ms value → Hz line → hairline → usage note.
- **States:** hover = accent border + panel lift; active = scale 0.985; click = copy + toast.
- **Visual hierarchy:** ms value dominates; pills give instant scannability by color.

### 6.4 Reverb Designer page
- **Layout:** 300 px style-picker column + results column.
- **Components:** six style cards (name + one-line character) · three hero number cards (PRE-DELAY / DECAY TIME / TOTAL TIME, 30 px violet mono, click-to-copy) · decay-envelope card (violet exponential curve, pre-delay region shaded) · **Send EQ curve card** (filter response with labeled LOW CUT/HIGH CUT dashed markers, frequency scale beneath) · settings grid (low cut, high cut, wet level, diffusion) · "where it shines" note · pro-habit hint strip.
- **States:** selected style = violet border + 8% violet fill.

### 6.5 EQ Cheat Sheet page
- **Components:** 13 instrument chips (pill, amber when active) · 200 px spectrum panel (log gridlines, labeled zone rectangles: green boost at top row, rose cut at bottom row, blue info mid) · frequency scale (20→20k) · legend · two-column band cards (color bar, mono frequency range, bold title + explanation).
- **Behavior:** narrow zones drop their inline label to avoid overflow; band cards carry the detail.

### 6.6 Compression page
- **Components:** 14 source chips (rose active) · two-column layout: gain-reduction envelope card (230 px SVG: 0 dB dashed line, HIT marker, amber attack band, green release band, rose GR curve, labels with real ms ranges) + 2×2 stat tiles (RATIO / ATTACK / RELEASE / GAIN REDUCTION, 24 px rose mono, one-line meaning under each) · source-specific hint strip.

### 6.7 Mix Chains page
- **Components:** 10 source chips (green active) · flexible node flow (numbered 01…, name, per-step guidance, ▶ connectors that wrap gracefully) · "Why this order" callout card (green-tinted).

### 6.8 Mixing Guide page
- **Components:** nine accordion cards; first open by default; chevron rotates 90°; bodies use bullet lists with mono-styled key numbers in guide-blue.

### 6.9 Reference page
- **Components:** two-column card layout (Loudness targets | Frequency map + Timing/psychoacoustics) with right-aligned tan mono values; full-width note-frequency card (auto-fill grid of 60 note tiles, C0–B4).

### Cross-cutting states & behavior
- **Toast:** bottom-center pill, "Copied …", 1.4 s, fade+rise.
- **Page transitions:** 280 ms fade + 8 px rise (cubic-bezier(0.16,1,0.3,1)); disabled under `prefers-reduced-motion`.
- **Dark mode:** the app is dark-native (pro-audio convention); there is no light mode by design — marketing should present this as intentional ("built for studio light").
- **Responsive:** ≤1120 px: two-column grids collapse to one; ≤900 px: icon-rail sidebar, readouts hidden, reverb hero cards stack.

---

## 7. Screenshot Plan

> **Raw captures included:** real app captures for S1–S10 already exist in [`screenshots/`](screenshots/) (1280×840 PNG, captured from the shipped app). Use them directly, or re-capture per the art direction below for hero-grade composites (2× scale, backgrounds, device frames). S11–S12 are composites to be assembled from these raws.

> **Global art direction for all screenshots:** capture at 1280×840 (app default) at 2× scale, real data at 120 BPM unless noted. Device frame: minimal dark window chrome with macOS-style traffic lights *or* frameless with 14 px rounded corners and a soft shadow. Backgrounds: deep radial gradients from the module's accent color (8% opacity) into #07080b. Lighting: single soft top-left glow. Shadow: y=40 px, blur=100 px, black 55%. Perspective: flat-on for UI truth; 8° tilt only for hero composites.

| # | Title | Device | Purpose |
|---|---|---|---|
| S1 | Hero — Delay Essentials | Desktop (frameless) | First impression: the whole app at a glance |
| S2 | Tempo bar macro | Desktop crop | The one-input-drives-everything story |
| S3 | Delay card macro + copy toast | Desktop crop | Click-to-copy micro-moment |
| S4 | Reverb Designer full | Desktop | Visual depth: numbers + two graphs |
| S5 | Send-EQ curve macro | Desktop crop | The "pro habit" differentiator |
| S6 | EQ Cheat Sheet full | Desktop | The most shareable screen |
| S7 | Compression envelope | Desktop | The teaching visual |
| S8 | Mix Chains flow | Desktop | Breadth beyond calculators |
| S9 | Mixing Guide accordion | Laptop frame | Editorial credibility |
| S10 | Reference tables | Desktop | Completeness proof |
| S11 | Sidebar + icon rail pair | Composite | Craft details / responsive |
| S12 | OG / social hero composite | 1200×630 | Link previews |

**S1 — Hero, Delay Essentials.** Visible: full window, Delay page in Essentials view, 140 BPM, all 8 cards, sidebar, tempo bar. Framing: centered, full window, 24 px breathing room. Overlays: none (let the UI speak). Caption: "One tempo. Every answer." Beside-copy: "PulseRoom opens ready to work — the eight delay values producers actually use, synced to your BPM." Background: cyan-tinted radial on near-black.

**S2 — Tempo bar macro.** Visible: crop of the header, − 128.0 + BPM, TAP mid-press (cyan flash state), readouts. Framing: extreme close crop, 3:1 ratio, slight 4° tilt. Highlight: cyan glow ring around TAP. Callout arrows: "Tap it. Type it. Nudge it." Caption: "The transport of your reference desk." Background: dark with subtle horizontal scanline texture.

**S3 — Copy micro-moment.** Visible: 1/8 DOTTED card in hover state (cyan border), cursor over it, toast "Copied 1/8 dotted = 482.14 ms" at bottom. Framing: card at 60% frame width, toast visible. Overlay: soft cursor spotlight. Beside-copy: "Every number is one click from your delay plugin." Device: desktop crop.

**S4 — Reverb Designer.** Visible: full page, Concert Hall selected, hero numbers (31.3 ms / 3.97 s / 4.00 s), decay envelope, send-EQ curve. Framing: full window. Callouts: thin violet lines to "Pre-delay lands on the grid" and "Tail dies on the bar." Beside-copy: "Reverb sized to the song, not the preset." Background: violet radial.

**S5 — Send-EQ macro.** Visible: the EQ-curve card alone: violet response curve, rose dashed LOW CUT 150 Hz / HIGH CUT 10 kHz markers, frequency scale. Framing: 16:9 crop, curve fills frame. Beside-copy: "The habit that separates clean mixes from muddy ones — drawn for you." Background: near-black, no gradient (let the curve glow).

**S6 — EQ Cheat Sheet.** Visible: Lead Vocal selected; spectrum with five zones; legend; two band cards peeking below. Framing: full window, spectrum vertically centered. Overlays: none — the zones are the callouts. Caption: "See the spectrum the way engineers hear it." Background: amber radial.

**S7 — Compression envelope.** Visible: Lead Vocal source; envelope SVG (HIT marker, attack band, GR dip, release recovery) + four stat tiles. Framing: full window or 4:3 crop on the layout. Callouts: "attack window" / "release window" hairlines. Beside-copy: "Attack and release, finally visible." Background: rose radial.

**S8 — Mix Chains.** Visible: Lead Vocal chain, all 8 nodes, "Why this order" card. Framing: full width, nodes on one or two rows. Overlay: animated-style pulse dot on node 3 (static glow in stills). Beside-copy: "The right order, and the reasons." Background: green radial.

**S9 — Mixing Guide.** Visible: accordion with "Gain staging" open showing mono-styled numbers. Device: laptop mockup (MacBook-style), slight left 12° perspective. Beside-copy: "Ten years of mixing habits, one page." Background: blue radial, desk-lamp vignette.

**S10 — Reference.** Visible: LUFS card + frequency map + note grid bottom edge. Framing: full window. Beside-copy: "The numbers you look up every week, one tab away — Spotify to club master." Background: warm tan radial.

**S11 — Craft composite.** Two frames side by side: full 236 px sidebar vs. 68 px icon rail (≤900 px). Purpose: show responsive intent + accent-dot system. Caption: "Small window? PulseRoom folds neatly."

**S12 — OG image.** 1200×630: app window at 8° tilt on cyan-to-violet dark gradient, brand mark top-left, headline "Every mixing answer. One tempo." No body text below 24 px.

---

## 8. Animation Plan

**Motion principles:** fast (≤400 ms UI, ≤900 ms hero), eased with `cubic-bezier(0.16,1,0.3,1)` (the app's own curve), accent-colored light as the signature (glows travel, never bounce). Everything honors `prefers-reduced-motion`.

### In-product (already shipped — reference for demos)
Page fade+rise 280 ms · hover border-tint on cards · TAP flash · toast rise · accordion chevron rotate.

### Marketing-site animations
| Element | Treatment | Tech |
|---|---|---|
| **Hero** | App window rises 24 px + fades in; then BPM numerals roll 120→140 and all 8 delay cards flip-morph their values in a 60 ms stagger cascade | Framer Motion (`useAnimate` sequence) or GSAP timeline |
| **Tempo ring** | Cyan pulse ring emits from TAP on a loop timed to 120 BPM (500 ms) — the page literally has a pulse | CSS keyframes |
| **Section reveals** | 12 px rise + fade at 30% viewport, once | Framer Motion `whileInView` |
| **EQ zones** | Zones scale-x from their center as the section enters; on instrument-tab click in the live demo, FLIP to new positions | GSAP Flip plugin |
| **GR envelope** | Curve draws left→right via stroke-dashoffset over 1.2 s, attack/release bands fade in after | SVG + GSAP DrawSVG (or dashoffset keyframes) |
| **Send-EQ morph** | Six space presets auto-cycle every 3 s; curve path morphs | Flubber / GSAP MorphSVG |
| **Chain pulse** | A dot of light travels node→node continuously | GSAP motionPath |
| **Counters** | LUFS/stat numbers count up on scroll-into-view | Framer Motion `animate()` |
| **Cursor choreography (video)** | Recorded cursor: deliberate, 60 fps, ease-out arrivals, 200 ms hover-pause before each click | Screen Studio-style capture |
| **Background** | Ultra-slow (40 s) drifting radial gradients in module accents at 6% opacity; optional faint waveform ridgeline drawn once on load | CSS / one canvas |
| **Parallax** | Screenshot layers (window, toast, callout chips) at 0.9×/1.0×/1.1× scroll rates — subtle, ≤20 px total | Framer Motion `useScroll` |
| **Loading** | Five brand-mark bars equalize (heights animate in canon) as a 900 ms preloader — also the perfect Lottie | Lottie |
| **Window transitions (trailer)** | Crossfade + 2% scale between module pages, matched to music downbeats | Video edit |

**Lottie opportunities:** equalizer preloader; TAP pulse; copy-toast checkmark.
**Three.js/WebGL (optional, restraint advised):** a single hero scene — dark room, floating glass app window with real texture, cyan/violet rim light, 4° mouse-follow tilt. No particles, no starfields.

---

## 9. Product Photography Direction

- **Overall aesthetic:** Apple-meets-Ableton. Hardware-studio references (matte metal, brushed panels, LED accents) photographed like product jewelry.
- **Lighting:** one large soft key from top-left; cyan or violet practical rim from the right (as if from studio LEDs); no fill — let shadows go deep.
- **Composition:** generous negative space; window off-center on thirds; one accent color per shot (match the module being shown).
- **Perspective:** flat-on for UI truth shots; 8–12° single-axis tilt for hero composites; never two-axis "floating card chaos."
- **Device mockups:** frameless dark windows with 14 px radius (matches app), or a dark-bezel MacBook on a black oak desk with a MIDI keyboard edge and headphone cable entering frame — studio context without clutter.
- **Glass & depth:** allowed on marketing chrome only (nav, callout chips): 8% white fill, 24 px blur, 1 px white/10 border. The app itself is *not* glassmorphic — don't fake it in shots.
- **Blur:** background bokeh of studio gear (LEDs, faders) at f/1.8 depth for lifestyle shots; UI always tack-sharp.
- **Gradients:** radial, accent-at-8% into #07080b; occasional 1.5%-noise grain to kill banding.
- **Neumorphism:** avoid entirely. **Material influences:** only elevation logic (consistent light source). Shadows: y=40/blur=100/black 55% for hero; y=12/blur=32 for cards.

---

## 10. Landing Page Content

**Hero headline:** Every mixing answer. One tempo.
**Hero subheadline:** PulseRoom turns your song's BPM into delay times, reverb tails, EQ moves, and compression settings — in one beautiful desktop app that works offline.
**Primary CTA:** Download free for Windows · **Secondary CTA:** Download for Mac (auto-detect OS, swap order) · **Tertiary link:** See it in action ↓

### Feature section (six blocks)
1. **Delay, decoded.** The eight delay values producers actually use — synced to your BPM, one click to copy. The full 21-value grid is a toggle away.
2. **Reverb that fits the song.** Six spaces, pre-delay and decay locked to the bar grid, and the send-EQ curve drawn for you.
3. **EQ you can see.** Boost and cut zones for 13 instruments, painted onto a real spectrum — from kick-drum sub to mix-bus air.
4. **Compression, finally visible.** Watch the gain-reduction envelope for 14 sources. Attack and release stop being guesswork.
5. **Chains with reasons.** Plugin order for vocals, drums, bass, and the mastering chain — each step explained.
6. **The reference desk.** LUFS targets, frequency map, Haas windows, note-to-Hz for tuning 808s. Every number you Google, un-Googled.

### Benefits strip
Stay in flow — answers in two clicks, not five tabs · Learn while you mix — every number ships with its why · Works offline — no account, no ads, no spinner · Native on Windows & macOS.

### Workflow section ("A session with PulseRoom")
Tap your tempo → copy your delays → size your reverb → carve with confidence → check your loudness. (Five steps, one screenshot each, alternating sides.)

### Comparison section
| | Browser calculators | PDF cheat sheets | PulseRoom |
|---|---|---|---|
| Tempo-synced values | Re-enter per site | Never | Live, app-wide |
| Visual EQ / compression | ✕ | Static, generic | Interactive, per-source |
| Explains the why | ✕ | Rarely | Every value |
| Works offline | ✕ | ✓ | ✓ |
| Click-to-copy | Rare | ✕ | Everywhere |
| Beautiful in a studio | Ads everywhere | Clip-art | Plugin-grade dark UI |

### Testimonials — **SAMPLE PLACEHOLDERS, replace with real quotes before launch**
> "I closed six browser tabs the day I installed this." — *Placeholder, bedroom producer*
> "The compression page taught my students more in one lecture than a semester of tables." — *Placeholder, audio instructor*
> "It's the first calculator that feels like it belongs next to my DAW." — *Placeholder, mix engineer*

### FAQs
**Is it really free?** Yes — free download, no account, no ads. **Does it work offline?** Completely; nothing is sent anywhere. **Windows and Mac?** Both, from the same codebase. **Is it a plugin/VST?** No — it's a standalone companion app that lives beside any DAW. **Are the values "correct"?** They're proven starting points with the reasoning attached; the app's own footer says it best — trust your ears first. **Will it slow my machine?** It's a ~2 MB reference app; lighter than one browser tab.

### Pricing copy
Free. Forever, for the core toolkit. *(If a Pro tier ships later: "PulseRoom Pro — custom chains, session presets, and A4-printable cheat sheets. One-time $19.")*

### CTA sections
Mid-page: **Stop Googling delay times.** [Download free] · Pre-footer: **Your next session starts at your tempo.** [Download for Windows] [Download for Mac] "Free · Offline · No account"

### Footer copy
PulseRoom — the producer's reference desk. Made for the ones mixing at 2 a.m. · Product / Download / Changelog · Learn / Mixing Guide / EQ basics · Contact / Twitter · © 2026 PulseRoom. Values are starting points — trust your ears first.

### SEO / Meta
- **SEO title:** PulseRoom — Delay & Reverb Calculator + Mixing Toolkit for Producers (Free, Windows & Mac)
- **SEO description:** Turn your BPM into delay times, reverb decay, EQ moves, and compression settings. PulseRoom is a free offline desktop toolkit for music producers — visual, instant, beautiful.
- **OG title:** PulseRoom — Every mixing answer. One tempo.
- **OG description:** The free desktop toolkit that syncs delay, reverb, EQ, and compression guidance to your song's BPM. Windows & macOS.
- **Meta keywords:** delay time calculator, reverb calculator, pre-delay calculator, EQ cheat sheet, compression settings, mixing guide, LUFS targets, music production tools, BPM to ms

---

## 11. Visual Style Guide

### Color system
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0c0e12` | App/site background |
| `panel` | `#12151c` | Cards |
| `panel-2` | `#171b24` | Inputs, insets |
| `panel-3` | `#1d2230` | Toast, elevated |
| `line` | `rgba(255,255,255,.07)` | Hairlines |
| `text` | `#e9ebf1` | Primary text |
| `text-2` | `#a2a9b8` | Secondary |
| `text-3` | `#6d7488` | Muted/labels |
| **Accents** | | *Functional color-coding — one per module* |
| `delay` | `#3fd3e4` | Cyan — delay + brand primary |
| `reverb` | `#a48bfa` | Violet |
| `eq` | `#f2b13c` | Amber |
| `comp` | `#f25c7f` | Rose |
| `chains` | `#4fd58f` | Green |
| `guide` | `#5f9dff` | Blue |
| `reference` | `#d8a05f` | Tan |

Rule: **one accent per section**, cyan is the default brand accent; the full-spectrum set appears together only in the logo and the EQ spectrum.

### Typography
- **UI/marketing sans:** Segoe UI Variable / SF Pro / Inter fallback. Headline weight 750, letter-spacing −0.02 em.
- **Numeric/mono:** Cascadia Code / SF Mono / JetBrains Mono — *all numbers, everywhere*. This is a core brand behavior.
- Scale (app): 26/15/14.5/13/11 px. Marketing scale: hero clamp(44–76 px), section 32–40 px, body 16–18 px.

### Icon & illustration style
1.5 px stroke, rounded caps, single accent on dark; illustrations are **diagrams that could be real UI** (curves, envelopes, node chains) — never mascots or 3D blobs.

### Spacing, radius, elevation
4 px base grid; card padding 20–22 px; page gutter 28–32 px. Radius: **14 px cards / 8 px controls / 999 px pills** (never mix). Shadows: cards none (borders instead); marketing hero y40/b100/55%. Glow: accent at 30% opacity, 8 px blur — used for active dots, TAP pulse, brand-mark hover.

### Components
- **Buttons:** primary = accent-filled dark-text pill-or-8px, hover lifts 1 px + glow; secondary = `panel-2` + hairline, hover accent border; ghost = text + underline on hover.
- **Cards:** `panel` + hairline + 14 px; hover accent-tint border on interactive cards only.
- **Forms:** `panel-2`, hairline-strong, focus = accent border (no ring spread).
- **Tables:** hairline row separators only; numeric columns right-aligned mono.
- **Charts:** SVG, 1.4–1.6 px accent strokes, `vector-effect: non-scaling-stroke`; area fills at 13%; gridlines white/5–7%.
- **Dark/light mode:** dark-native only. Marketing site is dark-only too — consistency over convention. (Accessible contrast: all text tokens pass WCAG AA on their panels.)

---

## 12. Competitive Analysis

| Competitor | Strengths | Weaknesses vs. PulseRoom |
|---|---|---|
| **Web delay calculators** (NickFever, Omnicalculator, AnotherProducer) | Free, zero install, rank well in search | Ad-cluttered, table-dumps with no guidance, no visuals, need internet, no copy buttons, BPM re-entered per tool |
| **PDF/JPEG cheat sheets** (EQ charts, comp tables) | Offline, printable, viral on Pinterest | Static, generic ("boost highs for air"), not tempo-aware, visually dated |
| **DAW-bundled helpers** (Logic/Ableton device readouts) | In-context | Fragmentary; no teaching layer; DAW-locked |
| **Assistant plugins** (iZotope Neutron/Ozone, Waves) | Analyze real audio, act on it | $99–$499, CPU-heavy, black-box ("trust the AI"), teach nothing; complement rather than compete |
| **Mobile apps** (Delay Genie etc.) | Pocketable | Phone is the wrong screen mid-session; single-purpose; abandoned UIs |

**Visual difference:** PulseRoom is the only player styled like the plugins producers already love (dark, mono numerals, functional accent coding).
**Marketing difference:** incumbents rely on SEO tables; nobody in this niche has ever shipped an Apple-grade product page — the visual bar for winning attention is remarkably low.
**Why PulseRoom is unique (one line):** it is the only tool where *tempo* is the primary input and *understanding* is the primary output — visual, offline, and free.

---

## 13. Assets Needed

**Brand — ✅ delivered in [`logo/`](logo/):** mark SVG (color / mono-white / mono-black) · horizontal logo SVG (dark-bg, light-bg, mono-white) · stacked logo SVG · `favicon.svg` · transparent mark PNGs (512/1024). App icon exists as `../icon.png` (256 px). *Still needed:* .icns/.ico exports, wordmark converted to outlines for print use (current wordmark uses the system font stack — fine on web, not for print).
**Screenshots:** S1–S12 per §7, each @2×, PNG + WebP.
**Mockups:** frameless dark window template (14 px radius + shadow) · MacBook-style laptop frame · side-by-side responsive composite.
**Motion:** hero BPM-morph capture (MP4/WebM, 6 s loop) · module-tour trailer (30 s) · GR-envelope draw-on loop (GIF + MP4) · send-EQ morph loop · Lottie: equalizer preloader, TAP pulse, copy checkmark.
**Graphics:** radial-gradient background set (one per accent) · 1.5% noise/grain tile · faint waveform-ridgeline SVG · callout chip components · comparison-table icons (✓/✕) · OG image 1200×630 · social banners (X header 1500×500, IG 1080×1080, YT thumbnail 1280×720).
**Docs:** this package · brand-tokens JSON (§17) · font fallback stack note.

---

## 14. Image Generation Prompts

> Production-ready for Midjourney / Flux / Ideogram / Recraft / ChatGPT Images. Append `--ar` as noted. **Never let the generator invent UI** — real screenshots are always composited in afterward; these prompts create environments, backgrounds, and abstract art only.

**14.1 Hero background** — "Ultra-dark studio gradient background, deep charcoal #0c0e12 fading into a soft radial glow of electric cyan #3fd3e4 at 8% opacity upper-left, subtle film grain, no objects, no text, minimal, premium software landing page backdrop, 8k --ar 16:9"

**14.2 Feature background set (make 6, swap accent)** — "Minimal abstract background for a dark software website section, near-black #0c0e12 with one soft radial bloom of {violet #a48bfa | amber #f2b13c | rose #f25c7f | green #4fd58f | blue #5f9dff | tan #d8a05f} at low opacity, faint 1% noise texture, no shapes, no text, cinematic, understated --ar 16:9"

**14.3 Lifestyle: studio at 2 a.m.** — "Moody home music studio at night, producer's desk from behind, dual monitors with dark software glowing cyan and violet (screens blank/out of focus), MIDI keyboard, studio headphones on stand, LED strip rim light, shallow depth of field f/1.8, cinematic teal-and-charcoal grade, photorealistic, no visible faces, no logos, no readable text --ar 16:9"

**14.4 Lifestyle: headphone detail** — "Macro photograph of studio headphones resting on a matte black desk beside a laptop edge, single cyan LED reflection on the ear cup, deep shadows, product-photography lighting, dark premium aesthetic, photorealistic, no text --ar 4:3"

**14.5 Device mockup stage** — "Empty dark presentation stage for a floating laptop mockup: black oak desk surface, near-black gradient wall, one soft top-left key light and a violet rim light from the right, long soft shadow area in center where a device will be composited, photorealistic, no device, no text --ar 16:9"

**14.6 Abstract: sound as light** — "Elegant abstract visualization of sound: five vertical rounded bars of light in cyan, violet, amber, rose, and green on a near-black background, soft glow, slight height variation like an equalizer, glassy reflections on a dark floor, minimal, Apple-keynote aesthetic, no text --ar 16:9"

**14.7 Abstract: the decaying tail** — "A single luminous violet curve decaying exponentially from left to right across a dark panel, like a reverb tail made of light, thin cyan gridlines barely visible, long exposure light-painting feel, minimal, premium, no text --ar 21:9"

**14.8 Icon accents (Recraft, vector style)** — "Minimal line icon of {a metronome / a sine wave / a fader / an EQ curve / a stopwatch}, 1.5px rounded stroke, single cyan #3fd3e4 accent on transparent, consistent 24px grid, flat vector, no fill, no text"

**14.9 3D render (optional hero)** — "Frosted dark glass rectangular panel floating in a black void at a slight 8-degree tilt, thin luminous cyan edge light, soft volumetric glow beneath, ultra-minimal 3D render, octane, physically-based lighting, empty panel face for UI compositing, no text --ar 16:9"

**14.10 Marketing banner base** — "Wide dark banner background, charcoal #0c0e12, gradient sweep from cyan to violet along the bottom edge at 10% opacity, faint waveform ridgeline in the lower third, minimal, space reserved center-left for headline text (do not render text) --ar 3:1"

**14.11 Social square** — "Dark square social media background, deep charcoal with a centered soft cyan radial glow, subtle grain, one thin horizontal luminous line across the center like an audio timeline with a small playhead notch, minimal, no text --ar 1:1"

**14.12 OG stage** — "Dark 1200x630 web preview background, charcoal gradient, cyan-to-violet glow from lower-right, empty right half reserved for a window screenshot composite, faint grid texture 3% opacity, no text --ar 40:21"

---

## 15. Motion Storyboard

### 15.1 Homepage intro (on load, ~1.6 s total)
0.0 s black → 0.2 s five brand bars equalize in canon (Lottie) → 0.6 s bars morph into wordmark, headline rises 16 px + fades → 0.9 s hero window rises + fades → 1.2 s BPM rolls 120→140, delay cards cascade-morph (60 ms stagger) → 1.6 s TAP begins its 500 ms heartbeat loop. Reduced-motion: simple 300 ms fade.

### 15.2 30-second product trailer
Music: minimal analog house, 120 BPM, sidechained pad (every cut lands on a downbeat).
- **0–3 s** Black. A cursor clicks TAP four times; each tap = a drum hit + cyan pulse. BPM settles: 124.
- **3–8 s** Whip-crossfade to Delay page; cards morph; cursor copies 1/8 dotted; toast pops. Overlay: "One tempo."
- **8–14 s** Slide to Reverb; Hall selected; numbers tween; send-EQ curve draws on. Overlay: "Every answer."
- **14–19 s** EQ page; instrument chips cycle kick→vocal→808; zones FLIP between layouts. Overlay: "See your mix."
- **19–24 s** Compression; GR envelope draws with the music's own sidechain pump synced to it. Overlay: "Feel the settings."
- **24–28 s** Fast montage: chains pulse, guide accordion, LUFS counters.
- **28–30 s** Logo + "PulseRoom — free for Windows & Mac." Music resolves on a held pad.

### 15.3 60-second feature walkthrough
Same structure at conversational pace with VO (calm, close-mic, engineer energy): intro problem (0–8 s, browser-tab chaos B-roll) → tempo bar (8–16) → delay (16–26) → reverb (26–38) → EQ (38–46) → compression (46–54) → close with download CTA (54–60). Lower-third captions in mono type; every transition a 200 ms crossfade + 2% scale on downbeats.

### 15.4 Social teaser (9:16, 12 s)
Hook first: GR envelope drawing on with caption "attack & release, finally visible" (0–4 s) → tempo tap + card morph (4–8 s) → logo + "free desktop app" (8–12 s). Big type, no VO, loops cleanly.

### 15.5 Launch video (90 s)
Acts: **Problem** (browser tabs, ads, squinting at a 2009 table — desaturated grade) → **Turn** (single tap on TAP; color floods in; music drops) → **Product** (trailer beats, expanded) → **Philosophy** ("Values are starting points. Trust your ears first." on black) → **CTA**. Camera: slow push-ins on UI, one 8° parallax hero orbit; text overlays in brand mono; music builds from lone kick to full arrangement — the video itself demonstrates a mix coming together.

---

## 16. Landing Page Structure

| # | Section | Why here |
|---|---|---|
| 1 | Nav (logo, Features, Guide, Download CTA) | Persistent conversion path; blur-glass on scroll |
| 2 | **Hero** (headline, sub, dual CTA, S1 + intro animation) | Value prop + product truth in the first viewport |
| 3 | Social-proof strip (download count / placeholder logos) | Trust before claims |
| 4 | **Problem** ("The 11-tab mix session") | Pain recognition — makes the demo land harder |
| 5 | **Tempo demo** (interactive: real BPM input morphing real values) | Let visitors *feel* the product in 5 seconds — the page's conversion engine |
| 6 | Feature blocks ×6 (alternating, S3–S10) | Depth for evaluators, scannable for skimmers |
| 7 | Workflow ("A session with PulseRoom") | Mental rehearsal of ownership |
| 8 | Comparison table | Handles the "why not just Google it" objection explicitly |
| 9 | Testimonials (placeholders until real) | Peer voice at the decision point |
| 10 | FAQ (accordion) | Kills residual objections (free? offline? VST?) |
| 11 | **Final CTA** ("Your next session starts at your tempo") | Momentum close, both-OS buttons |
| 12 | Footer | Utility + philosophy sign-off |

**Conversion optimization:** OS auto-detect on CTAs; CTA repeats at hero/mid/end; download size + "no account" microcopy under every button; the interactive tempo demo doubles as the share-magnet.
**Trust builders:** offline/no-telemetry statement, real UI screenshots only, version + changelog link, GitHub-style transparency if open-sourced.
**Psychological triggers:** pain vividness (tab chaos) → relief (one tap); demonstration beats persuasion (interactive demo); "free forever" reciprocity; identity ("made for the ones mixing at 2 a.m.").
**Accessibility:** all text AA on dark; focus-visible rings in accent; reduced-motion variants for every animation; semantic landmarks; alt text specified per screenshot in §7; interactive demo fully keyboard-operable.
**Mobile-first:** hero stacks (headline → S1 crop → CTA); feature blocks single-column; comparison table becomes swipeable cards; videos replace hover-dependent demos; tap targets ≥44 px.

---

## 17. Developer Handoff (JSON)

The machine-readable version of this package ships alongside as [`developer-handoff.json`](developer-handoff.json) — same folder. It contains: product_name, tagline, brand, colors, fonts, features, screenshots, animations, assets, copy, seo, faqs, testimonials_placeholders, pricing, ui_sections, cta_text, navigation, footer, image_prompts. Consume it directly; this document is the narrative companion.

---

## 18. Final Checklists

### Screenshot checklist
- [ ] S1 Hero — Delay Essentials @140 BPM, 2×
- [ ] S2 Tempo bar macro (TAP flash state)
- [ ] S3 Delay card hover + copy toast
- [ ] S4 Reverb Designer — Concert Hall
- [ ] S5 Send-EQ curve macro
- [ ] S6 EQ Cheat Sheet — Lead Vocal
- [ ] S7 Compression — Lead Vocal envelope
- [ ] S8 Mix Chains — Lead Vocal
- [ ] S9 Mixing Guide in laptop frame
- [ ] S10 Reference tables
- [ ] S11 Responsive sidebar composite
- [ ] S12 OG composite 1200×630

### Animation checklist
- [ ] Hero load sequence (1.6 s) + reduced-motion fallback
- [ ] TAP heartbeat loop (500 ms @120 BPM)
- [ ] Interactive tempo demo (live value morph)
- [ ] EQ zone FLIP transitions
- [ ] GR envelope draw-on
- [ ] Send-EQ curve morph loop
- [ ] Chain travel pulse
- [ ] Scroll reveals + counters
- [ ] Equalizer preloader Lottie
- [ ] 30 s trailer · 60 s walkthrough · 12 s vertical teaser · 90 s launch film

### Copy checklist
- [ ] Replace placeholder testimonials with real quotes
- [ ] Verify download sizes/links per OS
- [ ] Final pass: no banned hype-words, all numbers in mono styling

*End of package. Built from the shipped PulseRoom v1.0.0 codebase — every color, value, and behavior cited above exists in the product today.*
