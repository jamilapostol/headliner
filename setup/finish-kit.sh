#!/usr/bin/env bash
# Wires Kit up in one command.
#
#   bash setup/finish-kit.sh <KIT_V4_API_KEY>
#
# Kit → Settings → Developer → V4 API key. The key goes into .env.local and
# to Kit's API and nowhere else; it is never echoed.
#
# The five form ids are discovered from your account rather than copied by
# hand out of five URLs — the script lists your forms, matches them to the
# four free tools plus the all-tools form by name, and writes what it finds.
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${1:-}"
if [ -z "$KEY" ]; then echo "Usage: bash setup/finish-kit.sh <KIT_V4_API_KEY>"; exit 1; fi

echo "→ Checking the key…"
CODE=$(curl -s -o /tmp/kit-forms.json -w '%{http_code}' -H "X-Kit-Api-Key: $KEY" "https://api.kit.com/v4/forms?per_page=100")
if [ "$CODE" != "200" ]; then echo "  Kit rejected that key (HTTP $CODE)."; exit 1; fi
echo "  OK"

echo "→ Matching forms to the free tools…"
python3 - "$KEY" <<'PY'
import json, re, sys, pathlib
key = sys.argv[1]
forms = json.load(open('/tmp/kit-forms.json')).get('forms', [])
print(f"  {len(forms)} forms in the account")

WANT = {
  'KIT_FORM_BOOKING_PIPELINE':  ['booking', 'pipeline'],
  'KIT_FORM_TOUR_CHECKLIST':    ['tour', 'checklist'],
  'KIT_FORM_MONTHLY_CHECKIN':   ['monthly', 'check'],
  'KIT_FORM_BUDGET_SPREADSHEET':['budget', 'spreadsheet'],
  'KIT_FORM_ALL_TOOLS':         ['all', 'tools'],
}
found = {}
for env, words in WANT.items():
    for f in forms:
        name = (f.get('name') or '').lower()
        if all(w in name for w in words):
            found[env] = str(f.get('id')); break

env_path = pathlib.Path('.env.local')
lines = env_path.read_text().splitlines() if env_path.exists() else []
def put(k, v):
    global lines
    lines = [l for l in lines if not l.startswith(k + '=')]
    lines.append(f'{k}={v}')

put('KIT_API_KEY', key)
for env in WANT:
    if env in found:
        put(env, found[env]); print(f'  {env:30} → {found[env]}')
    else:
        print(f'  {env:30} → not found (create the form in Kit, then re-run)')
env_path.write_text('\n'.join(lines) + '\n')
print(f'\n  wrote KIT_API_KEY + {len(found)} form id(s) to .env.local')
PY
rm -f /tmp/kit-forms.json
echo "→ Done. Tell Claude and it will verify a real capture syncs."
