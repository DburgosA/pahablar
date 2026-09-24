#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/usr/local/lib/android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

if ! command -v pnpm >/dev/null 2>&1; then
  npm install --global pnpm
fi

pnpm install

if [ ! -d android ]; then
  pnpm run cap:add:android
fi

pnpm run cap:sync
chmod +x android/gradlew

(
  cd android
  ./gradlew assembleDebug
)

echo
echo "APK generado en: android/app/build/outputs/apk/debug/app-debug.apk"