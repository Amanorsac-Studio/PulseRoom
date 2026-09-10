#!/bin/bash
# ==============================================================================
# PulseRoom — iOS build.
#
# Inputs come from scripts/ios-discover.js (via GITHUB_ENV):
#   IOS_CERT_PATH / IOS_CERT_PASSWORD   the signing certificate
#   IOS_PROFILE_PATH                    optional provisioning profile
#   ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID   App Store Connect API key
#   APPLE_TEAM_ID
#
# With a profile the build signs manually; with only an API key it signs
# automatically and lets Xcode create/download the profile. With neither it
# builds unsigned so the compile is still verified.
# ==============================================================================
set -euo pipefail

APP_VERSION="${APP_VERSION:-1.0.0}"
BUILD_NUMBER="${GITHUB_RUN_NUMBER:-1}"
WORK="${GITHUB_WORKSPACE:-$(pwd)}"
TMP="${RUNNER_TEMP:-/tmp}"
IOS_DIR="$WORK/ios/App"
OUT_UNSIGNED="$WORK/PulseRoom-${APP_VERSION}-iOS-unsigned.ipa"
OUT_SIGNED="$WORK/PulseRoom-${APP_VERSION}-iOS.ipa"

have() { [ -n "${1:-}" ]; }
BUNDLE_ID="$(node -e "process.stdout.write(require('$WORK/capacitor.config.json').appId)")"

cd "$IOS_DIR"
if [ -e App.xcworkspace ]; then XCPROJ=(-workspace App.xcworkspace); else XCPROJ=(-project App.xcodeproj); fi
echo "Xcode: $(xcodebuild -version | head -1)"
echo "Bundle id: $BUNDLE_ID"

# ------------------------------------------------------------------ unsigned --
if ! have "${IOS_CERT_PATH:-}"; then
  echo "::notice::No usable certificate — building UNSIGNED (cannot be installed on devices)."
  xcodebuild "${XCPROJ[@]}" -scheme App -configuration Release \
    -sdk iphoneos -destination 'generic/platform=iOS' \
    -derivedDataPath build build \
    CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
    2>&1 | tee "$WORK/ios-build.log" | tail -30
  cd build/Build/Products/Release-iphoneos
  rm -rf Payload && mkdir Payload && cp -r App.app Payload/
  zip -qr "$OUT_UNSIGNED" Payload
  echo "ios_signed=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

# -------------------------------------------------------------- keychain prep --
echo "--- importing the certificate ---"
KEYCHAIN="$TMP/pulseroom-signing.keychain-db"
KEYCHAIN_PASS="$(openssl rand -hex 24)"
security create-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security import "$IOS_CERT_PATH" -P "${IOS_CERT_PASSWORD:-}" -A -t cert -f pkcs12 \
  -k "$KEYCHAIN" -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASS" "$KEYCHAIN" >/dev/null
security list-keychains -d user -s "$KEYCHAIN" $(security list-keychains -d user | tr -d '"')

IDENTITY="$(security find-identity -v -p codesigning "$KEYCHAIN" | grep -o '"[^"]*"' | head -1 | tr -d '"' || true)"
if [ -z "$IDENTITY" ]; then
  echo "::error::The certificate imported but carries no private key. Re-export the .p12 from Keychain Access including the key."
  exit 1
fi
echo "Signing identity: $IDENTITY"

# ------------------------------------------------------------- signing mode --
AUTH=()
if have "${ASC_KEY_PATH:-}"; then
  AUTH=(-allowProvisioningUpdates
        -authenticationKeyPath "$ASC_KEY_PATH"
        -authenticationKeyID "$ASC_KEY_ID"
        -authenticationKeyIssuerID "$ASC_ISSUER_ID")
fi

SIGN_ARGS=()
METHOD_NEW=app-store-connect
METHOD_OLD=app-store
EXPORT_STYLE=automatic

if have "${IOS_PROFILE_PATH:-}"; then
  PLIST="$TMP/profile.plist"
  security cms -D -i "$IOS_PROFILE_PATH" > "$PLIST"
  pb() { /usr/libexec/PlistBuddy -c "Print $1" "$PLIST" 2>/dev/null || true; }
  PROFILE_UUID="$(pb ':UUID')"
  TEAM_ID="${APPLE_TEAM_ID:-$(pb ':TeamIdentifier:0')}"
  APP_ID="$(pb ':Entitlements:application-identifier')"
  PROFILE_BUNDLE="${APP_ID#"$TEAM_ID".}"
  case "$PROFILE_BUNDLE" in *\*) ;; *) BUNDLE_ID="$PROFILE_BUNDLE" ;; esac
  GET_TASK_ALLOW="$(pb ':Entitlements:get-task-allow')"
  HAS_DEVICES="no"; /usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices' "$PLIST" >/dev/null 2>&1 && HAS_DEVICES="yes"
  if [ "$(pb ':ProvisionsAllDevices')" = "true" ]; then METHOD_NEW=enterprise;      METHOD_OLD=enterprise
  elif [ "$HAS_DEVICES" = "yes" ] && [ "$GET_TASK_ALLOW" = "true" ]; then
                                                   METHOD_NEW=debugging;         METHOD_OLD=development
  elif [ "$HAS_DEVICES" = "yes" ]; then            METHOD_NEW=release-testing;    METHOD_OLD=ad-hoc
  fi
  mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
  cp "$IOS_PROFILE_PATH" "$HOME/Library/MobileDevice/Provisioning Profiles/$PROFILE_UUID.mobileprovision"
  SIGN_ARGS=(CODE_SIGN_STYLE=Manual PROVISIONING_PROFILE_SPECIFIER="$PROFILE_UUID" CODE_SIGN_IDENTITY="$IDENTITY")
  EXPORT_STYLE=manual
  echo "Signing manually with the supplied profile ($METHOD_OLD)."
