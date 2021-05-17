#!/usr/bin/env bash
set -euo pipefail


SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(realpath "$SCRIPT_DIR")"


function report() {
	echo "[$SCRIPT_NAME]" "$@"
}


cd "$SCRIPT_DIR"
rm -rf dist
mkdir dist

cp -r assets dist/
cp -r css dist/
mkdir dist/js
npm run dist-main-js
cp favicon.ico icon.png index.html site.webmanifest sw.js dist/

report "done"
