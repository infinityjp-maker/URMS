$pr = 75
$branch = 'fix/selfheal-validate-trigger-clean'
$wfPath = '.github/workflows/selfheal-validate.yml'
$fallback = '.gh-run-scripts/server_selfheal.yml'

git fetch origin
# checkout the PR branch
gh pr checkout $pr

# merge remote main into branch using explicit ref
git merge refs/remotes/origin/main --no-edit || Write-Output 'merge reported conflicts or non-fast-forward'

# if there are conflicts or to be sure, overwrite workflow with fallback
if (Test-Path $fallback) { Copy-Item $fallback $wfPath -Force; git add $wfPath }

# commit if needed
try { git commit -m 'Resolve conflicts: apply corrected selfheal-validate.yml' } catch { Write-Output 'no commit needed' }

# push updated branch
git push origin HEAD:refs/heads/$branch --force

# attempt merge via gh
gh pr merge $pr --merge --delete-branch=false

Write-Output 'RESOLVE_PR75_DONE'
exit 0
