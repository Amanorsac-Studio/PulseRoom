# PulseRoom licensing

Amanorsac Studio License Integration Standard, AMS v1.1.

PulseRoom is a licensed product. One key activates it on a machine, it checks
in hourly while open, and it keeps working for 30 days without a connection.

## Where the code is

| File | What it does |
|---|---|
| `license/signing-key.js` | The §5 studio public key, 65 bytes. The only signing key in the build (R2). |
| `license/crypto.js` | §5 proof verification. ECDSA P-256, SHA-256, raw 64-byte r‖s, verified before the body is parsed. |
| `license/store.js` | §6 device id and encrypted storage. |
| `license/client.js` | §4 server calls and §7 behaviour. Main process only. |
| `preload.js` | The four-function bridge to the window. |
| `license.js` / `license.css` | The activation screen. No license logic. |

**The window never touches the license.** The key, the proof, the device id and
the only network call all live in the Electron main process. The renderer can
ask whether it is licensed, send a key the customer typed, and free the seat —
nothing else. This is also why `index.html` keeps `default-src 'self'`: the
page never needs to reach the server, so the Content-Security-Policy did not
have to be loosened to add licensing.

## Requirements

| # | Status | Note |
|---|---|---|
| R1 shipped build uses the studio server | pass | `STUDIO_BASE_URL`. The dev override is read only when `app.isPackaged` is false, so a shipped binary cannot be redirected by an environment variable. |
| R2 studio public key, byte for byte, no other | pass | A11 confirms exactly one. |
| R3 verify before using anything | pass | The body is parsed only after the signature verifies; `store.writeProof` verifies again and is the only writer. |
| R4 "activated" only after a proof verified | pass | A 200 with an unverifiable proof reports *the license could not be verified*. |
| R5 deviceKey and licenseKey must match | pass | `proofGrants`, covered by the self-test. |
| R6 random device id, nothing personal | pass | `crypto.randomUUID()`, stored in `device.id`. No hardware serial, MAC or username. |
| R7 encrypted with the OS key store | **partial** | See deviation below. |
| R8 offline until graceUntil, then refuse | pass | Covered by the self-test. |
| R9 hourly heartbeat, failure keeps the proof | pass | A failed heartbeat re-asserts the flag and clears the error. |
| R10 deactivate this device | pass | Sidebar footer when licensed. |
| R11 bundle shares one seat | n/a | PulseRoom is a single app, not a bundle. |
| R12 §9 passed and reported before delivery | **outstanding** | Needs a test key. See below. |

### R7 deviation, stated rather than hidden

The standard asks for `CryptProtectData` with a fixed per-product entropy
string on Windows, and Keychain on macOS. PulseRoom is an Electron app and
uses Electron's `safeStorage`, which **is** DPAPI on Windows and Keychain on
macOS — the right OS facilities — but exposes no entropy parameter.

The property R7 exists for still holds: the blob is bound to the current user
account, so a copied `license-proof.dat` does not work on another machine.
What is lost is the extra per-product domain separation. Closing the gap means
a native module calling `CryptProtectData` directly, which adds a compiled
dependency to every platform build. The entropy string §8 specifies
(`PulseRoom/license/v1`) is recorded in `license/store.js` for the day that
changes. **Studio decision, not mine to make.**

## Acceptance test, §9

Run against the live server with a release build. **A1–A10 need a real test
key from the studio** — ask for one, then run them and paste the results here
before delivery (R12).

| # | Check | Status |
|---|---|---|
| A1 | Fresh machine → activation screen | **pass** — verified with no storage folder present |
| A2 | Wrong key → "key not found", nothing stored | **pass** — `PULS-0000-0000-0000` against the live server returned `no_such_license`; nothing written |
| A3 | Real key → main interface, `license-proof.dat` exists | blocked: needs a test key |
| A4 | Machine listed in My Apps | blocked: needs a test key |
| A5 | Offline reopen still works | blocked: needs A3 first |
| A6 | Heartbeat refreshes "last seen" | blocked: needs A3 first |
| A7 | Remove device, restart, seat retaken | blocked: needs A3 first |
| A8 | Both seats full → device limit message with names | blocked: needs a test key |
| A9 | Deactivate → activation screen, files gone | blocked: needs A3 first |
| A10 | Bundle | n/a |
| A11 | Exactly one signing key in the build | **pass** — `node scripts/license-audit.js dist/win-unpacked` |
| A12 | Studio URL, no local fallback in the license path | **pass** — same command |

A2 passing is worth more than it looks: it proves the shipped URL reaches the
real server and that §4's error codes are being read correctly.

### Running the checks

```bash
node scripts/license-selftest.js                      # §5 verifier, 27 assertions
node scripts/license-selftest.js --proof "<proof>"    # check one real proof by hand
node scripts/license-audit.js dist/win-unpacked       # A11 and A12
```

`license-selftest.js` proves two separate things. That the §5 algorithm is
implemented correctly, by signing a body with an ephemeral key generated in
memory and verifying the round trip. And that the studio key is actually
enforced, by feeding that same valid proof to the real verifier and requiring
it to be **rejected** — §11 records SecondOut 1.3.0 verifying against a
development key and telling every customer "Activated." A verifier that
accepts any valid signature is that bug with a different key.

Neither proves the studio key matches the live server. Only A3 does.

### A note on A11 and A12 for an Electron build

Both checks are written for the reference build, a JUCE plugin, and taking
their wording literally gives two wrong answers here:

- The key ships inside `app.asar` as JavaScript source — the *text*
  `0xcd, 0xa5, 0x7d, …` — so a search for those raw bytes finds nothing and
  A11 "fails" on a correct build. Confirmed: the raw sequence is absent from
  the asar, the source form is present.
- `PulseRoom.exe` is Chromium, which contains the word *localhost* in its own
  internals, as every Electron app does. Searching the whole package makes A12
  "fail" on something no product controls.

`scripts/license-audit.js` therefore extracts `app.asar` and asks the question
the checks exist to answer, against the app's own code rather than the runtime
it is bundled with. If the studio wants the literal byte search instead, the
key would have to ship as a binary resource.

## Open: the mobile builds are not licensed

The iOS and Android builds ship with **no licensing at all**. `build-www.js`
does not copy `preload.js` or `license/`, and `license.js` stands down when the
bridge is absent rather than locking out a store build it cannot activate.

This is deliberate and needs a studio decision, not a patch:

- The standard is written for desktop apps and plugins — DPAPI and Keychain,
  installers, a key bought on amanorsac.studio.
- Apple requires digital goods to be sold through In-App Purchase. A $19 iOS
  app activated by a key bought on your own website is not something Apple
  permits, so the mobile products are a different commercial shape, not the
  same one with a different build target.

Until that is settled, the honest options are to ship mobile as paid-on-store
with no key, or not to ship mobile. **What must not happen** is the half-built
licence path the standard's own introduction warns about.

## Still needed from the studio

1. **The app id and key prefix** (§3). The prefix is printed on every
   customer's key and is not always the obvious contraction, so it is
   deliberately not derived in code — `license/client.js` validates the shape
   only and lets the server decide whether a key is ours. `PULS` is used in
   examples here and is **not** assumed anywhere in the code.
2. **A test key**, to run A3–A9 and complete the R12 report.
3. **The R7 decision** above.
4. **The mobile decision** above.
5. For §10 delivery: the display name, version string, platforms and price,
   plus installer filenames and byte sizes — the store looks a file up by name.
