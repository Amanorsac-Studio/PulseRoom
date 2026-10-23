# PulseRoom security

Amanorsac Studio Security Standard, AMS-SEC-001 v1.0.

PulseRoom has no database and no accounts. It is **no longer true** that it
makes no network requests: adding licensing (AMS License Integration Standard
v1.1) gave it exactly one outbound call, to the studio license server. Several
statements below were written before that and have been corrected rather than
left standing. Most of the standard is about
the boundary between a client and a backend, and this app has no backend. That
removes whole classes of risk rather than mitigating them, so several rules are
not applicable rather than passing.

What is left that genuinely applies: output escaping, the Content Security
Policy, secrets, and the legal paperwork a paid app needs before a store will
take it.

## Release gate

Verify before any production push or store submission.

| Rule | Status | Evidence |
|---|---|---|
| SEC-1 input validation | pass | One free-text field in the app, the Ask search. Capped at 120 characters. Nothing is submitted anywhere. |
| SEC-2 parameterised queries | n/a | No database and no query language. Search is an in-memory scan over a bundled array. |
| SEC-3 output escaping and CSP | pass | See below. |
| SEC-4 database lockdown | n/a | No database, no storage buckets, no accounts. |
| SEC-5 consent before tracking | pass | No analytics, no pixels, no cookies, no session replay, no telemetry. The one network call is licensing, which is a function the customer initiates by entering a key, not tracking. See **What leaves the machine** below. |
| SEC-6 legal paperwork | **FAIL** | Blocks submission. The licensing data below must be declared, which it is not yet. See below. |
| SEC-9 signed installers | partial | macOS and iOS signed; Android and Windows not. See Platform notes. |
| SEC-7 secrets server-side | pass | Secret scan clean. The two matches are documentation and CI code naming secret variables, not secret values. No keys in the bundle. |
| Dependency audit | pass | `npm audit --omit=dev`: 0 vulnerabilities. |

## What leaves the machine

One request, to `https://amanorsac.studio`, on activation and about hourly
while the app is open. Nothing else, ever.

| Sent | Why | Note |
|---|---|---|
| License key | identifies the purchase | typed by the customer |
| Device id | counts the seat | random UUID made on first run. Not a hardware serial, MAC or username (R6) |
| Device label | lets the buyer recognise the machine in My Apps | the computer name — **the one field that can carry a personal name**, because people call machines after themselves |

The device label is the item that needs declaring. A machine called
`NENE-STUDIO-PC` is personal data by most readings, it is sent to the studio's
own server, and it is displayed back to the account holder. The standard
requires it (§4.1 says use the computer name) and it is genuinely useful — it
is how a buyer knows which of their two seats to free — but the privacy policy
has to say it is collected.

Nothing is stored on the device in the clear: the key and the proof are
encrypted with the OS key store (DPAPI / Keychain). The device id is plain,
which is correct — it is a random number with no meaning off this machine.

See `LICENSING.md` for the implementation, the R7 deviation, and the
acceptance-test status.

## SEC-3 in detail

The app builds its UI with `innerHTML` throughout, which the standard bans.
That ban exists because `innerHTML` renders untrusted content as markup. Here
every string passed to it is first-party content written into the repository
and reviewed by a schema validator, with one exception: the Ask search box.

That one path is escaped. `esc()` replaces `& < > "`, and the value is written
into a double-quoted attribute, so both tag injection and attribute breakout
are covered.

Verified by injection rather than by reading the code. Payloads tested in the
search field:

    <script>alert(1)</script>
    " onmouseover="alert(1)
    <img src=x onerror=alert(1)>
    <svg/onload=alert(1)>
    ' OR 1=1 --

Result: zero alerts fired, zero stray `script` nodes, zero elements carrying
`onerror` or `onmouseover`. The payload renders as text. The attribute as
written to the DOM reads:

    value="&lt;img src=x onerror=alert(1)&gt;&quot;onmouseover=&quot;alert(2)"

CSP is set in `index.html` and is as tight as the app can be:

    default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'

`script-src 'self'` with no `unsafe-inline` and no `unsafe-eval` means an
injected inline script cannot execute even if escaping were bypassed. This was
confirmed independently while testing WebAssembly, which the policy also
refuses.

If a future release adds user-authored content - saved notes, custom presets,
imported text - this analysis stops holding and every render path handling that
content must be rewritten to `textContent` or run through DOMPurify.

## SEC-6: what is missing

A paid application cannot be submitted without these. Apple requires a privacy
policy URL and will reject without one; Google requires a Data Safety
declaration that matches reality.

Corrected against the studio Security Standard section 3: PulseRoom does
**not** get its own legal pages. It lives under the studio's, which already
exist.

- [ ] Linked to the studio's `legal.html` (terms) from the store listings
- [ ] Linked to the studio's `privacy.html` (privacy, cookie notice is its §6)
- [ ] Privacy policy §5: PulseRoom sends a license key, a random device id and
      the computer name to the studio's own license server. No third-party
      processor is added — the server is Amanorsac Studio's — but the computer
      name is personal data and must be declared
- [ ] Apple privacy nutrition labels completed
- [ ] Google Play Data Safety form completed

This is no longer a "collects nothing" declaration, and filing one would be
false. The app transmits the three fields above for licensing. Both store forms
should declare that, under the app-functionality purpose, not linked to
advertising and not used for tracking — which is accurate and still a very
short form to fill in.

There is no account in the app, so the in-app account deletion requirement in
SEC-6 does not apply. "Deactivate this device" (R10) is the nearest thing: it
frees the seat on the server and deletes the stored key and proof locally.

## Platform notes

**Electron.** `contextIsolation: true` and `nodeIntegration: false` in
`main.js`, so the renderer has no access to Node. External links open in the
system browser through `setWindowOpenHandler` rather than inside the app.

**Capacitor.** The mobile build strips the CSP meta tag, because Capacitor
serves from a local origin rather than `file://`. That is a real difference in
posture between the desktop and mobile builds and should be revisited if the
app ever loads remote content.

**Signing, per platform.** Not one answer, so SEC-9 is partly met.

| Platform | State |
|---|---|
| macOS | Signed with the Developer ID certificate and notarized. The .app was already notarized; the DMG a customer downloads was not, so `spctl` rejected both disk images while the job stayed green on a warning. The DMGs are now notarized and stapled too, and that check fails the build. |
| iOS | Signed with the Apple Distribution certificate; the chain to Apple Root CA is verified in the build log. |
| Android | **Not signed.** The keystore was located by scanning secrets for keystore-shaped bytes, which matched the Apple certificate, and the build was signed with that. jarsigner called the result unsigned. Now reads named secrets only and fails if the artifact does not verify — which means the real `ANDROID_KEYSTORE_BASE64` secret has to be fixed before a Play upload. |
| Windows | **Not signed.** `WIN_CERT_P12` does not exist, so SmartScreen warns on first run. A cost decision rather than a technical blocker, and worth making before a paid release: an unsigned installer for a paid product reads as untrustworthy regardless of the code inside it. |

**Signing material must not be interchangeable.** The Android failure above was
not a signing problem, it was an identification problem: a build that accepts
whichever credential happens to parse will eventually sign with the wrong one,
and report success. Each platform's key is now named explicitly, no build step
tries a secret it was not given, and no step trial-decrypts one secret with
another.
