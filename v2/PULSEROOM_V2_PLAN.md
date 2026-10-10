# PulseRoom 2.0 — Mixing Assistant

A plan for turning PulseRoom from a reference desk into something that answers
the question a producer actually has, in their words, with the numbers and a
moving picture of what the move does.

---

## 1. The idea in one line

Ask "how do I make my kick hit harder in afrobeats?" and get a one-sentence
answer, the exact parameters, an animation of the move, and a voice reading it
out — instantly, offline.

---

## 2. What it is, and what it deliberately is not

**It is a curated answer engine.** Over a thousand real questions, each with an
author-written answer, structured parameters and a visual. Matching happens on
device with a search index.

**It is not a chatbot.** This matters, and it is a strength:

| Chatbot | Curated engine |
|---|---|
| Needs the internet | Works on a plane |
| Costs money per question | Costs nothing to run |
| Different answer each time | Same trusted answer every time |
| Can invent a wrong frequency | Every number was written deliberately |
| Needs AI disclosures in both stores | Nothing to disclose |

The research is done by us, up front, and baked in. The user experiences it as
an assistant; the engineering is a fast index over hand-written knowledge.

> **Wording to avoid:** "AI", "powered by AI", "generates answers". Apple and
> Google both ask about AI services at submission, and the honest answer stays
> "none" only if we do not claim otherwise. Call it a **mixing assistant** or
> **answer engine**.

---

## 3. How a user experiences it

```
ASK                      ANSWER                        DO
──────────────────────   ───────────────────────────   ──────────────────
"vocals sound thin"  →   "Stop high-passing so high    [animated EQ curve
                          and protect the chest."       showing the move]
 chips: Vocal · R&B
                          1. HPF to 80 Hz, not 120     [tap: copy params]
                          2. Bell +2 dB at 220 Hz…      [voice reads it]
                          3. …                          [related questions]
```

Two new screens — **Ask** (search + filters) and **Answer** (the payload) —
added to everything v1 already does.

**Nothing from v1 is removed.** Delay, Reverb, EQ chart, Compression, Mixing
chains, Tips & Guide and Reference all stay, all keep their content, and all
get the same visual upgrade as the new screens. The vocal chains in particular
become destinations that answers link into: "use the pop vocal chain" opens
that chain with the relevant stage already highlighted. Answers deep-link into
the calculators the same way — "set your delay to 1/8 dotted" opens the Delay
page already on that value.

What changes in v1 is how it *looks*, not what it holds: the EQ curves,
compression envelopes and chain diagrams are redrawn and animated to the
standard set by the Ask screens.

---

## 4. Content model

One JSON entry per question. This is the whole contract:

```json
{
  "id": "kick-harder-afrobeats",
  "q": "How do I make my kick hit harder?",
  "aliases": ["kick has no punch", "weak kick", "kick doesn't knock",
              "make kick slap", "kick needs more impact"],
  "source": "kick",
  "intent": "punchier",
  "genres": ["afrobeats", "hiphop", "gospel"],
  "short": "Let the beater click through before the compressor grabs it, then add weight under it.",
  "steps": [
    "Compressor: 4:1, attack 20–30 ms, release 60–100 ms, 3–6 dB GR.",
    "EQ after the compressor: +2 dB at 50–60 Hz, narrow cut 2–4 dB at 250–350 Hz.",
    "Add 1–2 dB at 3–5 kHz for the beater, or layer a click sample.",
    "Saturate lightly so it survives phone speakers."
  ],
  "params": {
    "comp": { "ratio": "4:1", "attack": "20–30 ms", "release": "60–100 ms", "gr": "3–6 dB" },
    "eq": [ { "f": 55, "gain": 2, "q": 1.0 }, { "f": 300, "gain": -3, "q": 1.6 },
            { "f": 4000, "gain": 1.5, "q": 0.9 } ]
  },
  "visual": { "type": "comp-attack", "compare": true },
  "why": "A fast attack flattens the transient that reads as 'hit'. Slowing the attack lets the beater pass before gain reduction starts, so the kick keeps its edge while the body is controlled.",
  "watch": "If it starts clicking unpleasantly, the attack is too slow or the release too fast.",
  "genreNotes": {
    "afrobeats": "The log drum usually owns 50–70 Hz. High-pass the kick at 40 Hz and let it live at 80–100 Hz instead of fighting underneath.",
    "gospel": "Live kits need the gate set before any of this, or the bleed compresses with it."
  },
  "related": ["kick-vs-808-masking", "kick-boxy-fix", "drum-bus-glue"]
}
```

