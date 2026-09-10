#!/bin/bash
# ==============================================================================
# PulseRoom — iOS build (signed when credentials are present, unsigned otherwise)
#
# Signing inputs (env, all optional — set from GitHub secrets by the workflow):
#   IOS_CERT_B64       base64 of the Apple Distribution/Development .p12
#   IOS_CERT_PASSWORD  password that protects the .p12
#   IOS_PROFILE_B64    base64 of the .mobileprovision
#
# TestFlight upload (env, optional — only used for App Store profiles):
#   ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY   App Store Connect API key
#
# Everything else (team id, bundle id, profile name/uuid, export method) is
# derived from the provisioning profile itself, so no extra secrets are needed.
# ==============================================================================
set -euo pipefail

APP_VERSION="${APP_VERSION:-1.0.0}"
BUILD_NUMBER="${GITHUB_RUN_NUMBER:-1}"
WORK="${GITHUB_WORKSPACE:-$(pwd)}"
IOS_DIR="$WORK/ios/App"
OUT_UNSIGNED="$WORK/PulseRoom-${APP_VERSION}-iOS-unsigned.ipa"
OUT_SIGNED="$WORK/PulseRoom-${APP_VERSION}-iOS.ipa"

b64decode() { tr -d '\n\r \t' | openssl base64 -d -A; }
have()      { [ -n "${1:-}" ]; }

cd "$IOS_DIR"
if [ -e App.xcworkspace ]; then XCPROJ=(-workspace App.xcworkspace); else XCPROJ=(-project App.xcodeproj); fi
echo "Xcode: $(xcodebuild -version | head -1)"

# ------------------------------------------------------------------ unsigned --
if ! have "${IOS_CERT_B64:-}" || ! have "${IOS_PROFILE_B64:-}"; then
  echo "::notice::No signing credentials provided — building UNSIGNED (cannot be installed on devices)."
  xcodebuild "${XCPROJ[@]}" -scheme App -configuration Release \
    -sdk iphoneos -destination 'generic/platform=iOS' \
    -derivedDataPath build build \
    CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
    2>&1 | tee "$WORK/ios-build.log" | tail -40
  cd build/Build/Products/Release-iphoneos
  rm -rf Payload && mkdir Payload && cp -r App.app Payload/
  zip -qr "$OUT_UNSIGNED" Payload
  echo "ios_signed=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo "Wrote $OUT_UNSIGNED"
  exit 0
fi

# -------------------------------------------------------------- keychain prep --
echo "--- installing certificate and provisioning profile ---"
TMP="${RUNNER_TEMP:-/tmp}"
CERT_PATH="$TMP/ios_cert.p12"
PROFILE_PATH="$TMP/ios_profile.mobileprovision"
KEYCHAIN="$TMP/pulseroom-signing.keychain-db"
KEYCHAIN_PASS="$(openssl rand -hex 24)"

printf '%s' "$IOS_CERT_B64"    | b64decode > "$CERT_PATH"
printf '%s' "$IOS_PROFILE_B64" | b64decode > "$PROFILE_PATH"

security create-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security import "$CERT_PATH" -P "${IOS_CERT_PASSWORD:-}" -A -t cert -f pkcs12 \
  -k "$KEYCHAIN" -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASS" "$KEYCHAIN" >/dev/null
security list-keychains -d user -s "$KEYCHAIN" $(security list-keychains -d user | tr -d '"')

IDENTITY="$(security find-identity -v -p codesigning "$KEYCHAIN" | grep -o '"[^"]*"' | head -1 | tr -d '"' || true)"
if [ -z "$IDENTITY" ]; then
  echo "::error::The .p12 imported but contains no code-signing identity. Export it again from Keychain Access including its private key."
  exit 1
fi
echo "Signing identity: $IDENTITY"

# ------------------------------------------------- read the provisioning profile --
PLIST="$TMP/profile.plist"
security cms -D -i "$PROFILE_PATH" > "$PLIST"
pb() { /usr/libexec/PlistBuddy -c "Print $1" "$PLIST" 2>/dev/null || true; }

PROFILE_UUID="$(pb ':UUID')"
PROFILE_NAME="$(pb ':Name')"
TEAM_ID="${APPLE_TEAM_ID:-$(pb ':TeamIdentifier:0')}"
APP_ID="$(pb ':Entitlements:application-identifier')"
BUNDLE_ID="${APP_ID#"$TEAM_ID".}"
GET_TASK_ALLOW="$(pb ':Entitlements:get-task-allow')"
PROVISIONS_ALL="$(pb ':ProvisionsAllDevices')"
HAS_DEVICES="no"; /usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices' "$PLIST" >/dev/null 2>&1 && HAS_DEVICES="yes"

# a wildcard profile (com.example.*) cannot dictate the bundle id — keep ours
case "$BUNDLE_ID" in
  *\*) BUNDLE_ID="$(node -e "process.stdout.write(require('$WORK/capacitor.config.json').appId)")" ;;
esac

