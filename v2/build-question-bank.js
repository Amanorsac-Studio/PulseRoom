#!/usr/bin/env node
/* Builds the question backlog from the taxonomy.
 *
 * Source x intent and source x problem are genuinely combinatorial — producers
 * really do search every one of these — so they are generated from a curated
 * matrix rather than typed out by hand. What is NOT generated: the genre
 * playbooks and the concept/workflow questions, which are hand-written in
 * data/playbooks.json and data/concepts.json because they have no pattern.
 *
 * Output is a BACKLOG, not shippable content: id, question, aliases, tags.
 * An entry becomes shippable when an answer is written for it and it moves
 * into data/*.json, where validate.js enforces the full schema.
 *
 *   node v2/build-question-bank.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'data');

/* ------------------------------------------------------------------ *
 * Sources. `p` marks a plural name so the question reads correctly.
 * `i` are the intents that make sense for it, `x` the problems it has.
 * A pad cannot "hit harder" and hats are never "boomy" — the point of
 * listing these by hand is that the generator never asks nonsense.
 * ------------------------------------------------------------------ */
const S = (name, p, i, x) => ({ name, p, i, x });

const SOURCES = {
  kick:      S('kick',            0, ['punchier','tighter','bigger','warmer','brighter','cleaner','louder','aggressive','natural','upfront'],
                                     ['boxy','muddy','boomy','thin','masked','dull','lifeless','phasey']),
  snare:     S('snare',           0, ['punchier','tighter','bigger','brighter','warmer','cleaner','louder','aggressive','natural','upfront','wider'],
                                     ['boxy','harsh','thin','dull','lifeless','masked','phasey','honky']),
  hats:      S('hats',            1, ['tighter','brighter','cleaner','smoother','back','wider','natural','louder'],
                                     ['harsh','thin','masked','dull']),
  toms:      S('toms',            1, ['punchier','tighter','bigger','warmer','cleaner','natural','wider'],
                                     ['boomy','boxy','dull','lifeless','phasey','muddy','masked']),
  overheads: S('overheads',       1, ['wider','cleaner','brighter','natural','glued','back','smoother'],
                                     ['harsh','thin','phasey','dull','masked']),
  room:      S('room mics',       1, ['bigger','aggressive','cleaner','back','glued','warmer'],
                                     ['muddy','harsh','boomy','lifeless','phasey']),
  drumbus:   S('drum bus',        0, ['glued','punchier','louder','bigger','tighter','warmer','aggressive','cleaner','wider'],
                                     ['muddy','harsh','pumping','lifeless','masked','boxy']),
  percussion:S('percussion',      0, ['brighter','cleaner','wider','back','natural','tighter','upfront'],
                                     ['harsh','thin','masked','boxy','dull']),

  '808':     S('808',             0, ['bigger','tighter','cleaner','louder','aggressive','upfront','smoother','warmer'],
                                     ['muddy','boomy','masked','thin','dull','phasey']),
  bass:      S('bass',            0, ['bigger','tighter','cleaner','warmer','louder','upfront','smoother','natural','brighter'],
                                     ['muddy','boomy','masked','thin','dull','lifeless','boxy']),
  synthbass: S('synth bass',      0, ['bigger','tighter','cleaner','warmer','aggressive','louder','smoother'],
                                     ['muddy','boomy','masked','harsh','thin','phasey']),

  leadvocal: S('lead vocal',      0, ['upfront','bigger','brighter','warmer','cleaner','smoother','louder','natural','back','aggressive','wider','tighter'],
                                     ['thin','harsh','sibilant','muddy','boxy','dull','masked','lifeless','boomy','honky']),
  double:    S('vocal doubles',   1, ['wider','tighter','glued','cleaner','back','natural'],
                                     ['phasey','masked','thin','harsh','muddy']),
  harmony:   S('harmony stack',   0, ['wider','glued','cleaner','back','bigger','smoother','warmer'],
                                     ['masked','muddy','harsh','thin','sibilant','phasey']),
  choir:     S('choir',           0, ['bigger','wider','cleaner','back','glued','warmer','smoother','natural','upfront'],
                                     ['muddy','masked','harsh','boomy','sibilant','lifeless','boxy']),
  rapvocal:  S('rap vocal',       0, ['upfront','aggressive','brighter','cleaner','louder','tighter','smoother','warmer'],
                                     ['harsh','sibilant','thin','masked','muddy','dull','boxy']),
  adlib:     S('ad-libs',         1, ['wider','back','cleaner','brighter','glued'],
                                     ['harsh','sibilant','masked','thin']),

  eguitar:   S('distorted guitar',0, ['bigger','tighter','warmer','cleaner','wider','back','aggressive','upfront'],
                                     ['harsh','muddy','boxy','thin','masked','dull']),
  'eguitar-clean': S('clean electric guitar', 0, ['warmer','brighter','wider','cleaner','back','upfront','natural'],
                                     ['thin','harsh','dull','masked','boxy']),
  aguitar:   S('acoustic guitar', 0, ['warmer','brighter','cleaner','wider','natural','back','upfront','tighter'],
                                     ['boxy','boomy','harsh','thin','dull','masked']),
  piano:     S('piano',           0, ['warmer','brighter','cleaner','wider','natural','back','bigger','upfront'],
                                     ['muddy','boxy','harsh','masked','dull','thin']),
  organ:     S('organ',           0, ['warmer','cleaner','wider','back','bigger','smoother'],
                                     ['muddy','masked','harsh','boomy','dull']),
  rhodes:    S('Rhodes',          0, ['warmer','brighter','cleaner','wider','back','natural'],
                                     ['muddy','dull','masked','harsh','thin']),
  synthlead: S('synth lead',      0, ['brighter','cleaner','wider','upfront','aggressive','back','bigger'],
                                     ['harsh','thin','masked','dull','muddy']),
  pad:       S('pad',             0, ['wider','cleaner','back','warmer','bigger','smoother'],
                                     ['muddy','masked','harsh','lifeless','phasey']),
  strings:   S('strings',         1, ['wider','warmer','brighter','cleaner','back','bigger','natural','smoother'],
                                     ['harsh','thin','muddy','masked','dull']),
  horns:     S('horns',           1, ['brighter','warmer','cleaner','wider','upfront','glued','aggressive','natural'],
                                     ['harsh','boxy','thin','masked','dull']),

  mixbus:    S('mix',             0, ['glued','louder','wider','cleaner','warmer','punchier','brighter','bigger','natural'],
                                     ['muddy','harsh','pumping','lifeless','masked','phasey','boxy'])
};

