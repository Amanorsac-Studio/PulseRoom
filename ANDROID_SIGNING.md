# Android signing and Google Play

Google Play no longer accepts standalone APKs for new apps — the Play Console
requires an **Android App Bundle** (`.aab`), and it must be **release-signed**.
A debug build is rejected outright.

The `android` job now produces both, from one run:

| File | Use |
|---|---|
| `PulseRoom-<version>-Android.aab` | Upload this to the Play Console. Google repackages it per device, so downloads are smaller than an APK. |
| `PulseRoom-<version>-Android.apk` | Release-signed APK for direct download (Cloudflare). Play does not accept this; phones install it fine. |

If the keystore secrets are missing, the job falls back to a debug APK named
`…-Android-debug.apk` and prints a warning — that build is for sideloading only.

## Secrets it looks for

Whichever name already exists is used, so nothing needs renaming.

| What | Accepted secret names |
|---|---|
| **Keystore** — base64 of the `.jks` / `.keystore` upload key | `ANDROID_KEYSTORE_BASE64`, `ANDROID_SIGNING_KEY_BASE64`, `KEYSTORE_BASE64`, `UPLOAD_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_B64`, `SIGNING_KEY` |
| **Keystore password** | `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_STORE_PASSWORD`, `KEYSTORE_PASSWORD`, `ANDROID_SIGNING_STORE_PASSWORD`, `STORE_PASSWORD` |
| **Key alias** | `ANDROID_KEY_ALIAS`, `KEY_ALIAS`, `ANDROID_ALIAS`, `ANDROID_SIGNING_KEY_ALIAS`, `ALIAS` |
| **Key password** *(optional — falls back to the keystore password)* | `ANDROID_KEY_PASSWORD`, `KEY_PASSWORD`, `ANDROID_SIGNING_KEY_PASSWORD` |

Organization secrets work, provided the secret's *Repository access* includes
this repository.

## Version numbers

`versionName` comes from `package.json`, and `versionCode` is set to the GitHub
run number, which always increases. Play rejects an upload whose `versionCode`
is not higher than the previous one, so if an earlier upload used a large
`versionCode`, tell me and I will offset it.

## Creating an upload keystore (only if you do not have one)

```bash
keytool -genkey -v -keystore pulseroom-upload.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias upload
base64 -i pulseroom-upload.jks | pbcopy    # paste as the keystore secret
```

**Back this file up.** With Play App Signing you can ask Google to reset a lost
upload key, but without it that recovery is the only route — and if the app was
published without Play App Signing, losing the keystore means you can never
update the listing again.

If PulseRoom already exists in the Play Console, you must sign with the **same
upload key** that was used for the first upload; a different key is rejected.

## Uploading

1. Play Console → your app → **Testing** (internal/closed) or **Production** → *Create new release*.
2. Upload `PulseRoom-<version>-Android.aab`.
3. Fill in the release notes and roll out.

Internal testing is the fastest path: the build is available to your testers
within minutes and does not need full store review.
