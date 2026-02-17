#!/bin/bash
# Test Traccar webhook - simulates a position from Traccar server
# Usage: ./scripts/test-traccar-webhook.sh [AUTH_TOKEN]
# If AUTH_TOKEN not provided, uses TRACCAR_WEBHOOK_SECRET or prompts

set -e

WEBHOOK_URL="https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook"
DEVICE_ID="${TRACCAR_DEVICE_ID:-86509103}"

# Auth: 1st arg, or env TRACCAR_WEBHOOK_SECRET, or env SUPABASE_SERVICE_ROLE_KEY
AUTH="${1:-${TRACCAR_WEBHOOK_SECRET:-${SUPABASE_SERVICE_ROLE_KEY}}}"

if [ -z "$AUTH" ]; then
  echo "Error: No auth token. Provide as:"
  echo "  $0 YOUR_SECRET"
  echo "Or set env: TRACCAR_WEBHOOK_SECRET or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# Traccar-style payload (flat format)
PAYLOAD=$(cat <<EOF
{
  "deviceId": $DEVICE_ID,
  "latitude": 6.3350,
  "longitude": 5.6270,
  "speed": 5.4,
  "course": 45,
  "deviceTime": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "fixTime": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
}
EOF
)

echo "Sending test position to webhook..."
echo "  Device ID: $DEVICE_ID"
echo "  URL: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response ($HTTP_CODE):"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Success - check bus_locations table in Supabase"
else
  echo "✗ Failed - see error above"
  exit 1
fi
