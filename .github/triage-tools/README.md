Triage tools
============

Purpose
-------
This folder contains small helper utilities and documentation to support continuing maintenance of the triage-summary family of workflows and scripts.

Files
-----
- `validate-triage-output.cjs` : Node script to validate that `triage-summary.*` files and `.gz` versions exist in `RUNNER_TEMP` and that gzip files decompress cleanly. Designed to be run in GitHub Actions after the generator step, or locally by setting `RUNNER_TEMP`.

Usage examples
--------------
Run locally (Windows PowerShell):

```powershell
$env:RUNNER_TEMP = 'C:\temp' ; node .github/triage-tools/validate-triage-output.cjs
```

Run in bash:

```bash
RUNNER_TEMP=/tmp node .github/triage-tools/validate-triage-output.cjs
```

CI integration
--------------
After `generate-triage-summary.cjs` completes, call the validator to fail the job early if required artifacts are missing:

```yaml
- name: Validate triage outputs
  run: |
    node .github/triage-tools/validate-triage-output.cjs || exit 1
```

Branch and commit conventions
----------------------------
- Branch name: `ci/triage-summary-improve-<short-task>`
- Commit message: `ci: triage summary → <short description> (phaseX)`

Testing and contribution
------------------------
When adding new automation, update `triage-tools/README.md` with the usage and add a selftest entry in `.github/workflows/triage-summary-selftest.yml` if needed.