Every field earns its place: `short` is what the voice says first and what the
card shows, `params` feeds the animation **and** the copy-to-clipboard chips,
`genreNotes` is how one answer serves ten genres without ten entries.

---

## 5. Getting to 1,000+ questions honestly

Not padding — these are combinations producers genuinely search for.

**Sources (28)** — kick, snare, hats, toms, overheads, room mics, drum bus,
808, bass guitar, synth bass, lead vocal, vocal double, harmony stack, choir,
rap vocal, ad-libs, electric guitar clean, electric guitar distorted, acoustic
guitar, piano, organ, Rhodes, synth lead, pad, strings, horns, percussion
(shaker / conga / talking drum), mix bus.

**Intents (14)** — bigger, tighter, punchier, warmer, brighter, cleaner, wider,
more upfront, further back, louder, more aggressive, smoother, glued, more
natural.

**Problems (12)** — muddy, boxy, honky, harsh, sibilant, boomy, thin, dull,
pumping, phasey, masked, lifeless.

**Genres (10)** — Afrobeats, Highlife, African Gospel, CCM / Worship, R&B,
Hip-hop / Trap, Jazz, Reggae / Dancehall, Pop, Amapiano.

The bank is now built, not estimated. `node v2/build-question-bank.js` emits
`v2/data/question-index.json` and the readable `v2/QUESTION_BANK.md`.

| Bucket | How it is produced | Questions |
|---|---|---|
| Source × intent | generated from a curated matrix | 217 |
| Source × problem | generated from a curated matrix | 166 |
| Genre playbooks | hand-written, 10 playbooks | 160 |
| Concepts and technique | hand-written | 100 |
| Workflow and creative | hand-written | 50 |
| **Built** | | **693** |

The combinatorial buckets are generated because they genuinely are
combinatorial — but from a matrix that lists, per source, only the intents and
problems that make sense for it. A pad cannot hit harder and hats are never
boomy, so the generator never asks it. The other 310 have no pattern and are
written by hand.

**693, not 1,000.** The gap closes three ways, in this order: finishing the
remaining sources × intents that were pruned conservatively (~80), adding the
four secondary genres already stubbed in the validator — Amapiano, Reggae,
Jazz, Pop (~80 each at playbook depth), and genre-scoped variants of the
highest-traffic questions, which are distinct *searches* even where
`genreNotes` lets one entry answer them. Padding to reach a round number would
make the bank worse, so the claim moves only as real questions are added.

Genre playbooks are where this becomes distinctive. Nobody else ships "how do I
mix a highlife horn section" or "how do I stop my choir swallowing the lead".

---

## 6. The visual system — where v2 earns its upgrade

Twelve animated explainers, each driven by an answer's `params`. Built as SVG
with scripted motion, same approach as the compression envelope that already
works, but richer.

| Component | Shows | Animates |
|---|---|---|
| `eq-curve` | Filter response on a log spectrum | Curve morphs from flat to the suggested move |
| `eq-mask` | Two sources overlapping | The carve opening a pocket, overlap glow fading |
| `comp-attack` | Waveform plus GR | Transient surviving a slow attack vs flattened by a fast one |
| `comp-envelope` | GR over one hit | Draws left to right (exists — upgrade) |
| `reverb-tail` | Pre-delay and decay on a bar grid | Tail decaying in time with the tempo |
| `delay-grid` | Echoes on a timeline | Repeats landing on the grid |
| `stereo-field` | Width and placement | Collapsing to mono to expose phase problems |
| `sidechain` | Ducking against the kick | Pumping synced to the project BPM |
| `layering` | Stacked takes | Voices arriving one by one, panning out |
| `chain-flow` | Plugin order | Signal pulse travelling the chain |
| `levels` | Relative fader balance | Bars settling into the target balance |
| `automation` | A line over a timeline | The rides drawing themselves |

