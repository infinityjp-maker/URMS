Release preparation

1) Code changes included:

2) Signing (Windows):
  Example:

```powershell
signtool sign /fd SHA256 /a /f "path\to\cert.pfx" /p <pfx-password> "path\to\urms.exe"
```


3) Installer (recommended):
4) Release checklist:
- Run unit and integration tests locally and fix failures (many unit tests currently fail; consider running `npm test` and triaging failures).
5) Scripts (placeholder):
- `Work/scripts/sign-and-package.ps1` can be created to automate signing + packaging.
If you want, I can scaffold `Work/scripts/sign-and-package.ps1` next, or create a PR with these changes.