URMS Developer Mode (URMS_DEV)

- Purpose: enable additional runtime diagnostics used during development (eval injection, local ping server, aggressive DevTools opener).
- How to enable: set the environment variable `URMS_DEV=1` before launching the app (for development only).

Examples:

Windows PowerShell:

```powershell
$env:URMS_DEV = '1'
Start-Process 'path\to\urms.exe'
```

Windows cmd:

```cmd
set URMS_DEV=1
urms.exe
```

Notes:
- URMS_DEV must NOT be set in production builds or on machines used by end users.
- When URMS_DEV is set, some additional runtime scripts (evals) and a local HTTP ping server on 127.0.0.1:8765 will be started to help diagnose frontend connectivity and asset loading issues.
- The eval scripts may inject small snippets into the WebView to detect bridge availability; they are intentionally limited and gated behind `URMS_DEV`.
- If you need to collect debug traces for a user, instruct them only temporarily and securely how to set `URMS_DEV` and to share logs in `logs/` folder.