Every one reads the global BPM, so the animations are literally in time with
the user's song.

---

## 7. Voice

**On-device text-to-speech, not pre-rendered audio.** The arithmetic decides it:

| Approach | Size | Offline | Cost |
|---|---|---|---|
| Pre-rendered audio for 1,000 answers | ~100 MB at 30 s each | yes | per-generation fees |
| On-device TTS (iOS AVSpeechSynthesizer / Android TextToSpeech) | 0 MB | yes | free |

100 MB of audio would nearly double the download and push against store limits
for a feature the OS already provides. The plugin is
`@capacitor-community/text-to-speech`; both platforms speak offline.

The player reads `short`, then each step, highlighting the step being spoken,
with play/pause and a speed control. On desktop the Web Speech API does the same.

*Optional later:* a signature voice for ~40 "concept primers" only, pre-rendered,
about 4 MB. Worth it only if the brand voice matters more than the extra build
step.

**Voice input** (asking out loud) is phase 3 — iOS and Android both offer
on-device dictation, but it needs a microphone permission and a privacy-policy
update, so it should not ride along with the first release.

---

## 8. Matching, offline

A build-time index, shipped as JSON:

1. **Normalise** the query — lowercase, strip punctuation, expand synonyms
   (`vox → vocal`, `kik → kick`, `boomy → too much low end`, `knock → punch`).
2. **Score** candidates — exact alias match beats all-token match beats partial.
3. **Boost** by active chips (source, genre) and by the question's popularity rank.
4. **Always answer** — if nothing scores well, offer the closest three plus a
   browse-by-source grid. Never a dead end.

Typing shows results instantly; no spinner, because there is no network.

---

## 9. Build plan

| Phase | Scope | Output |
|---|---|---|
| **2.0** | Engine, Ask/Answer screens, 6 visuals, TTS, 300 questions covering every source and the top 4 genres | Shippable, already better than v1 |
| **2.1** | Remaining 700+ questions, all 12 visuals, 10 genre playbooks | The full promise |
| **2.2** | Voice input, favourites and history, "my session" notes, shareable answer cards | Retention features |

Content is produced in reviewed batches of ~50, validated by a schema checker
so a malformed entry can never ship.

---

## 10. Decisions, settled

1. **Paid — $19, one payment.** No subscription. The calculators stay free, so
   the free app keeps growing the audience and the assistant is what is sold.
2. **Genres** — Gospel (six styles), Afrobeats, Hip-hop/Trap, R&B, Highlife.
3. **Voice** — recorded locally in VoiceBox for the one-line answer and the
   warning; on-device TTS reads the numbered steps. See `ASSET_PROMPTS.md` §4.
4. **Name** — the tab is **ASK**.

**One thing to decide at submission, not now: regional pricing.** $19 is a fair
price in the US and UK and a steep one in Ghana and Nigeria, which is a large
part of the audience for Gospel, Afrobeats and Highlife. Both stores support
per-country pricing, and setting it is a few minutes of work in App Store
Connect and Play Console. Worth doing deliberately rather than shipping one
USD price everywhere and wondering why West African conversion is flat.

---

## 11. Risks, stated plainly

- **Content quality at scale.** A thousand answers written carelessly is worse
  than a hundred written well. Mitigation: the strict template, a fixed set of
  parameter ranges, and batch review before anything merges.
- **Scope.** This is several times the size of v1. The phasing above exists so
  2.0 ships rather than stalling at 60% of 1,000.
- **Sameness.** If every answer reads like a template the magic dies. The
  `why` and `watch` fields are where the voice of a real engineer has to come
  through.

---

## 12. What the seed proves

`v2/data/questions.seed.json` contains real entries across drums, bass, vocals,
instruments, genres and concepts, written to the final schema, plus a validator.
It is the model working end to end before a line of UI is built.
