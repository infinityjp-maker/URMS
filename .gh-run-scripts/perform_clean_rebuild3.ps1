# Use explicit refs/remotes/origin/main to avoid ambiguous origin/main
$branch = 'fix/selfheal-validate-trigger-clean'
$wfPath = '.github/workflows/selfheal-validate.yml'
$fallback = '.gh-run-scripts/server_selfheal.yml'

git fetch origin

git switch main
git reset --hard refs/remotes/origin/main

# create clean branch from remote main
git switch -c $branch refs/remotes/origin/main

# copy fallback workflow into place
if (Test-Path $fallback) { Copy-Item $fallback $wfPath -Force; Write-Output "Copied $fallback -> $wfPath" } else { Write-Output "Fallback not found: $fallback"; exit 1 }

# commit and push
git add $wfPath
git commit -m 'Fix trigger patterns for selfheal-validate workflow (clean rebuild)' || Write-Output 'no changes to commit'
git push -u origin $branch --force

# create PR
$createOut = gh pr create --title "[self-heal] Fix trigger patterns (clean rebuild)" --body "Ensure GitHub recognizes validate/** pushes." --base main --head $branch --fill 2>&1
Write-Output $createOut
Start-Sleep -Seconds 2
$pr = gh pr list --head $branch --json number --jq '.[0].number'
Write-Output "PR=$pr"
if ($pr) { gh pr merge $pr --merge --delete-branch=false } else { Write-Output 'PR not found; aborting'; exit 2 }

# sync main to remote
git switch main
git reset --hard refs/remotes/origin/main

# create and push empty commit on test branch
$testBranch = 'validate/final-trigger-test'
git switch -C $testBranch refs/remotes/origin/main
git commit --allow-empty -m 'Trigger selfheal-validate test (clean rebuild)' || Write-Output 'empty commit skipped'
git push origin $testBranch --force

Write-Output 'PERFORM_CLEAN_REBUILD3_DONE'
exit 0
