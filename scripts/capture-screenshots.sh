#!/usr/bin/env bash
# Capture screenshots of every Hexkit tool by deep-linking through them.
#
# Each entry seeds the destination tool's input via `hexkit://<action>?input=…`
# so the screenshot shows the tool actually doing something. Empty seeds are
# fine for generator tools (UUID, hash, random, …).
#
# Prereqs:
#   - macOS
#   - Hexkit.app installed + registered with Launch Services
#     (run `make dev-bundle` once, or install a published release)
#
# Usage:
#   scripts/capture-screenshots.sh                # → ~/Desktop/hexkit-screenshots-auto
#   scripts/capture-screenshots.sh ./out          # custom output dir
#   scripts/capture-screenshots.sh ./out json     # only entries matching "json"
set -euo pipefail

OUT="${1:-$HOME/Desktop/hexkit-screenshots-auto}"
FILTER="${2:-}"
mkdir -p "$OUT"

# Find Hexkit's CGWindowID via a tiny Swift one-liner (no extra deps needed
# on macOS — system Swift is sufficient).
read -r -d '' FIND_WIN_SWIFT <<'SWIFT' || true
import CoreGraphics
import Foundation
// The Hexkit process owns several auxiliary surfaces (status menu, drag
// shadows, …). The main app window is the one whose *window* name is
// "Hexkit" — match on that, not just the owner.
guard let windows = CGWindowListCopyWindowInfo(
    [.optionAll, .excludeDesktopElements],
    kCGNullWindowID
) as? [[String: Any]] else { exit(1) }
for w in windows {
    if (w["kCGWindowOwnerName"] as? String) == "Hexkit",
       (w["kCGWindowName"] as? String) == "Hexkit",
       let id = w["kCGWindowNumber"] as? Int {
        print(id); exit(0)
    }
}
exit(1)
SWIFT

window_id() {
    swift - <<<"$FIND_WIN_SWIFT" 2>/dev/null
}

urlencode() {
    python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$1"
}

# Convert a JSON file ({"key": "value", ...}) to a URL query string. Used by
# multi-field tools (e.g. PGP) whose `useToolState` fields are populated from
# tabState — `openFromDeepLink` writes every URL query param straight into
# the destination tool's tab state.
json_to_query() {
    python3 -c "
import json, urllib.parse, sys
data = json.load(open(sys.argv[1]))
print('&'.join(
    f'{urllib.parse.quote(k)}={urllib.parse.quote(str(v))}'
    for k, v in data.items()
))
" "$1"
}

capture_one() {
    local action="$1" filename="$2" seed="$3"
    local url
    if [ -n "$seed" ]; then
        if [[ "$seed" == @* ]]; then
            # @<path> → load JSON file, every key becomes a URL param.
            local params_file="${seed#@}"
            if [ ! -f "$params_file" ]; then
                echo "✗ $filename: params file not found: $params_file"
                return 1
            fi
            url="hexkit://$action?$(json_to_query "$params_file")"
        else
            url="hexkit://$action?input=$(urlencode "$seed")"
        fi
    else
        url="hexkit://$action"
    fi

    open "$url"
    # Wait for deep-link route + useLiveAction debounce + render.
    sleep 1.8

    local wid
    wid=$(window_id || true)
    if [ -z "$wid" ]; then
        echo "✗ $filename: no window"
        return 1
    fi

    local out="$OUT/$filename.png"
    # -l <id>  capture this CGWindow
    # -o       drop shadow
    # -x       no shutter sound
    screencapture -l "$wid" -o -x "$out"

    if [ -f "$out" ]; then
        echo "✓ $filename.png  ($(du -h "$out" | cut -f1))"
        return 0
    fi
    echo "✗ $filename: capture failed"
    return 1
}

# Bring Hexkit to the foreground (launches if not running).
open -a Hexkit
sleep 1.2

if ! window_id >/dev/null; then
    echo "✗ Couldn't find a Hexkit window." >&2
    echo "  Make sure Hexkit.app is installed and not minimized." >&2
    echo "  If you haven't installed it yet, run: make dev-bundle" >&2
    exit 1
fi

ok=0
skipped=0

# Tool spec table — piped straight into the while loop so bash's quirky
# parser doesn't try to balance quotes inside `$(...)` heredocs.
# Format: action <TAB> filename <TAB> seed
while IFS=$'\t' read -r action filename seed; do
    [ -z "${action:-}" ] && continue
    case "$action" in \#*) continue;; esac

    if [ -n "$FILTER" ] && ! [[ "$action $filename" == *"$FILTER"* ]]; then
        continue
    fi

    if capture_one "$action" "$filename" "${seed:-}"; then
        ok=$((ok + 1))
    else
        skipped=$((skipped + 1))
    fi
