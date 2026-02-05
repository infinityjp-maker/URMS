# URMS Release Notes & Packaging Guide

This document describes how to reproduce the unsigned Windows bundles produced during the build, how to sign them, and verification steps for delivery.

Artifacts produced by the build in this repository:

- `Backend/src-tauri/target/release/urms.exe` — standalone release binary (preferred for single-run execution)
- `builds/urms_unsigned.zip` — earlier unsigned zip containing `urms.exe` and `dist` (fallback)

Recommended release checklist (manual steps):

1. Validate build artifacts by running the release exe and confirming logs in `logs/urms_rCURRENT.log` show frontend pings and `calendar:updated` emits when data changes.

2. Code signing (recommended):
   - Obtain a Windows code signing certificate (EV or standard) in PFX format.
   - Use `osslsigncode` or `SignTool` to sign the release exe (`urms.exe`). Example with `signtool`:

```powershell
signtool sign /f path\to\certificate.pfx /p <pfx-password> /tr http://timestamp.digicert.com /td SHA256 /fd SHA256 "path\to\urms.exe"
```

3. Notarization (if targeting macOS) — not applicable for Windows builds here.

4. Create release notes: include screenshots (see `builds/screenshots/`), list of changes, and known issues.

5. Deliverables to customer:
   - Signed `urms.exe` and `RELEASE.md` with reproduction steps.
   - `dist` folder (frontend assets) and `backend` release binary if requested.

Troubleshooting notes:

- If `cargo tauri build` fails with permissions errors, ensure `tauri-cli` and `tauri` crate versions are compatible and that the local `target` directory is writable.
- The application stores Google OAuth tokens in the OS keyring under service `URMS` and keys `google_oauth_token`, `google_oauth_client_id`, `google_oauth_client_secret`.

Verification commands (local):

```powershell
# Start the built release quickly
Start-Process Backend\src-tauri\target\release\urms.exe -WorkingDirectory Backend\src-tauri\target\release

# Tail logs
Get-Content logs\urms_rCURRENT.log -Wait -Tail 200
```

Contact/Notes:

If you want, I will:
- run the ignored `auth_adapter` tests against the current environment and report results,
- collect UI screenshots (requires a display session),
- sign installers if you provide a PFX and password.