else
  TEAM_ID="${APPLE_TEAM_ID:-}"
  if [ -z "$TEAM_ID" ] || [ ${#AUTH[@]} -eq 0 ]; then
    echo "::error::Without a provisioning profile, both APPLE_TEAM_ID and an App Store Connect API key are required."
    exit 1
  fi
  SIGN_ARGS=(CODE_SIGN_STYLE=Automatic)
  echo "Signing automatically — Xcode will create the profile for $BUNDLE_ID via the API key."
fi

# ------------------------------------------------------------------- archive --
ARCHIVE="$TMP/App.xcarchive"
EXPORT_DIR="$TMP/export"
rm -rf "$ARCHIVE" "$EXPORT_DIR"

xcodebuild "${XCPROJ[@]}" -scheme App -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" archive \
  "${AUTH[@]}" "${SIGN_ARGS[@]}" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  MARKETING_VERSION="$APP_VERSION" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  OTHER_CODE_SIGN_FLAGS="--keychain $KEYCHAIN" \
  2>&1 | tee "$WORK/ios-build.log" | tail -40

# -------------------------------------------------------------------- export --
write_export_plist() {
  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
    echo '<plist version="1.0"><dict>'
    echo "  <key>method</key><string>$1</string>"
    echo "  <key>teamID</key><string>$TEAM_ID</string>"
    echo "  <key>signingStyle</key><string>$EXPORT_STYLE</string>"
    if [ "$EXPORT_STYLE" = "manual" ]; then
      echo "  <key>signingCertificate</key><string>$IDENTITY</string>"
      echo "  <key>provisioningProfiles</key><dict><key>$BUNDLE_ID</key><string>$PROFILE_UUID</string></dict>"
    fi
    echo '  <key>stripSwiftSymbols</key><true/>'
    echo '  <key>compileBitcode</key><false/>'
    echo '  <key>uploadSymbols</key><true/>'
    echo '</dict></plist>'
  } > "$TMP/ExportOptions.plist"
}

export_archive() {
  write_export_plist "$1"
  xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath "$EXPORT_DIR" \
    -exportOptionsPlist "$TMP/ExportOptions.plist" "${AUTH[@]}" 2>&1 | tail -25
}

if ! export_archive "$METHOD_NEW"; then
  echo "::notice::Export as '$METHOD_NEW' failed — retrying with the legacy name '$METHOD_OLD'."
  export_archive "$METHOD_OLD"
fi

IPA="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -1)"
[ -n "$IPA" ] || { echo "::error::Export produced no .ipa"; exit 1; }
mv "$IPA" "$OUT_SIGNED"
echo "Wrote $(basename "$OUT_SIGNED")"

rm -rf "$TMP/verify" && mkdir -p "$TMP/verify"
unzip -q "$OUT_SIGNED" -d "$TMP/verify"
codesign -dv --verbose=2 "$TMP/verify/Payload/App.app" 2>&1 | sed -n '1,10p'

{ echo "ios_signed=true"; echo "ios_method=$METHOD_OLD"; } >> "${GITHUB_OUTPUT:-/dev/null}"

# --------------------------------------------------------- TestFlight upload --
if [ "$METHOD_OLD" = "app-store" ] && have "${ASC_KEY_PATH:-}"; then
  echo "--- uploading to App Store Connect ---"
  KEYDIR="$HOME/.appstoreconnect/private_keys"
  mkdir -p "$KEYDIR" && cp "$ASC_KEY_PATH" "$KEYDIR/AuthKey_${ASC_KEY_ID}.p8"
  xcrun altool --upload-app -f "$OUT_SIGNED" -t ios \
    --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" 2>&1 | tail -15
  echo "Uploaded build $BUILD_NUMBER — it appears in TestFlight once Apple finishes processing."
fi
