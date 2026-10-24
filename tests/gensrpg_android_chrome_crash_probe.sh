#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts/android
URL="https://slyen4425-cloud.github.io/Zombicide-40k/"
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
sleep 20
adb exec-out screencap -p > artifacts/android/01-home.png || true
adb shell uiautomator dump /sdcard/gensrpg-window.xml >/dev/null 2>&1 || true
adb exec-out cat /sdcard/gensrpg-window.xml > artifacts/android/window.xml 2>/dev/null || true
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
