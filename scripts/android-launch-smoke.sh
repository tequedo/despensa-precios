#!/usr/bin/env bash
# Requires an already booted, empty official API36 emulator with Chrome.
# No user accounts, owner keys or production credentials are used.
set -euo pipefail
baseline_apk=${1:?baseline APK required}
fixed_apk=${2:?fixed APK required}
report_dir=${3:?report directory required}
package=${4:-ar.rindecasa.app.preview}
browser=com.android.chrome
component="$package/com.google.androidbrowserhelper.trusted.LauncherActivity"
mkdir -p "$report_dir"
command -v adb >/dev/null
adb wait-for-device
[[ "$(adb shell getprop ro.build.version.sdk | tr -d '\r')" == 36 ]]
adb shell pm path "$browser" > "$report_dir/browser-path.txt"
grep -q '^package:' "$report_dir/browser-path.txt" || { echo 'PREREQUISITE FAILED: official emulator image has no Chrome'; exit 2; }
adb shell dumpsys package "$browser" > "$report_dir/browser-package.txt"
adb shell getprop > "$report_dir/emulator-properties.txt"
# Empty CI emulator only: choose its installed Chrome as browser.
adb shell cmd role add-role-holder android.app.role.BROWSER "$browser" || true
# Chromium's documented CI flag suppresses the empty emulator's welcome flow.
# It does not alter TLS, authentication, origin verification or TWA checks.
# https://chromium.googlesource.com/chromium/src/+/main/docs/android_debugging_instructions.md
adb shell am set-debug-app --persistent "$browser"
adb shell 'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'

collect() {
  local phase=$1
  adb logcat -d -v threadtime > "$report_dir/$phase-logcat.txt" || true
  adb shell dumpsys activity activities > "$report_dir/$phase-activities.txt" || true
  adb shell dumpsys activity exit-info "$package" > "$report_dir/$phase-exit-info.txt" || true
  adb exec-out screencap -p > "$report_dir/$phase-screen.png" || true
}
launch() {
  local apk=$1 phase=$2
  adb install -r -t "$apk" > "$report_dir/$phase-install.txt"
  adb shell am force-stop "$package"
  adb shell am force-stop "$browser"
  adb logcat -c
  # am start status alone is never treated as a passing assertion.
  adb shell am start -W -n "$component" > "$report_dir/$phase-am-start.txt" 2>&1 || true
}
launch "$baseline_apk" baseline
reproduced=0
for attempt in $(seq 1 15); do
  adb logcat -d -v threadtime > "$report_dir/baseline-logcat.txt"
  if grep -q 'ManageDataLauncherActivity' "$report_dir/baseline-logcat.txt" && grep -Eq 'Component class .*does not exist|IllegalArgumentException.*[Cc]omponent|Unable to find explicit activity' "$report_dir/baseline-logcat.txt"; then
    reproduced=1; break
  fi
  sleep 1
done
collect baseline
[[ "$reproduced" == 1 ]] || { echo 'BASELINE NOT REPRODUCED: inspect logs; no fix success claim'; exit 3; }
launch "$fixed_apk" fixed
stable=0
for attempt in $(seq 1 20); do
  collect fixed
  if python3 - "$report_dir/fixed-logcat.txt" "$package" <<'CHECK'
import pathlib,re,sys
text=pathlib.Path(sys.argv[1]).read_text(errors='replace')
raise SystemExit(0 if re.search(r'FATAL EXCEPTION[\s\S]{0,1800}Process: '+re.escape(sys.argv[2]),text) else 1)
CHECK
  then
    echo 'FIX CRASHED: see fixed-logcat.txt'; exit 4
  fi
  if grep -Ei '(mResumedActivity|topResumedActivity|ResumedActivity).*com\.android\.chrome/.*(CustomTabActivity|TrustedWebActivity)' "$report_dir/fixed-activities.txt" >/dev/null; then
    stable=$((stable+1))
  else
    stable=0
  fi
  # Five consecutive observations, two seconds apart, plus crash checks.
  if [[ "$stable" -ge 5 ]]; then break; fi
  sleep 2
done
[[ "$stable" -ge 5 ]] || { echo 'FIX NOT CONFIRMED: Chrome may need first-run setup or launcher did not hand off to Custom Tabs'; exit 5; }
collect fixed
python3 - "$report_dir/result.json" "$package" <<'RESULT'
import json,pathlib,sys
pathlib.Path(sys.argv[1]).write_text(json.dumps({'package':sys.argv[2],'api':36,'baselineMissingManageDataComponentReproduced':True,'fixedBrowserActivitySustained':True,'fixedAppFatalExceptionObserved':False,'scope':'Native launch regression only; does not verify website content, OAuth, physical Samsung, TWA association or Play distribution.'},indent=2)+'\n')
RESULT
echo 'PASS: baseline missing-component crash reproduced and fixed Custom Tab handoff sustained; see result.json'
