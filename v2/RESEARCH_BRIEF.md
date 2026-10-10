# PulseRoom 2.0 — Independent Research Brief

Send everything between the rules to another researcher or model. It is written
to be self-contained: they need no other context and no access to this repo.

The point is **comparison, not volume.** We already have 121 answers written. A
second independent pass is only useful if it disagrees with us somewhere, so the
brief is built to surface disagreement rather than to produce a second pile of
agreeable text.

---

## THE PROMPT — copy from here

You are an experienced mix engineer being asked to write reference answers for a
paid offline mixing assistant aimed at producers working in **Gospel (six
distinct styles), Afrobeats, Hip-hop/Trap, R&B and Highlife**. Many of the users
are in Ghana and Nigeria, working on headphones or in untreated rooms, and will
act on your numbers without a second opinion.

### What I need

For each question listed at the end, produce one entry in exactly this shape:

```json
{
  "id": "<use the id I give you, unchanged>",
  "q": "<the question, unchanged>",
  "short": "<one sentence, under 140 characters, that answers it before any detail>",
  "steps": ["<3-5 numbered actions, each with a real number or a real decision>"],
  "params": { "comp": {...}, "eq": [{"f":0,"gain":0,"q":0,"type":"bell|hp|lp|shelf"}],
              "reverb": {...}, "delay": {...} },
  "why": "<2-3 sentences on the mechanism. Why this works, not that it works.>",
  "watch": "<one sentence: the specific way this advice goes wrong>",
  "confidence": "high | medium | low",
  "basis": "<where this comes from: measurement, standard practice, a named source, or personal experience. Say which.>",
  "disputed": "<if credible sources disagree with each other or with common advice, say so here and say who says what. Otherwise omit.>"
}
```

### Rules I care about more than coverage

1. **Numbers must be defensible.** If you write 250 Hz, you should be able to say
   why 250 and not 400. If you cannot, mark `confidence: low` and say so in
   `basis`. A confident wrong number is worse to me than an honest uncertain one.

2. **Say when the common advice is wrong.** Most published mixing advice is
   recycled from tutorials aimed at bedroom rock recordings. Where it does not
   apply — or actively harms — to these genres, say that explicitly. That is the
   most valuable thing you can give me.

3. **Mechanism over recipe.** "Cut 300 Hz" is worth nothing without "because
   four sources each contributing 2 dB there sum to 8 dB." The `why` field is
   the part I will read most carefully.

4. **Genre specificity is the whole point.** A gospel choir behind a lead is not
   a pop backing stack. A log drum is not an 808. Highlife guitars interlock in
   a way rock guitars do not. If your answer would be identical for any genre,
   either say so plainly or find what actually differs.

5. **Flag what you could not verify.** I would rather have 40 entries where 10
   are marked uncertain than 70 that all sound certain. Separate what you know
   from what you are inferring.

6. **No AI-sounding filler.** No "elevate", "seamless", "take it to the next
   level". Write the way an engineer explains something to another engineer.

7. **Cite where you can.** If a claim comes from a manufacturer, a published
   standard (EBU R128, ITU-R BS.1770), a named engineer, or a measurement, name
   it. If it comes from forums or YouTube, say that too — I want to know the
   difference.

### What I already believe, so you can disagree with it

Do not read these as instructions. They are our current positions. Tell me where
we are wrong.

- A lead vocal should usually be high-passed around 80 Hz, not 120, because the
  standard advice assumes a muddy room recording and strips the chest otherwise.
- Vocal brightness should come from saturation before any high shelf, because a
  boost only amplifies what is already there, including room and hiss.
- Two de-essers at 3 dB, at different points in the chain, beat one at 6 dB.
- A choir buried under a lead should be carved at 3–5 kHz and compressed harder,
  not turned down, because turning it down shrinks the arrangement.
- An 808's perceived size on phones comes from its harmonics, so saturation
  matters more than any boost at 40 Hz.
- Drum bus pumping is usually the kick dominating the compressor's detector, so
  a sidechain high-pass fixes it faster than changing the ratio.
- A pad should be high-passed at 250–350 Hz, far higher than feels right,
  because it sustains and therefore never stops contributing low-mid energy.
- Church rooms build up somewhere between 300 Hz and 1 kHz, and that is a
  different problem from a choir's own low-mid density. We are not certain where
  the line is, and would value a view.

### The questions

Answer as many as you can, in this order. Quality first — 20 excellent entries
beat 60 thin ones.