if [ "$PROVISIONS_ALL" = "true" ]; then      METHOD_NEW=enterprise;         METHOD_OLD=enterprise
elif [ "$HAS_DEVICES" = "yes" ] && [ "$GET_TASK_ALLOW" = "true" ]; then
                                             METHOD_NEW=debugging;          METHOD_OLD=development
elif [ "$HAS_DEVICES" = "yes" ]; then        METHOD_NEW=release-testing;    METHOD_OLD=ad-hoc
else                                         METHOD_NEW=app-store-connect;  METHOD_OLD=app-store
fi

mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$PROFILE_PATH" "$HOME/Library/MobileDevice/Provisioning Profiles/$PROFILE_UUID.mobileprovision"

echo "Profile   : $PROFILE_NAME ($PROFILE_UUID)"
echo "Team      : $TEAM_ID"
echo "Bundle id : $BUNDLE_ID"
echo "Export as : $METHOD_OLD"

# ------------------------------------------------------------------- archive --
ARCHIVE="$TMP/App.xcarchive"
EXPORT_DIR="$TMP/export"
rm -rf "$ARCHIVE" "$EXPORT_DIR"

xcodebuild "${XCPROJ[@]}" -scheme App -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" archive \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PROVISIONING_PROFILE_SPECIFIER="$PROFILE_UUID" \
  CODE_SIGN_IDENTITY="$IDENTITY" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  MARKETING_VERSION="$APP_VERSION" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  OTHER_CODE_SIGN_FLAGS="--keychain $KEYCHAIN" \
  2>&1 | tee "$WORK/ios-build.log" | tail -40

# -------------------------------------------------------------------- export --
write_export_plist() {
  cat > "$TMP/ExportOptions.plist" <<PLIST_END
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>$1</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>$IDENTITY</string>
  <key>provisioningProfiles</key>
  <dict><key>$BUNDLE_ID</key><string>$PROFILE_UUID</string></dict>
  <key>stripSwiftSymbols</key><true/>
  <key>compileBitcode</key><false/>
  <key>uploadSymbols</key><true/>
</dict>
</plist>
PLIST_END
}

export_archive() {
  write_export_plist "$1"
  xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath "$EXPORT_DIR" \
    -exportOptionsPlist "$TMP/ExportOptions.plist" \
    -allowProvisioningUpdates 2>&1 | tail -30
}

# Xcode 15.4+ renamed the export methods; try the new name, fall back to legacy.
if ! export_archive "$METHOD_NEW"; then
  echo "::notice::Export with '$METHOD_NEW' failed — retrying with legacy name '$METHOD_OLD'."
  export_archive "$METHOD_OLD"
fi

IPA="$(find "$EXPORT_DIR" -name '*.ipa' -maxdepth 1 | head -1)"
if [ -z "$IPA" ]; then echo "::error::Export produced no .ipa"; exit 1; fi
mv "$IPA" "$OUT_SIGNED"
echo "Wrote $OUT_SIGNED"

echo "--- verifying signature ---"
rm -rf "$TMP/verify" && mkdir -p "$TMP/verify"
unzip -q "$OUT_SIGNED" -d "$TMP/verify"
codesign -dv --verbose=2 "$TMP/verify/Payload/App.app" 2>&1 | sed -n '1,12p'

{
  echo "ios_signed=true"
  echo "ios_method=$METHOD_OLD"
  echo "ios_bundle=$BUNDLE_ID"
} >> "${GITHUB_OUTPUT:-/dev/null}"

# --------------------------------------------------------- TestFlight upload --
if [ "$METHOD_OLD" = "app-store" ] && have "${ASC_KEY_ID:-}" && have "${ASC_ISSUER_ID:-}" && have "${ASC_PRIVATE_KEY:-}"; then
  echo "--- uploading to App Store Connect (TestFlight) ---"
  KEYDIR="$HOME/.appstoreconnect/private_keys"
  mkdir -p "$KEYDIR"
  if printf '%s' "$ASC_PRIVATE_KEY" | grep -q "BEGIN PRIVATE KEY"; then
    printf '%s\n' "$ASC_PRIVATE_KEY" > "$KEYDIR/AuthKey_${ASC_KEY_ID}.p8"
  else
    printf '%s' "$ASC_PRIVATE_KEY" | b64decode > "$KEYDIR/AuthKey_${ASC_KEY_ID}.p8"
  fi
  chmod 600 "$KEYDIR/AuthKey_${ASC_KEY_ID}.p8"

  xcrun altool --validate-app -f "$OUT_SIGNED" -t ios \
    --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" 2>&1 | tail -20
  xcrun altool --upload-app -f "$OUT_SIGNED" -t ios \
    --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" 2>&1 | tail -20
  echo "Uploaded build $BUILD_NUMBER — it appears in TestFlight after Apple finishes processing."
  echo "ios_uploaded=true" >> "${GITHUB_OUTPUT:-/dev/null}"
else
  if [ "$METHOD_OLD" = "app-store" ]; then
    echo "::notice::Signed for the App Store. Add the App Store Connect API key secrets to upload to TestFlight automatically."
  fi
fi
