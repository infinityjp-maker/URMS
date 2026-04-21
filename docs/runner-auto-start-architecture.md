# Runner Auto Start Architecture

Overview of the `runner_auto_start` system, state transitions, retry-queue semantics, selfheal integration and dashboard wiring.

## Components
- `actions-runner/runner_auto_start.ps1`: polls GitHub for `workflow_dispatch` runs and starts the local runner on demand.
- `actions-runner/upload-runner-logs.ps1`: uploads zip artifacts, supports retry-queue and server-driven deletion protocol.
- `actions-runner/retry-queue/`: local queue for failed uploads; contains `index.json` and queued `.zip` files.
- `actions-runner/check-upload-response-schema.ps1`: validates server responses before deletion.
- `actions-runner/dashboard/index.html`: lightweight browser UI that surfaces state, retry-queue and test results.

## State diagram
- Idle → Waiting → Running → Idle (success)
- Running → Error → Recovering → Running / Error

## Retry-queue semantics
- On upload failure, zip files are copied to `retry-queue/` and `index.json` tracks `count`, `files`, `deleted_count`, `updated`.
- When retrying, the uploader only deletes a queued ZIP after:
  1. Server returns valid JSON
  2. Response passes `check-upload-response-schema.ps1`
  3. Response contains `ok: true` and `delete: true`
- If schema validation fails, the uploader logs details into `retry-queue/last_schema_check.json` and keeps the file.

## Selfheal integration
- On repeated runner failures or schema inconsistencies, `runner_auto_start.ps1` enters the selfheal path:
  - Collect logs via `collect-runner-logs.ps1`
  - Upload via `upload-runner-logs.ps1` (may be queued)
  - Selfheal decisions are logged with INFO/WARN/ERROR levels depending on severity.

## Dashboard and tests
- `dashboard/index.html` reads `runner_auto_start.status.json`, `runner_auto_start.json.log`, `retry-queue/index.json`, `retry-queue/last_schema_check.json` and `test-results/*` to display live state and test pass/fail.
- The test harness writes JSON files into `actions-runner/test-results/` to allow quick visual verification of system health.

## Operational notes
- Ensure server implements the documented response schema and test responses used by the test-suite before enabling automatic deletion in production.
- Monitor `retry-queue/index.json` and `runner_auto_start.json.log` for unexpected errors; use `test-results` to validate end-to-end behavior in staging.