done <<'SPEC'
json.format	json-formatter	{"name":"hexkit","tools":50,"offline":true,"features":["json","jwt","hash"]}
json.minify	json-minify	{ "name": "hexkit", "tools": 50, "offline": true }
json.query	json-query	{"users":[{"id":1,"name":"Ada"},{"id":2,"name":"Bob"}],"count":2}
yaml.to_json	yaml-to-json	name: hexkit
yaml.from_json	json-to-yaml	{"name":"hexkit","version":1,"features":["json","jwt"]}
csv.to_json	csv-to-json	id,name,email
csv.from_json	json-to-csv	[{"id":1,"name":"Ada","email":"ada@example.com"},{"id":2,"name":"Bob","email":"bob@example.com"}]
php.to_json	php-to-json	a:2:{s:4:"name";s:6:"hexkit";s:7:"version";i:1;}
php.from_json	json-to-php	{"name":"hexkit","version":1}
sql.format	sql-formatter	select id, name, email from users u join orders o on o.user_id = u.id where u.active = true order by u.created_at desc limit 10;
xml.beautify	xml-beautify	<users><user id="1"><name>Ada</name></user><user id="2"><name>Bob</name></user></users>
xml.query	xml-query	<users><user id="1"><name>Ada</name></user><user id="2"><name>Bob</name></user></users>
jsx.from_html	html-to-jsx	<div class="card" onclick="alert(1)"><h2>Hexkit</h2><p>Offline developer toolbox.</p></div>
svg.to_css	svg-to-css	<svg viewBox="0 0 24 24"><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" fill="#ef6c45"/></svg>
jsoncode.generate	json-to-code	{"id":1,"name":"Ada","email":"ada@example.com","active":true,"tags":["admin","beta"]}
url.parse	url-parser	https://ada:secret@hexkit.app:8443/users/42?q=hello+world&page=2#anchor
hex.encode	hex-encode	Hexkit — offline developer toolbox.
html.encode	html-entity-encode	<script>alert(1)</script>
escape.escape	backslash-escape	first line and second line with a tab between
jwt.decode	jwt-decode	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoZXhraXQiLCJuYW1lIjoiVHJpIE5ndXllbiIsImFkbWluIjp0cnVlLCJpYXQiOjE3MDAwMDAwMDB9.s_1XbXfFW8Lq3eVK6_VlV5y6yu8aQv2Z8e3yj9YwR3M
luhn.check	luhn-checker	4111 1111 1111 1111
tlv.decode	tlv-decoder	6F34840E315041592E5359532E4444463031A522BF0C1F611D4F07A0000000031010500A4D6173746572636172648701015F2D02656E
number.all	number-base	255
time.convert	unix-time	1700000000
cron.parse	cron-parser	*/15 9-17 * * 1-5
case.convert	case-converter	hello world this is a sample
color.convert	color-converter	#ef6c45
curl.to_code	curl-to-code	curl -X POST https://api.example.com/users -H Content-Type:application/json -d {"name":"Ada"}
id.inspect	id-inspector	550e8400-e29b-41d4-a716-446655440000
hash.generate	hash-generator	The quick brown fox jumps over the lazy dog
markdown.to_html	markdown-preview	# Hexkit
lines.process	line-tools	zebra
string.inspect	string-inspector	Hello, hexkit!
qr.generate	qr-code	https://hexkit.app
diff.compare	text-diff	old line one
id.generate	id-generator
random.generate	random-string
lorem.generate	lorem-ipsum
hash.hmac	hmac-generator
regexp.test	regexp-tester
card.generate	card-generator
pgp.keygen	pgp-keygen	@scripts/screenshot-seeds/pgp-keygen.json
pgp.encrypt	pgp-encrypt	@scripts/screenshot-seeds/pgp-encrypt.json
pgp.decrypt	pgp-decrypt	@scripts/screenshot-seeds/pgp-decrypt.json
pgp.sign	pgp-sign	@scripts/screenshot-seeds/pgp-sign.json
pgp.verify	pgp-verify	@scripts/screenshot-seeds/pgp-verify.json
pgp.encrypt_sign	pgp-encrypt-sign	@scripts/screenshot-seeds/pgp-encrypt-sign.json
pgp.decrypt_verify	pgp-decrypt-verify	@scripts/screenshot-seeds/pgp-decrypt-verify.json
SPEC

echo
if [ "$skipped" -gt 0 ]; then
    echo "Captured $ok screenshot(s), skipped $skipped, into $OUT"
else
    echo "Captured $ok screenshot(s) into $OUT"
fi
