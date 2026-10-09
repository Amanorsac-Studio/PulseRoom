/* Turn the generated playbook art into shippable covers.
 *
 * The generator hands back ~2048px JPEGs at roughly 400 KB each. Ten of those
 * is 4 MB of app download for decoration, which is not a trade worth making on
 * a phone. Each cover is displayed at most ~700px wide, so 1200px at quality 72
 * is already more than the screen can show.
 *
 * Uses Electron's nativeImage rather than sharp: Electron is already a
 * dependency of this app, and sharp would add a 30 MB native build step to the
 * project for a job we do once per batch of art.
 *
 *   npm run covers
 */
'use strict';

const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const OUT = path.join(__dirname, '..', 'v2', 'assets');
const QUALITY = 72;

if (!SRC) {
  console.error('usage: electron scripts/build-covers.js <source-dir>');
  process.exit(2);
}

/* Which generated file becomes which asset. Keyed by the ids the app uses, so
   a rename here is the only thing needed when art is replaced.
   Square playbook covers render at ~700px wide at most; the portrait pieces go
   full-bleed behind a phone screen, so they get a little more. */
const SETS = [
  { dir: 'covers', width: 1200, files: {
  '2.jpg':  'gospel-trap',          // sub cabinet, grille and condensation
  '3.jpg':  'gospel-african',       // talking drum and beaded shekere
  '4.jpg':  'gospel-contemporary',  // dark stage, in-ear packs, flight case
  '5.jpg':  'gospel-trad',          // Hammond and Leslie in a sanctuary
  '6.jpg':  'highlife',             // hollow-body guitar and trumpet
  '7.jpg':  'rnb',                  // ribbon mic against velvet
  '8.jpg':  'hiphop',               // condenser behind a pop filter
  '9.jpg':  'afrobeats',            // congas, shaker and cowbell
  '10.jpg': 'gospel-urban',         // Rhodes with the lid off
  '11.jpg': 'gospel-worship'        // acoustic guitar and stool
  }},
  { dir: 'scenes', width: 1000, files: {
    '12.jpg': 'onboard-answer',  // notebook of settings resting on a console
    '13.jpg': 'onboard-offline', // headphones under a lamp, no windows
    '14.jpg': 'onboard-ask',     // the empty chair at the desk
    '15.jpg': 'unlock'           // channel strip, faders at different heights
  }}
];

app.whenReady().then(() => {
  let before = 0, after = 0, n = 0;

  for (const set of SETS) {
    const out = path.join(OUT, set.dir);
    fs.mkdirSync(out, { recursive: true });
    console.log(`
${set.dir}/`);

    for (const [file, id] of Object.entries(set.files)) {
      const from = path.join(SRC, file);
      if (!fs.existsSync(from)) { console.error(`  missing ${file} — skipped`); continue; }

      const img = nativeImage.createFromPath(from);
      const { width, height } = img.getSize();
      if (!width) { console.error(`  could not decode ${file} — skipped`); continue; }

      const buf = img.resize({ width: set.width, quality: 'best' }).toJPEG(QUALITY);
      fs.writeFileSync(path.join(out, `${id}.jpg`), buf);

      const sz = fs.statSync(from).size;
      before += sz; after += buf.length; n++;
      console.log(`  ${id.padEnd(20)} ${width}x${height} -> ${set.width}px   ` +
                  `${(sz / 1024).toFixed(0)} KB -> ${(buf.length / 1024).toFixed(0)} KB`);
    }
  }

  console.log(`
${n} images · ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB`);
  app.quit();
});
