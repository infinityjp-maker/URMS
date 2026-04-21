# Runner Upload Response Schema

This document specifies the JSON schema that the selfheal server must return after receiving a runner logs ZIP upload. The runner-side uploader (`upload-runner-logs.ps1`) and retry-queue deletion protocol expect the server response to follow this shape.

## Required fields
- `ok` (boolean): `true` if the server successfully received and processed the uploaded ZIP.
- `delete` (boolean): `true` if the server instructs the client to permanently remove the local queued ZIP.

## Optional fields
- `id` (string): An identifier for the uploaded artifact on the server.
- `received_at` (string, RFC3339): The timestamp the server received the upload.
- `message` (string): Human-readable message for logs.

## Examples
### Success + delete
```json
{ "ok": true, "delete": true, "id": "abc123", "received_at": "2026-04-18T12:00:00Z", "message": "stored" }
```

### Success, keep (do not delete)
```json
{ "ok": true, "delete": false, "id": "abc123", "message": "stored; retention policy applies" }
```

### Failure
```json
{ "ok": false, "delete": false, "message": "invalid token or processing error" }
```

### Error: invalid response (non-JSON)
If the server returns a non-JSON body or malformed JSON, the uploader treats this as a non-deleting response and will keep the file in the retry-queue. Example:
```
<html>500 Internal Error</html>
```

### Notes on safe deletion
- The uploader will only remove a local queued ZIP when both `ok: true` and `delete: true` are present in the parsed JSON _and_ the response JSON passes the schema checker.
- If the schema checker reports any problems (missing/incorrect types), the uploader will not delete the file and will log a WARN entry containing the schema errors. Operators should inspect `retry-queue/last_schema_check.json` and the `runner_auto_start.json.log` for details.
- `retry-queue/index.json` tracks `count`, `files`, and `deleted_count` for operational visibility.

## Notes for operators
- The uploader only deletes a local queued ZIP when both `ok: true` and `delete: true` are present in the response JSON.
- The server should return valid JSON and appropriate HTTP status codes. The uploader treats non-JSON responses as non-deleting responses.
- For safe operation, the uploader writes structured logs and an `index.json` in the `retry-queue` directory tracking `count`, `files`, and `deleted_count`.

## Test-suite expected responses
The provided test-suite uses these example responses when simulating server behavior:

- Full accept (uploaded and instruct delete):

```json
{ "ok": true, "delete": true, "id": "test-accepted", "received_at": "2026-04-18T12:00:00Z", "message": "stored" }
```

- Accept but retain (do not delete):

```json
{ "ok": true, "delete": false, "id": "test-retain", "message": "stored; retention policy" }
```

- Failure (do not delete):

```json
{ "ok": false, "delete": false, "message": "processing failed" }
```

- Invalid / non-JSON (treated as keep):

```
500 Internal Server Error
```

When operators implement the server endpoint for production, ensure these behaviors are replicated for consistent test outcomes.
