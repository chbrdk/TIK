#!/usr/bin/env bash
# Smoke-test Persona Reality Studio API against a running backend.
# Usage: ./scripts/test-pipeline-api-live.sh
# Env: PIPELINE_API_BASE (default http://127.0.0.1:8000)

set -euo pipefail
BASE="${PIPELINE_API_BASE:-http://127.0.0.1:8000}"

echo "== health"
curl -sf "$BASE/health" | jq .

echo "== personas"
curl -sf "$BASE/v1/pipeline/personas" | jq 'length'

echo "== create session (no Marble)"
JOB_JSON=$(curl -sf -X POST "$BASE/v1/pipeline/sessions" \
  -H 'Content-Type: application/json' \
  -d '{
    "target_audience": "Automatisierter API-Smoke-Test Ingenieure DACH",
    "company_name": "Smoke Test GmbH",
    "company_description": "Kurzer Live-API-Test der Studio-Pipeline ohne Marble.",
    "generate_worlds": false
  }')
echo "$JOB_JSON" | jq .
JOB_ID=$(echo "$JOB_JSON" | jq -r .job_id)

echo "== poll job $JOB_ID (max 120s, needs ANTHROPIC_API_KEY)"
for i in $(seq 1 60); do
  STATE=$(curl -sf "$BASE/v1/pipeline/jobs/$JOB_ID" | jq -r .state)
  echo "  [$i] state=$STATE"
  if [ "$STATE" = "completed" ] || [ "$STATE" = "failed" ]; then
    curl -sf "$BASE/v1/pipeline/jobs/$JOB_ID" | jq '{state, persona_id, error, preview_config_url, artifacts: [.artifacts[] | {label, exists}]}'
    curl -sf "$BASE/v1/pipeline/jobs/$JOB_ID/log" | jq -r .log | tail -20
    break
  fi
  sleep 2
done

echo "OK live smoke finished"