/* Grammar helper so plural names read correctly. */
const g = src => src.p
  ? { do:'do',   sound:'sound',  is:'are', it:'them', its:'their',
      has:'have', get:'get',  vanish:'disappear'  }
  : { do:'does', sound:'sounds', is:'is',  it:'it',   its:'its',
      has:'has',  get:'gets', vanish:'disappears' };

/* ------------------------------------------------------------------ *
 * Phrasings. `q` is the question as the app shows it; `a` are aliases
 * the search index matches, written the way a producer actually types
 * at 2am rather than the way a manual would.
 * ------------------------------------------------------------------ */
const INTENTS = {
  bigger:    { label:'bigger',     q:(s,v)=>`How do I make my ${s} sound bigger?`,
               a:(s,v)=>[`${s} ${v.sound} small`, `make ${s} huge`, `${s} needs more size`, `how to make ${s} massive`] },
  tighter:   { label:'tighter',    q:(s,v)=>`How do I tighten up my ${s}?`,
               a:(s,v)=>[`${s} ${v.sound} loose`, `${s} ${v.is} sloppy`, `tighten my ${s}`, `${s} ${v.sound} flabby`] },
  punchier:  { label:'punchier',   q:(s,v)=>`How do I make my ${s} hit harder?`,
               a:(s,v)=>[`${s} ${v.sound} weak`, `${s} has no punch`, `make ${s} slap`, `${s} doesn't knock`, `${s} needs impact`] },
  warmer:    { label:'warmer',     q:(s,v)=>`How do I make my ${s} warmer?`,
               a:(s,v)=>[`${s} ${v.sound} cold`, `${s} ${v.sound} digital`, `${s} needs warmth`, `add analogue warmth to ${s}`] },
  brighter:  { label:'brighter',   q:(s,v)=>`How do I make my ${s} brighter?`,
               a:(s,v)=>[`${s} ${v.sound} dark`, `open up my ${s}`, `${s} needs air`, `add sparkle to ${s}`] },
  cleaner:   { label:'cleaner',    q:(s,v)=>`How do I clean up my ${s}?`,
               a:(s,v)=>[`${s} ${v.sound} messy`, `${s} ${v.is} cluttered`, `tidy up my ${s}`, `${s} ${v.sound} unfocused`] },
  wider:     { label:'wider',      q:(s,v)=>`How do I make my ${s} wider?`,
               a:(s,v)=>[`${s} ${v.sound} narrow`, `widen my ${s}`, `${s} needs stereo width`, `${s} ${v.sound} mono`] },
  upfront:   { label:'more upfront', q:(s,v)=>`How do I get my ${s} more upfront?`,
               a:(s,v)=>[`${s} ${v.sound} too far back`, `bring my ${s} forward`, `${s} ${v.sound} distant`, `${s} needs presence`] },
  back:      { label:'further back', q:(s,v)=>`How do I push my ${s} further back?`,
               a:(s,v)=>[`${s} ${v.is} too upfront`, `${s} ${v.is} too loud in the mix`, `sit my ${s} back`, `${s} ${v.is} in my face`] },
  louder:    { label:'louder',     q:(s,v)=>`How do I make my ${s} louder without ${v.it} falling apart?`,
               a:(s,v)=>[`${s} ${v.is} too quiet`, `turn up my ${s}`, `${s} needs level`, `${s} clips when I push ${v.it}`] },
  aggressive:{ label:'more aggressive', q:(s,v)=>`How do I make my ${s} more aggressive?`,
               a:(s,v)=>[`${s} ${v.is} too polite`, `${s} needs attitude`, `make ${s} nastier`, `${s} ${v.sound} soft`] },
  smoother:  { label:'smoother',   q:(s,v)=>`How do I smooth out my ${s}?`,
               a:(s,v)=>[`${s} ${v.is} uneven`, `${s} jumps around`, `${s} ${v.is} spiky`, `even out my ${s}`] },
  glued:     { label:'glued',      q:(s,v)=>`How do I glue my ${s} together?`,
               a:(s,v)=>[`${s} ${v.sound} disconnected`, `${s} ${v.sound} like separate parts`, `glue my ${s}`, `${s} ${v.sound} pasted on`] },
  natural:   { label:'more natural', q:(s,v)=>`How do I make my ${s} sound more natural?`,
               a:(s,v)=>[`${s} ${v.sound} processed`, `${s} ${v.sound} fake`, `${s} ${v.is} over-cooked`, `${s} ${v.sound} lifeless after mixing`] }
};

