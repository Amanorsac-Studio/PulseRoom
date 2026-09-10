#!/bin/bash
# ==============================================================================
# Captures App Store screenshots at true device resolution using the iOS
# Simulator, which is the only way to hit Apple's exact required pixel sizes.
#
#   iPhone 6.9"  -> 1290x2796 or 1320x2868
#   iPad 13"     -> 2048x2732 or 2064x2752   (required because the app is universal)
#
# The app is built once for the simulator; for each screen the bundled
# index.html is patched to open on that page, then reinstalled and captured.
# ==============================================================================
set -euo pipefail

WORK="${GITHUB_WORKSPACE:-$(pwd)}"
OUT="$WORK/appstore-screenshots"
IOS_DIR="$WORK/ios/App"
mkdir -p "$OUT"

cd "$IOS_DIR"
if [ -e App.xcworkspace ]; then XCPROJ=(-workspace App.xcworkspace); else XCPROJ=(-project App.xcodeproj); fi

echo "--- building for the simulator (no signing needed) ---"
xcodebuild "${XCPROJ[@]}" -scheme App -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build build \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -15

APP="$(find build/Build/Products -maxdepth 2 -name 'App.app' | head -1)"
[ -n "$APP" ] || { echo "::error::simulator build produced no App.app"; exit 1; }
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")"
echo "Built $APP  ($BUNDLE_ID)"

# ---------------------------------------------------------- device selection --
pick_device_type() {   # $1 = node filter expression over the name
  xcrun simctl list devicetypes -j | node -e "
    let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      const types=JSON.parse(d).devicetypes.filter(t=>$1);
      if(!types.length){console.log('');return;}
      const num=n=>parseInt((n.match(/\\d+/)||[0])[0],10);
      types.sort((a,b)=>num(b.name)-num(a.name));
      console.log(types[0].identifier+'|'+types[0].name);
    })"
}
LATEST_RUNTIME="$(xcrun simctl list runtimes -j | node -e "
  let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
    const r=JSON.parse(d).runtimes.filter(r=>r.isAvailable&&/iOS/.test(r.name));
    r.sort((a,b)=>parseFloat(b.version)-parseFloat(a.version));
    console.log(r.length?r[0].identifier:'');
  })")"
[ -n "$LATEST_RUNTIME" ] || { echo "::error::no iOS simulator runtime available"; exit 1; }
echo "Runtime: $LATEST_RUNTIME"

shoot_device() {          # $1 device-type|name   $2 label   $3.. pages
  local spec="$1"; shift
  local label="$1"; shift
  local type="${spec%%|*}" name="${spec##*|}"
  echo "--- $label: $name ---"
  local udid
  udid="$(xcrun simctl create "shot-$label" "$type" "$LATEST_RUNTIME")"
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b >/dev/null 2>&1 || sleep 20
  xcrun simctl status_bar "$udid" override --time "9:41" \
    --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 >/dev/null 2>&1 || true

  local n=1
  for page in "$@"; do
    # open the app on the requested page
    python3 - "$APP/public/index.html" "$page" <<'PY'
import sys, re
path, page = sys.argv[1], sys.argv[2]
html = open(path, encoding='utf-8').read()
html = re.sub(r'<script>window\.__startPage=.*?</script>\n?', '', html)
html = html.replace('<script src="app.js">',
                    '<script>window.__startPage=%r;</script>\n  <script src="app.js">' % page)
open(path, 'w', encoding='utf-8').write(html)
PY
    xcrun simctl install "$udid" "$APP"
    xcrun simctl launch "$udid" "$BUNDLE_ID" >/dev/null
    sleep 6
    local file="$OUT/${label}-${n}-${page}.png"
    xcrun simctl io "$udid" screenshot "$file" >/dev/null 2>&1
    xcrun simctl terminate "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
    echo "  $(basename "$file")  $(sips -g pixelWidth -g pixelHeight "$file" | awk '/pixel/{printf "%s ", $2}')"
    n=$((n+1))
  done
  xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true
  xcrun simctl delete "$udid" >/dev/null 2>&1 || true
}

IPHONE="$(pick_device_type "/iPhone/.test(t.name) && /Pro Max|Plus|Max/.test(t.name)")"
[ -n "$IPHONE" ] || IPHONE="$(pick_device_type "/iPhone/.test(t.name)")"
IPAD="$(pick_device_type "/iPad Pro/.test(t.name) && /13-inch|12\.9/.test(t.name)")"
[ -n "$IPAD" ] || IPAD="$(pick_device_type "/iPad/.test(t.name)")"

shoot_device "$IPHONE" "iphone" delay reverb eq comp reference
shoot_device "$IPAD"   "ipad"   delay reverb eq comp reference

echo
echo "--- captured ---"
ls -la "$OUT"
