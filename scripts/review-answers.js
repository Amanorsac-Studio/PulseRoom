#!/usr/bin/env node
/* Semantic duplicate check for the answer bank.
 *
 * v2/validate.js catches an id used twice and a question string repeated
 * verbatim. It cannot catch two questions that mean the same thing in
 * different words, and the bank has already shipped two of those by accident:
 * gx-mixing-a-feature-verse against ab-feature-recorded-elsewhere, and a
 * second double-fix-phasey. Both were found by luck.
 *
 * This runs in two passes so the API cost stays near zero:
 *
 *   1. A local pass compares every question against every other on shared
 *      content words. No network, no key, catches the obvious cases.
 *   2. Only the pairs that survive pass 1 go to a model, which decides
 *      whether they are genuinely the same question or merely adjacent.
 *
 * Pass 2 is optional. With no key the script reports pass 1 and says the
 * adjudication was skipped, so a fork or a contributor without a key still
 * gets a useful result rather than a failure.
 *
 * Provider-agnostic, because every free tier on the list rate-limits
 * differently and they change often. Any OpenAI-compatible endpoint works:
 *
 *   LLM_BASE_URL  default https://api.groq.com/openai/v1
 *   LLM_MODEL     default openai/gpt-oss-20b
 *   LLM_API_KEY   if absent, pass 2 is skipped
 *
 * Usage: node scripts/review-answers.js [--threshold 0.62] [--max-pairs 40]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};

const THRESHOLD = parseFloat(argOf('--threshold', '0.62'));
const MAX_PAIRS = parseInt(argOf('--max-pairs', '40'), 10);

const BASE = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-20b';
const KEY = process.env.LLM_API_KEY || '';

/* ---------- load the bank the same way the app does ---------- */

global.window = {};
require(path.join(ROOT, 'answers.js'));
const ANSWERS = global.window.PR_ANSWERS;

/* ---------- pass 1: local similarity ---------- */

// words that carry no signal about what a question is actually asking
const STOP = new Set(('how do i why does my what is the a an and or to for in on at of it ' +
  'that this with without make makes get gets sound sounds does should can when where ' +
  'which if then than more less very too so but not no yes').split(/\s+/));

const tokens = s => new Set(
  String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
);

const jaccard = (a, b) => {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  const union = a.size + b.size - shared;
  return union ? shared / union : 0;
};

const prepared = ANSWERS.map(a => ({ id: a.id, q: a.q, src: a.src, t: tokens(a.q) }));

const candidates = [];
for (let i = 0; i < prepared.length; i++) {
  for (let j = i + 1; j < prepared.length; j++) {
    const score = jaccard(prepared[i].t, prepared[j].t);
    if (score >= THRESHOLD) candidates.push({ a: prepared[i], b: prepared[j], score });
  }
}
candidates.sort((x, y) => y.score - x.score);

console.log(`${ANSWERS.length} answers, ${candidates.length} pair(s) above ${THRESHOLD}\n`);

if (!candidates.length) {
  console.log('No near-duplicate questions found.');
  process.exit(0);
}

const shortlist = candidates.slice(0, MAX_PAIRS);
for (const c of shortlist) {
  console.log(`${c.score.toFixed(2)}  ${c.a.id}\n      ${c.a.q}`);
  console.log(`      ${c.b.id}\n      ${c.b.q}\n`);
}

if (!KEY) {
  console.log(`\nPass 2 skipped: LLM_API_KEY is not set.`);
  console.log(`${shortlist.length} pair(s) above threshold are listed above for a human to judge.`);
  process.exit(0);
}

/* ---------- pass 2: let a model adjudicate the shortlist ---------- */

const PROMPT = `You are reviewing a reference library of audio-mixing questions for duplicates.

Two questions are DUPLICATES only if a reader looking for one would be fully satisfied by the other's answer. Questions about the same instrument but different problems are NOT duplicates. Questions about the same problem on different instruments are NOT duplicates.

Reply with one line per pair, exactly: <index>|DUPLICATE|<reason> or <index>|DISTINCT|<reason>
Keep each reason under 15 words. No other output.`;

async function adjudicate(pairs) {
  const list = pairs.map((c, n) =>
    `${n + 1}. A: "${c.a.q}" (${c.a.src})\n   B: "${c.b.q}" (${c.b.src})`).join('\n');

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: list }]
    })
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

(async () => {
  console.log(`\nAdjudicating ${shortlist.length} pair(s) via ${MODEL} at ${BASE}\n`);
  let verdicts;
  try {
    verdicts = await adjudicate(shortlist);
  } catch (e) {
    // A free tier being rate-limited or down must not fail the build. The
    // pass-1 list above is still the useful output.
    console.log(`Pass 2 unavailable: ${e.message}`);
    console.log('Falling back to the similarity list above.');
    process.exit(0);
  }

  const dupes = [];
  for (const line of verdicts.split('\n')) {
    const m = /^\s*(\d+)\s*\|\s*(DUPLICATE|DISTINCT)\s*\|\s*(.*)$/i.exec(line);
    if (!m) continue;
    const c = shortlist[parseInt(m[1], 10) - 1];
    if (!c) continue;
    const verdict = m[2].toUpperCase();
    console.log(`${verdict === 'DUPLICATE' ? 'DUPLICATE' : 'distinct '}  ${c.a.id} / ${c.b.id}  - ${m[3]}`);
    if (verdict === 'DUPLICATE') dupes.push(c);
  }

  console.log(`\n${dupes.length} flagged as duplicate.`);
  // Reported, never fatal: the model is advisory and a false positive must
  // not block a release.
  process.exit(0);
})();