const PROBLEMS = {
  muddy:    { label:'muddy',    q:(s,v)=>`Why ${v.do} my ${s} sound muddy?`,
              a:(s,v)=>[`${s} ${v.is} cloudy`, `mud in my ${s}`, `${s} ${v.sound} woolly`, `clear the mud from ${s}`] },
  boxy:     { label:'boxy',     q:(s,v)=>`Why ${v.do} my ${s} sound boxy?`,
              a:(s,v)=>[`${s} ${v.sound} like cardboard`, `boxiness in my ${s}`, `${s} ${v.sound} hollow`] },
  honky:    { label:'honky',    q:(s,v)=>`Why ${v.do} my ${s} sound honky?`,
              a:(s,v)=>[`${s} ${v.sound} nasal`, `honk in my ${s}`, `${s} ${v.sound} pinched`] },
  harsh:    { label:'harsh',    q:(s,v)=>`Why ${v.do} my ${s} sound harsh?`,
              a:(s,v)=>[`${s} ${v.is} piercing`, `${s} hurts my ears`, `${s} ${v.is} brittle`, `${s} ${v.is} fatiguing`] },
  sibilant: { label:'sibilant', q:(s,v)=>`How do I fix sibilance on my ${s}?`,
              a:(s,v)=>[`${s} ${v.has} harsh S sounds`, `de-ess my ${s}`, `${s} ${v.is} spitty`, `too much ess on ${s}`] },
  boomy:    { label:'boomy',    q:(s,v)=>`Why ${v.do} my ${s} sound boomy?`,
              a:(s,v)=>[`${s} ${v.sound} woofy`, `too much low end on ${s}`, `${s} has a low-end bump`] },
  thin:     { label:'thin',     q:(s,v)=>`Why ${v.do} my ${s} sound thin?`,
              a:(s,v)=>[`${s} ${v.sound} weak`, `${s} ${v.has} no body`, `${s} ${v.sound} small and flat`] },
  dull:     { label:'dull',     q:(s,v)=>`Why ${v.do} my ${s} sound dull?`,
              a:(s,v)=>[`${s} ${v.sound} muffled`, `${s} ${v.has} no top end`, `${s} ${v.sound} covered`] },
  pumping:  { label:'pumping',  q:(s,v)=>`Why ${v.is} my ${s} pumping?`,
              a:(s,v)=>[`${s} breathes`, `compression is pumping on my ${s}`, `${s} ${v.sound} like it's surging`] },
  phasey:   { label:'phasey',   q:(s,v)=>`Why ${v.do} my ${s} sound phasey?`,
              a:(s,v)=>[`${s} ${v.vanish} in mono`, `phase problems on my ${s}`, `${s} ${v.sound} swirly and hollow`] },
  masked:   { label:'masked',   q:(s,v)=>`Why ${v.do} my ${s} disappear in the mix?`,
              a:(s,v)=>[`${s} ${v.get} lost`, `can't hear my ${s}`, `${s} ${v.is} buried`, `${s} ${v.sound} fine soloed but not in the mix`] },
  lifeless: { label:'lifeless', q:(s,v)=>`Why ${v.do} my ${s} sound lifeless?`,
              a:(s,v)=>[`${s} ${v.is} boring`, `${s} ${v.has} no energy`, `${s} ${v.sound} flat and dead`] }
};

