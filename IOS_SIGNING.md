# iOS signing

The `ios` job signs the app automatically when the signing secrets are visible to
this repository, and falls back to an unsigned build when they are not. The build
log always prints which credentials it found (names only, never values), so one
run tells you whether the secrets are wired up.

## Secrets it looks for

Only the first three are required. Each row lists the names that are accepted —
whichever one already exists is used, so nothing needs renaming.

| What | Accepted secret names |
|---|---|
| **Certificate** — base64 of the `.p12` (Apple Distribution or Development, exported **with its private key**) | `IOS_CERTIFICATE_BASE64`, `BUILD_CERTIFICATE_BASE64`, `APPLE_CERTIFICATE_BASE64`, `IOS_DIST_CERT_BASE64`, `CERTIFICATE_BASE64`, `APPLE_DISTRIBUTION_CERT_BASE64` |
| **Certificate password** — the password set when exporting the `.p12` | `IOS_CERTIFICATE_PASSWORD`, `P12_PASSWORD`, `APPLE_CERTIFICATE_PASSWORD`, `CERT_PASSWORD`, `IOS_P12_PASSWORD` |
| **Provisioning profile** — base64 of the `.mobileprovision` | `IOS_PROVISION_PROFILE_BASE64`, `BUILD_PROVISION_PROFILE_BASE64`, `APPLE_PROVISIONING_PROFILE_BASE64`, `PROVISIONING_PROFILE_BASE64`, `IOS_PROFILE_BASE64`, `IOS_MOBILEPROVISION_BASE64` |
| Team ID *(optional — read from the profile if absent)* | `APPLE_TEAM_ID`, `IOS_TEAM_ID`, `TEAM_ID` |
| App Store Connect API key *(optional — enables automatic TestFlight upload)* | `APP_STORE_CONNECT_KEY_ID` / `ASC_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID` / `ASC_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY` / `ASC_PRIVATE_KEY` |

Team ID, bundle identifier, profile name and UUID, and the correct export method
are all read out of the provisioning profile, so they never need to be configured.

## Organization secrets

This repository lives in the **Amanorsac-Studio** organization, so organization
secrets work — provided the secret's *Repository access* includes this repo.
Check under **Organization → Settings → Secrets and variables → Actions**: a
secret set to "Selected repositories" must list PulseRoom, otherwise the job sees
nothing and silently builds unsigned.

## What the build produces

| Profile type in the secret | Result |
|---|---|
| App Store | `PulseRoom-<version>-iOS.ipa`, exported for App Store Connect. Uploads to TestFlight automatically if the API key secrets are present. |
| Ad Hoc | Signed `.ipa` installable **only** on the device UDIDs listed in the profile. |
| Development | Signed `.ipa` for registered development devices. |
| None / missing | Unsigned `.ipa` — proves the project compiles, cannot be installed. |

The build number is set to the GitHub run number, so repeated TestFlight uploads
never collide on a duplicate build version.

## Creating the secrets (if they need to be regenerated)

On a Mac with the certificate in the login keychain:

```bash
# certificate: export from Keychain Access as .p12 (include the private key), then
base64 -i Certificates.p12 | pbcopy          # paste as the certificate secret

# provisioning profile: download from developer.apple.com, then
base64 -i PulseRoom.mobileprovision | pbcopy # paste as the profile secret
```

The App Store Connect API key (`.p8`) is created under **App Store Connect →
Users and Access → Integrations → App Store Connect API**. Paste the file's
contents directly, or base64 it — the script accepts either.

## Bundle identifier

The app declares `com.amanorsac.pulseroom` in `capacitor.config.json` (matching the Google Play and App Store records). The
build overrides this with the bundle id from the provisioning profile, so a
profile issued for a different identifier just works. Wildcard profiles keep the
identifier from the Capacitor config.
