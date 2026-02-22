Run instructions

1) Unzip `urms_unsigned.zip` to a folder.
2) Ensure WebView2 runtime is installed on the Windows machine.
3) Run `urms.exe` (it will load the frontend from the bundled `dist`).

Notes:
- OAuth E2E requires Google client credentials or an existing refresh token.
- To run a mocked calendar update, drop a test events file at `data/calendar_events.json` and the backend will emit `calendar:updated`.
