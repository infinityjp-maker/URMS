# Create clean branch from origin/main, apply corrected workflow, create+merge PR, sync main, trigger test branch
$repo = 'infinityjp-maker/URMS'
$branch = 'fix/selfheal-validate-trigger-clean'
$wfPath = '.github/workflows/selfheal-validate.yml'

git fetch origin
git switch main
git reset --hard origin/main

# create clean branch from origin/main
git switch -C $branch origin/main

# add the corrected workflow (workspace already edited)
git add $wfPath
git commit -m 'Fix trigger patterns for selfheal-validate workflow (clean rebuild)' || Write-Output 'no changes to commit'
git push -u origin $branch --force

# create PR
$createOut = gh pr create --title '[self-heal] Fix trigger patterns (clean rebuild)' --body 'Ensure GitHub recognizes validate/** pushes.' --base main --head $branch --fill 2>&1
Write-Output $createOut
Start-Sleep -Seconds 2
# try to get PR number
$pr = $null
$text = $createOut -join "`n"
if ($text -match '/pull/(\d+)') { $pr = $Matches[1] }
else { $pr = gh pr list --head $branch --json number --jq '.[0].number' 2>$null }
if (-not $pr) { Write-Output "PR not found for head $branch"; exit 2 }
Write-Output "PR_NUMBER=$pr"

# merge PR
$mergeOut = gh pr merge $pr --merge --delete-branch=false 2>&1
Write-Output $mergeOut

# sync main
git switch main
git fetch origin
git reset --hard origin/main

# create/test trigger branch and push empty commit
git switch -C validate/final-trigger-test origin/main
git commit --allow-empty -m 'Trigger selfheal-validate test (clean rebuild)' || Write-Output 'empty commit skipped'
git push origin validate/final-trigger-test --force

Write-Output 'CLEAN_REBUILD_DONE'
exit 0
