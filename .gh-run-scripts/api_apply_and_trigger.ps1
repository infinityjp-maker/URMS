# Create a clean branch from origin/main via GitHub API, add/update workflow file on that branch,
# create PR and merge it, then create an empty commit on validate/final-trigger-test to trigger workflow.
$repo = 'infinityjp-maker/URMS'
$branch = 'fix/selfheal-validate-trigger-clean-api'
$wfPath = '.github/workflows/selfheal-validate.yml'

# get main sha
$mainRef = gh api repos/$repo/git/ref/heads/main --jq '.object.sha' 2>$null
if (-not $mainRef) { Write-Output 'FAILED: cannot get main ref'; exit 1 }
Write-Output "mainSha=$mainRef"

# create branch ref (if exists, skip)
$exists = gh api repos/$repo/git/ref/heads/$branch 2>$null
if ($exists) { Write-Output "Branch $branch already exists on remote" } else { gh api repos/$repo/git/refs -f ref=refs/heads/$branch -f sha=$mainRef | Write-Output }

# read local workflow content and base64 encode
if (-not (Test-Path $wfPath)) { Write-Output "Local workflow $wfPath not found"; exit 2 }
$content = Get-Content $wfPath -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$b64 = [System.Convert]::ToBase64String($bytes)

# create or update file on the new branch
try {
  $resp = gh api repos/$repo/contents/$wfPath -f message='Fix trigger patterns for selfheal-validate workflow (API apply)' -f content=$b64 -f branch=$branch
  Write-Output $resp
} catch {
  Write-Output "Failed to create/update file via API: $_"
  exit 3
}

# create PR
$prOut = gh pr create --title '[self-heal] Fix trigger patterns (API clean rebuild)' --body 'Ensure GitHub recognizes validate/** pushes.' --base main --head $branch --fill 2>&1
Write-Output $prOut
Start-Sleep -Seconds 2
$prNum = gh pr list --head $branch --json number --jq '.[0].number' 2>$null
Write-Output "PR=$prNum"
if (-not $prNum) { Write-Output 'PR creation failed'; exit 4 }

# merge PR
Write-Output "Merging PR $prNum"
$mergeOut = gh pr merge $prNum --merge --delete-branch=false 2>&1
Write-Output $mergeOut

# sync: get latest main commit sha and tree sha
$mainSha = gh api repos/$repo/git/ref/heads/main --jq '.object.sha'
$commit = gh api repos/$repo/git/commits/$mainSha
$commitObj = $commit | ConvertFrom-Json
$treeSha = $commitObj.tree.sha
Write-Output "mainSha=$mainSha treeSha=$treeSha"

# create an empty commit on top of main (same tree)
$msg = 'Trigger selfheal-validate test (API empty commit)'
$createCommitJson = @{ message = $msg; tree = $treeSha; parents = @($mainSha) } | ConvertTo-Json -Compress
$createCommitResp = gh api repos/$repo/git/commits -f message="$msg" -f tree=$treeSha -f parents[]=$mainSha 2>&1
Write-Output $createCommitResp
$createdCommitSha = $null
if ($createCommitResp -match '"sha":\s*"([0-9a-f]+)"') { $createdCommitSha = $Matches[1] }
if (-not $createdCommitSha) {
  Write-Output 'Failed to create commit via API'; exit 5
}
Write-Output "createdCommit=$createdCommitSha"

# create ref for validate/final-trigger-test pointing to the new empty commit
$triggerBranch = 'validate/final-trigger-test'
try {
  gh api repos/$repo/git/refs -f ref=refs/heads/$triggerBranch -f sha=$createdCommitSha | Write-Output
} catch {
  Write-Output "Failed to create trigger branch ref: $_"; exit 6
}

Write-Output 'API_APPLY_AND_TRIGGER_DONE'
exit 0