**Gospel — Traditional** (live band, choir, Hammond, big dynamic range)
- `gt-live-choir-four-mics` — How do I mix a live choir recorded with four mics?
- `gt-hammond-swallowing` — How do I stop the Hammond organ swallowing the whole mix?
- `gt-live-drum-bleed` — How do I control drum bleed in a live church recording?
- `gt-lead-vs-twenty-voices` — How do I balance one lead singer against a twenty-voice choir?
- `gt-shout-section` — How do I mix a gospel shout section without it turning to mush?
- `gt-leslie-cabinet` — How do I mix a Leslie cabinet on a Hammond?

**Gospel — Praise & Worship** (long builds, dynamics, congregation)
- `gw-six-minute-build` — How do I mix a worship song that builds for six minutes?
- `gw-congregation-mic` — How do I mix a congregation mic without it sounding like noise?
- `gw-quiet-then-belts` — How do I mix a worship leader who sings quietly then belts?
- `gw-two-ambient-guitars` — How do I mix two electric guitars both playing ambient swells?

**Gospel — African / Highlife-influenced**
- `ga-talking-drum` — How do I mix a talking drum?
- `ga-shekere-masks-hats` — How do I stop a shekere masking the hi-hats?
- `ga-choir-vs-percussion` — How do I balance a choir against African percussion?
- `ga-guitar-percussion-lock` — How do I make the guitar and percussion lock in a gospel highlife groove?

**Afrobeats**
- `ab-log-drum` — How do I mix an afrobeats log drum?
- `ab-logdrum-vs-kick` — How do I balance the log drum and the kick?
- `ab-the-bounce` — How do I get the afrobeats bounce in the mix?
- `ab-shakers-drive` — How do I mix afrobeats shakers so they drive the track?
- `ab-conversational-but-loud` — How do I keep an afrobeats vocal conversational and still loud?

**Highlife**
- `hl-interlocking-guitars` — How do I mix interlocking highlife guitars?
- `hl-horn-section` — How do I mix a highlife horn section?
- `hl-groove-stays-light` — How do I mix highlife drums so the groove stays light?
- `hl-recorded-live-one-room` — How do I mix a highlife track recorded live in one room?

**Hip-hop / Trap**
- `hh-tune-the-808` — How do I tune my 808 to the song?
- `hh-every-word-clear` — How do I mix a rap vocal so every word is clear?
- `hh-hats-dont-stab` — How do I mix trap hats so they don't stab?

**R&B**
- `rb-vocal-stacks` — How do I mix R&B vocal stacks?
- `rb-warm-but-tight` — How do I get R&B low end warm but tight?

### Finally

End your reply with a short section called **"Where I disagree with your stated
positions"**, listing any of the eight beliefs above you think are wrong or
oversimplified, and why. If you agree with all of them, say that, and say which
one you are least sure about.

## THE PROMPT — copy to here

---

## What to do with the result

Send me whatever comes back. I will diff it against our 121 entries and:

- **Where it agrees**, confidence goes up and nothing changes.
- **Where it disagrees on a number**, we check which one has a mechanism behind
  it. The one that can explain itself wins.
- **Where it covers something we missed**, it gets written into the bank with
  the source noted.
- **Where it is wrong**, that is still useful — it tells us which bad advice is
  circulating, which is worth a `watch` line of its own.

### A note on what the web actually has

I checked the public material before writing this. It is thin. On the amapiano
log drum, one guide puts it at 200–800 Hz and another at 200–400 Hz, neither
shows a measurement, and the pitch moves with the sample anyway. Gospel choir
material is better — the 3:1 mic spacing rule, church rooms building up around
500 Hz–1 kHz, and timing reverb decay to note values all recur across
independent sources — but almost all of it is written for live reinforcement
rather than for mixing a record.

That gap is the opportunity. It is also why a second independent pass is worth
doing rather than simply searching harder.

**Sources checked:**
[ProSoundWeb — recording an a cappella choir](https://www.prosoundweb.com/church-sound-recording-an-a-cappella-choir/) ·
[ProSoundWeb — how to mic a choir](https://www.prosoundweb.com/audix-video-series-how-to-mic-a-choir/) ·
[Shure — live sound tips for choirs](https://www.shure.com/en-US/insights/of-mics-and-monitors-live-sound-reinforcement-tips-for-choirs) ·
[ProSoundWeb — blending backing vocals](https://www.prosoundweb.com/church-sound-top-seven-ways-to-blend-backing-vocals/2/) ·
[Sage Audio — mastering for gospel](https://sageaudio.com/articles/mastering-for-gospel-music) ·
[Live Sound International — church sound, Feb 2024](https://customdigital.livesoundint.com/february-2024/page-8) ·
[Splice — what is amapiano](https://splice.com/blog/what-is-amapiano-music/) ·
[RouteNote — how to make an amapiano beat](https://create.routenote.com/blog/beatmakers-guide-how-to-make-an-amapiano-beat/)