/* A handful of questions read wrong under the generic template. */
const OVERRIDE = {
  'mixbus|punchier':  'How do I make my whole mix hit harder?',
  'mixbus|louder':    'How do I get my mix loud without squashing it?',
  'mixbus|glued':     'How do I glue my mix together on the bus?',
  'mixbus|masked':    'Why does everything in my mix fight everything else?',
  'drumbus|glued':    'How do I glue my drums into one kit?',
  'leadvocal|wider':  'How do I widen a lead vocal without losing the centre?',
  'leadvocal|tighter':'How do I control a lead vocal that jumps around?',
  'hats|harsh':       'Why do my hats sound like white noise?',
  'double|tighter':   'How do I tighten vocal doubles that are out of time?',
  '808|smoother':     'How do I stop my 808 notes jumping in level?',
};

/* ------------------------------------------------------------------ */
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const bank = [];
const byId = new Map();

/* An answered entry whose id is already in the bank is the same question with
   its answer now written, not a duplicate: mark the existing row answered
   rather than adding a second one. */
function add(entry) {
  const prev = byId.get(entry.id);
  if (prev) {
    if (entry.status === 'answered') prev.status = 'answered';
    else console.error(`  duplicate id dropped: ${entry.id}`);
    return;
  }
  byId.set(entry.id, entry);
  bank.push(entry);
}

