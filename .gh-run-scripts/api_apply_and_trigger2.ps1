# API-based apply using server_selfheal.yml as source
$repo = 'infinityjp-maker/URMS'
$branch = 'fix/selfheal-validate-trigger-clean-api'
$wfLocalFallback = '.gh-run-scripts/server_selfheal.yml'

# get main sha
$mainRef = gh api repos/$repo/git/ref/heads/main --jq '.object.sha'
if (-not $mainRef) { Write-Output 'FAILED: cannot get main ref'; exit 1 }
Write-Output "mainSha=$mainRef"

# create branch ref if not exists
$exists = gh api repos/$repo/git/ref/heads/$branch 2>$null
if ($exists) { Write-Output "Branch $branch already exists on remote" } else { gh api repos/$repo/git/refs -f ref=refs/heads/$branch -f sha=$mainRef | Write-Output }

# read workflow content from fallback
if (-not (Test-Path $wfLocalFallback)) { Write-Output "Local fallback $wfLocalFallback not found"; exit 2 }
$content = Get-Content $wfLocalFallback -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$b64 = [System.Convert]::ToBase64String($bytes)

# create or update file on the new branch
try {
  $resp = gh api repos/$repo/contents/.github/workflows/selfheal-validate.yml -f message='Fix trigger patterns for selfheal-validate workflow (API apply)' -f content=$b64 -f branch=$branch
  Write-Output $resp
} catch {
  Write-Output "Failed to create/update file via API: $_"
  exit 3
}

# create PR
$prOut = gh pr create --title '[self-heal] Fix trigger patterns (API clean rebuild)' --body 'Ensure GitHub recognizes validate/** pushes.' --base main --head $branch --fill 2>&1
Write-Output $prOut
Start-Sleep -Seconds 2
$prNum = gh pr list --head $branch --json number --jq '.[0].number'
Write-Output "PR=$prNum"
if (-not $prNum) { Write-Output 'PR creation failed'; exit 4 }

# merge PR
Write-Output "Merging PR $prNum"
$mergeOut = gh pr merge $prNum --merge --delete-branch=false 2>&1
Write-Output $mergeOut

# get latest main commit sha and tree sha
$mainSha = gh api repos/$repo/git/ref/heads/main --jq '.object.sha'
$commitJson = gh api repos/$repo/git/commits/$mainSha
$commitObj = $commitJson | ConvertFrom-Json
$treeSha = $commitObj.tree.sha
Write-Output "mainSha=$mainSha treeSha=$treeSha"

# create an empty commit on top of main (same tree)
$msg = 'Trigger selfheal-validate test (API empty commit)'
$createCommitResp = gh api repos/$repo/git/commits -f message="$msg" -f tree=$treeSha -f parents[]=$mainSha
Write-Output $createCommitResp
if ($createCommitResp -match '"sha":\s*"([0-9a-f]+)"') { $createdCommitSha = $Matches[1] } else { Write-Output 'Failed to create commit via API'; exit 5 }
Write-Output "createdCommit=$createdCommitSha"

# create ref for validate/final-trigger-test pointing to the new empty commit
$triggerBranch = 'validate/final-trigger-test'
try {
  gh api repos/$repo/git/refs -f ref=refs/heads/$triggerBranch -f sha=$createdCommitSha | Write-Output
} catch {
  Write-Output "Failed to create trigger branch ref: $_"; exit 6
}

Write-Output 'API_APPLY_AND_TRIGGER2_DONE'
exit 0
