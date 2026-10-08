#!/usr/bin/env node
/* Schema checker for the question bank. Run before any batch is merged, so a
   malformed or thin entry can never reach the app.
   usage: node v2/validate.js v2/data/*.json                                   */
'use strict';

const fs = require('fs');
const path = require('path');

const SOURCES = ['kick', 'snare', 'hats', 'toms', 'overheads', 'room', 'drumbus', '808',
  'bass', 'synthbass', 'leadvocal', 'double', 'harmony', 'choir', 'rapvocal', 'adlib',
  'eguitar', 'eguitar-clean', 'aguitar', 'piano', 'organ', 'rhodes', 'synthlead', 'pad',
  'strings', 'horns', 'percussion', 'mixbus', 'concept'];
const INTENTS = ['bigger', 'tighter', 'punchier', 'warmer', 'brighter', 'cleaner', 'wider',
  'upfront', 'back', 'louder', 'aggressive', 'smoother', 'glued', 'natural', 'learn'];
const GENRES = ['afrobeats', 'highlife', 'gospel', 'ccm', 'rnb', 'hiphop', 'jazz',
  'reggae', 'pop', 'amapiano', 'all'];
const VISUALS = ['eq-curve', 'eq-mask', 'comp-attack', 'comp-envelope', 'reverb-tail',
  'delay-grid', 'stereo-field', 'sidechain', 'layering', 'chain-flow', 'levels', 'automation'];

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node v2/validate.js <file.json ...>'); process.exit(2); }

let errors = 0, warnings = 0, total = 0;
const ids = new Set();
const seenQuestions = new Map();

const err = (id, msg) => { console.log(`  ERROR  ${id}: ${msg}`); errors++; };
const warn = (id, msg) => { console.log(`  warn   ${id}: ${msg}`); warnings++; };

for (const file of files) {
  console.log(`\n${path.basename(file)}`);
  let doc;
  try { doc = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.log(`  ERROR  not valid JSON: ${e.message}`); errors++; continue; }

  for (const q of doc.questions || []) {
    total++;
    const id = q.id || '(missing id)';

    if (!q.id) err(id, 'missing id');
    else if (ids.has(q.id)) err(id, 'duplicate id');
    else ids.add(q.id);

    if (!q.q) err(id, 'missing question text');
    else {
      const key = q.q.toLowerCase().trim();
      if (seenQuestions.has(key)) warn(id, `same question text as ${seenQuestions.get(key)}`);
      else seenQuestions.set(key, id);
    }

    if (!SOURCES.includes(q.source)) err(id, `unknown source "${q.source}"`);
    if (!INTENTS.includes(q.intent)) err(id, `unknown intent "${q.intent}"`);
    for (const g of q.genres || []) if (!GENRES.includes(g)) err(id, `unknown genre "${g}"`);
    if (!(q.genres || []).length) err(id, 'no genres listed');

    // the answer has to actually be useful
    if (!q.short) err(id, 'missing short answer');
    else if (q.short.length > 140) warn(id, `short answer is ${q.short.length} chars; keep it speakable`);
    if (!Array.isArray(q.steps) || q.steps.length < 2) err(id, 'needs at least 2 steps');
    if ((q.steps || []).length > 7) warn(id, 'more than 7 steps is hard to follow');
    if (!q.why) err(id, 'missing why');
    if (!q.watch) warn(id, 'no "watch out" note');
    if (!(q.aliases || []).length) warn(id, 'no aliases — search will miss phrasings');

    if (q.visual && !VISUALS.includes(q.visual.type)) err(id, `unknown visual "${q.visual.type}"`);
    if (!q.visual) warn(id, 'no visual');

    // numbers inside params must be plausible audio values
    for (const band of (q.params && q.params.eq) || []) {
      if (band.f < 20 || band.f > 20000) err(id, `eq frequency ${band.f} Hz out of range`);
      if (band.gain !== undefined && Math.abs(band.gain) > 24) err(id, `eq gain ${band.gain} dB implausible`);
    }

    for (const r of q.related || []) if (r === q.id) warn(id, 'related links to itself');
  }
}

// related ids must point at something real
for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const q of doc.questions || [])
    for (const r of q.related || [])
      if (!ids.has(r)) warn(q.id, `related id "${r}" does not exist yet`);
}

console.log(`\n${total} entries · ${errors} errors · ${warnings} warnings`);
process.exit(errors ? 1 : 0);
