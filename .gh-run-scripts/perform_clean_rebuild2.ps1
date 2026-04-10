git fetch origin
git switch main
git pull --ff-only origin main

git switch -C fix/selfheal-validate-trigger-clean

git add .github/workflows/selfheal-validate.yml
try { git commit -m 'Fix trigger patterns for selfheal-validate workflow (clean rebuild)' } catch { Write-Output 'no changes to commit' }

git push -u origin fix/selfheal-validate-trigger-clean --force

# create PR
$createOut = gh pr create --title "[self-heal] Fix trigger patterns (clean rebuild)" --body "Ensure GitHub recognizes validate/** pushes." --base main --head fix/selfheal-validate-trigger-clean --fill
Write-Output $createOut
Start-Sleep -Seconds 2
$pr = gh pr list --head fix/selfheal-validate-trigger-clean --json number --jq '.[0].number'
Write-Output "PR=$pr"
if ($pr) { gh pr merge $pr --merge --delete-branch=false } else { Write-Output 'PR not found or creation failed'; exit 2 }

# sync main
git switch main
git pull --ff-only origin main

# create and push test branch
git switch -C validate/final-trigger-test origin/main
try { git commit --allow-empty -m 'Trigger selfheal-validate test (clean rebuild)' } catch { Write-Output 'empty commit skipped' }

git push origin validate/final-trigger-test --force

Write-Output 'PERFORM_CLEAN_REBUILD_DONE'
