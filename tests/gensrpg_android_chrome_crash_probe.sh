#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts/android
URL="http://127.0.0.1:8123/index.html"
# Serve the exact checked-out production runtime locally, since Android AVD
# may have no internet. Android treats loopback as a secure origin for SW.
python3 -m http.server 8123 --bind 127.0.0.1 > artifacts/android/local-http-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS -o /dev/null "$URL"; then break; fi
  sleep 1
done
adb reverse tcp:8123 tcp:8123
echo "Android loopback forwarding active; runtime is exact checkout" | tee artifacts/android/transport.txt
{
 echo "Date UTC: $(date -u +%FT%TZ)"
 echo "Android properties:"
 adb shell getprop ro.build.version.release
 adb shell getprop ro.product.model
 echo "Installed browser packages:"
 adb shell pm list packages | grep -E 'chrome|browser|webview' || true
} | tee artifacts/android/environment.txt
if ! adb shell pm list packages | grep -q 'package:com.android.chrome'; then
 echo "Android image has no Chrome browser installed: real-Chrome diagnostic unavailable." | tee artifacts/android/result.txt
 exit 3
fi
adb shell logcat -c || true
adb shell am start -W -a android.intent.action.VIEW -d "$URL" -p com.android.chrome | tee artifacts/android/launch.txt
sleep 6
adb shell uiautomator dump /sdcard/gensrpg-welcome.xml >/dev/null 2>&1 || true
adb exec-out cat /sdcard/gensrpg-welcome.xml > artifacts/android/welcome.xml 2>/dev/null || true
# Android emulator Chrome starts with an obligatory first-run welcome page.
# Locate the "Use without an account" UI element from actual accessibility bounds.
tap_onboarding_button() {
  local name="$1" target
  adb shell uiautomator dump /sdcard/gensrpg-ui.xml >/dev/null 2>&1 || true
  adb exec-out cat /sdcard/gensrpg-ui.xml > artifacts/android/current-ui.xml 2>/dev/null || true
  target=$(python3 - "$name" <<'PY'
import re,sys,xml.etree.ElementTree as ET
try:
  root=ET.parse('artifacts/android/current-ui.xml').getroot()
  for el in root.iter('node'):
    id=(el.get('resource-id') or '').lower()
    txt=(el.get('text') or '').lower()
    needle=sys.argv[1].lower()
    if needle in id or needle in txt:
      v=re.findall(r'\d+',el.get('bounds',''))
      if len(v)==4:
        print((int(v[0])+int(v[2]))//2,(int(v[1])+int(v[3]))//2)
        break
except Exception as e:
  print('',end='')
PY
)
  if [ -n "$target" ]; then
    echo "Onboarding dismiss $name at $target" | tee -a artifacts/android/launch.txt
    adb shell input tap $target
    sleep 7
    return 0
  fi
  return 1
}
tap_onboarding_button signin_fre_dismiss_button || true
tap_onboarding_button 'Not now' || true
tap_onboarding_button 'No thanks' || true
# Launch the game again only AFTER Chrome onboarding has been dismissed.
adb shell am start -W -a android.intent.action.VIEW -d "$URL" -p com.android.chrome | tee -a artifacts/android/launch.txt
sleep 22
adb exec-out screencap -p > artifacts/android/01-home.png || true
adb shell uiautomator dump /sdcard/gensrpg-window.xml >/dev/null 2>&1 || true
adb exec-out cat /sdcard/gensrpg-window.xml > artifacts/android/window.xml 2>/dev/null || true
if grep -Eiq 'Welcome to Chrome|signin_fre_dismiss_button|No internet' artifacts/android/window.xml; then
  echo "BLOCKED: Chrome welcome or offline UI still visible; game was not opened" | tee artifacts/android/result.txt
  exit 4
fi
echo "First-run onboarding no longer visible; verify game UI in screenshot." | tee -a artifacts/android/launch.txt
size=$(adb shell wm size | sed -n 's/.*Physical size: \([0-9]\+x[0-9]\+\).*/\1/p' | head -1 | tr -d '\r')
w=$(echo "$size" | cut -dx -f1)
h=$(echo "$size" | cut -dx -f2)
if [[ ! "$w" =~ ^[0-9]+$ || ! "$h" =~ ^[0-9]+$ ]]; then w=1080; h=2400;fi
echo "Resolution: $w x $h" | tee artifacts/android/taps.txt
for p in "50 38" "50 53" "50 69" "50 84"; do
 read -r px py <<< "$p"
 x=$((w*px/100));y=$((h*py/100))
 echo "Tap screen $x $y $(date -u +%T)" | tee -a artifacts/android/taps.txt
 adb shell input tap "$x" "$y"
 sleep 6
 adb exec-out screencap -p > "artifacts/android/tap-$px-$py.png" || true
 echo "Chrome pid: $(adb shell pidof com.android.chrome || true)" | tee -a artifacts/android/taps.txt
done
adb shell input swipe $((w/2)) $((h*7/10)) $((w/2)) $((h*2/10)) 550
sleep 5
adb exec-out screencap -p > artifacts/android/after-swipe.png || true
adb shell dumpsys meminfo com.android.chrome > artifacts/android/chrome-meminfo.txt || true
adb shell dumpsys gfxinfo com.android.chrome > artifacts/android/chrome-gfxinfo.txt || true
adb shell logcat -d -v time > artifacts/android/logcat.txt || true
grep -Ei 'FATAL EXCEPTION|fatal signal|ANR in com\.android\.chrome|Process com\.android\.chrome.*has died|crash_dump|chromium.*crash' artifacts/android/logcat.txt | tail -90 > artifacts/android/crash-signatures.txt || true
echo "Chrome PID at end: $(adb shell pidof com.android.chrome || true)" | tee artifacts/android/result.txt
echo "Crash-signature count: $(wc -l < artifacts/android/crash-signatures.txt)" | tee -a artifacts/android/result.txt
cat artifacts/android/crash-signatures.txt | tail -20 || true
echo "Android emulator screenshots, logcat and Chrome memory captured for review."