for (const [key, src] of Object.entries(SOURCES)) {
  const v = g(src), n = src.name;

  for (const i of src.i) {
    const t = INTENTS[i];
    add({ id: `${key}-${i}`, q: OVERRIDE[`${key}|${i}`] || t.q(n, v), aliases: t.a(n, v),
          source: key, intent: i, genres: ['all'], bucket: 'intent', status: 'todo' });
  }
  for (const x of src.x) {
    const t = PROBLEMS[x];
    add({ id: `${key}-fix-${x}`, q: OVERRIDE[`${key}|${x}`] || t.q(n, v), aliases: t.a(n, v),
          source: key, intent: 'cleaner', problem: x, genres: ['all'], bucket: 'problem', status: 'todo' });
  }
}

const generated = bank.length;

/* Hand-written sets join the same backlog, and so do the files that already
   carry finished answers — the index is the whole corpus, not only the unwritten
   part, so a `related` link can point at anything that exists. */
const ANSWERED = ['questions.seed.json', 'batch-01-drums.json', 'batch-01-vocals.json',
                  'batch-01-instruments.json', 'batch-02-gospel.json'];

for (const file of ['playbooks.json', 'concepts.json', ...ANSWERED]) {
  const p = path.join(OUT, file);
  if (!fs.existsSync(p)) { console.error(`  missing ${file} — skipped`); continue; }
  for (const q of JSON.parse(fs.readFileSync(p, 'utf8')).questions) {
    add({ id: q.id, q: q.q, aliases: q.aliases || [], source: q.source, intent: q.intent,
          problem: q.problem, genres: q.genres || ['all'], bucket: q.bucket || 'answered',
          status: ANSWERED.includes(file) ? 'answered' : 'todo' });
  }
}

/* ------------------------------------------------------------------ */
fs.writeFileSync(path.join(OUT, 'question-index.json'),
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: bank.length, questions: bank }, null, 1));

const done = bank.filter(q => q.status === 'answered').length;
const byBucket = bank.reduce((m, q) => (m[q.bucket] = (m[q.bucket] || 0) + 1, m), {});
const bySource = bank.reduce((m, q) => (m[q.source] = (m[q.source] || 0) + 1, m), {});

let md = `# PulseRoom 2.0 — Question Bank\n\n`;
md += `Generated ${new Date().toISOString().slice(0, 10)} by \`v2/build-question-bank.js\`. `;
md += `**${bank.length} questions.** This is the backlog: every entry has its final id, `;
md += `question text and search aliases. An answer is written against each one, in batches, `;
md += `and validated by \`v2/validate.js\` before it ships.\n\n`;
md += `**${done} of them are written.** A bullet marked ✓ has a finished, `;
md += `validated answer in \`v2/data/\`; the rest are scheduled.

`;
md += `| Bucket | Questions | Written |
|---|---|---|
`;
for (const [k, n] of Object.entries(byBucket).sort((a, b) => b[1] - a[1])) {
  const w = bank.filter(q => q.bucket === k && q.status === 'answered').length;
  md += `| ${k} | ${n} | ${w} |
`;
}
md += `| **Total** | **${bank.length}** | **${done}** |

---

`;

const order = [...Object.keys(SOURCES), 'concept'];
for (const key of order) {
  const rows = bank.filter(q => q.source === key);
  if (!rows.length) continue;
  md += `## ${(SOURCES[key] ? SOURCES[key].name : 'Concepts, technique and workflow').replace(/^./, c => c.toUpperCase())}  \`${key}\`  · ${rows.length}\n\n`;
  for (const q of rows) {
    const tag = q.problem ? q.problem : q.intent;
    const gen = q.genres.includes('all') ? '' : ` · ${q.genres.join(', ')}`;
    md += `- **${q.q}**  \n  \`${q.id}\` · ${tag}${gen}\n`;
  }
  md += `\n`;
}
fs.writeFileSync(path.join(__dirname, 'QUESTION_BANK.md'), md);

console.log(`\n${generated} generated · ${bank.length - generated} hand-written · ${bank.length} total`);
console.log(`sources covered: ${Object.keys(bySource).length}`);
console.log(`wrote v2/data/question-index.json and v2/QUESTION_BANK.md`);
