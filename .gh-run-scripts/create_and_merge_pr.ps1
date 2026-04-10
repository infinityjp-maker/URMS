# Create PR from fix/selfheal-validate-rename and merge it
$head = 'fix/selfheal-validate-rename'
$base = 'main'
$title = "[self-heal] Re-register workflow (rename)"
$body = "GitHub Actions internal state corrupted; renaming workflow to re-register."

# create PR
Write-Output "Creating PR $head -> $base"
$createOut = gh pr create --title $title --body $body --base $base --head $head --fill 2>&1
Write-Output $createOut

# try to extract PR number from create output (URL)
Start-Sleep -Seconds 2
$pr = $null
$text = $createOut -join "`n"
if ($text -match '/pull/(\d+)') { $pr = $Matches[1] }
else {
	$pr = gh pr view --json number --jq .number --head $head 2>$null
}
if (-not $pr) { Write-Output "PR not found for head $head"; exit 1 }
Write-Output "PR_NUMBER=$pr"

# merge PR
Write-Output "Merging PR $pr"
$mergeOut = gh pr merge $pr --merge --delete-branch=false 2>&1
Write-Output $mergeOut
exit 0
