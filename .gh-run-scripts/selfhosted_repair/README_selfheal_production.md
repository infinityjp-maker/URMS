# Selfheal Production Setup

Place a production runner ZIP containing `RunnerService.exe` into this folder so the `selfheal.ps1` repair logic can extract and replace the runner binary when needed.

Recommended filename and location:

- `.gh-run-scripts/selfhosted_repair/runner_production.zip`

Placement steps (on the machine where you prepare the repo):

1. Obtain the official GitHub Actions runner package for your Windows runner (from https://github.com/actions/runner/releases).
2. Extract the package locally and locate `RunnerService.exe` under the extracted folder.
3. Create a ZIP containing `RunnerService.exe` at the top-level (no nested paths), e.g. `runner_production.zip`.
4. Copy `runner_production.zip` into the repository path `.gh-run-scripts/selfhosted_repair/` and commit the change (or upload to the runner host into the same path if you manage the runner repository checkout).

Security notes:

- Ensure the ZIP is from a trusted source and has not been tampered with. Verify signatures or checksums as appropriate.
- Avoid committing private/proprietary binaries into public repositories. Consider using a secure file store or artifact storage and placing the file directly on the runner host instead of in git.

Usage:

- Once the ZIP is present, dispatch the `selfheal-validate.yml` workflow. When the script detects a truncated `RunnerService.exe`, it will extract the replacement from the ZIP and overwrite the binary, then record the new SHA256 in `selfheal_repair_log.txt`.

