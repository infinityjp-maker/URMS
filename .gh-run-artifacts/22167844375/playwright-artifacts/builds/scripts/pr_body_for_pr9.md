# chore: stop tracking Playwright generated artifacts

This PR removes all Playwright-generated artifacts from Git tracking and ensures that future runs do not pollute the repository.

## Changes
- Untracked all `builds/artifacts_*` directories  
- Untracked Playwright-generated screenshots and diff images under `builds/screenshots/`  
- Untracked generated JSON/HTML files such as `map_diff_*.json` and `annotated-diff-playwright-*.html`  
- Updated `.gitignore` to exclude all Playwright outputs  
- Cleaned workspace by removing untracked artifact directories and temporary folders

## Impact
- Keeps the repository clean after Playwright runs  
- Prevents accidental commits of large generated files  
- Improves CI stability and local reproducibility  
- No functional changes to URMS source code
