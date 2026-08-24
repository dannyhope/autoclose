#!/usr/bin/env bash
# Resolve a free local TCP port from the repo's preferred .dev-port.
# Usage:
#   ./scripts/resolve-dev-port.sh          # print port on stdout
#   PORT=$(./scripts/resolve-dev-port.sh)  # capture for vite/next/etc.
# Exit 0 with the port on stdout. Warnings go to stderr.

set -euo pipefail

PORT_MIN=5200
PORT_MAX=5999
MAX_ATTEMPTS=200

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(basename "$SCRIPT_DIR")" == "scripts" ]]; then
	ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
	ROOT="$(pwd)"
fi

cd "$ROOT"

port_in_use() {
	local port="$1"
	if command -v lsof >/dev/null 2>&1; then
		lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
		return $?
	fi
	(echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
}

hash_name_to_port() {
	local name="$1"
	local sum
	sum="$(printf '%s' "$name" | cksum | awk '{print $1}')"
	local span=$((PORT_MAX - PORT_MIN + 1))
	echo $((PORT_MIN + (sum % span)))
}

ensure_preferred_file() {
	local file="$ROOT/.dev-port"
	if [[ -f "$file" ]]; then
		local raw
		raw="$(tr -d '[:space:]' <"$file")"
		if [[ "$raw" =~ ^[0-9]+$ ]] && ((raw >= 1 && raw <= 65535)); then
			echo "$raw"
			return
		fi
		echo "warn: .dev-port is invalid; regenerating from repo name" >&2
	fi
	local name
	name="$(basename "$ROOT")"
	local preferred
	preferred="$(hash_name_to_port "$name")"
	printf '%s\n' "$preferred" >"$file"
	echo "$preferred"
}

preferred="$(ensure_preferred_file)"
candidate="$preferred"
attempts=0

while ((attempts < MAX_ATTEMPTS)); do
	if ! port_in_use "$candidate"; then
		if ((candidate != preferred)); then
			echo "Port ${preferred} in use — using ${candidate} instead" >&2
		fi
		echo "$candidate"
		exit 0
	fi
	candidate=$((candidate + 1))
	if ((candidate > 65535)); then
		candidate=$PORT_MIN
	fi
	attempts=$((attempts + 1))
done

echo "error: could not find a free port near ${preferred} after ${MAX_ATTEMPTS} attempts" >&2
exit 1
