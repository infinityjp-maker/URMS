Write-Output 'Saving normalized file to temp'
Copy-Item .github/workflows/selfheal-validate.yml .gh-run-scripts/tmp_selfheal.yml -Force
Write-Output 'Resetting branch to known good commit 8f38ec87b73e8a9053f2b4c443ea608edc66f0d1'
git reset --hard 8f38ec87b73e8a9053f2b4c443ea608edc66f0d1
Write-Output 'Restoring normalized file from temp'
Copy-Item .gh-run-scripts/tmp_selfheal.yml .github/workflows/selfheal-validate.yml -Force
Write-Output 'Ensure UTF8 LF bytes'
$p='.github/workflows/selfheal-validate.yml'
$s=Get-Content -Raw -Encoding UTF8 $p
$s2=$s -replace "`r`n","`n"
[System.IO.File]::WriteAllBytes($p,[System.Text.Encoding]::UTF8.GetBytes($s2))
Write-Output 'Staging workflow file only'
git status --porcelain
git add .github/workflows/selfheal-validate.yml
git commit -m 'Normalize selfheal-validate.yml (byte-clean rebuild)'
Write-Output 'Pushing cleaned branch (force)'
git push -f origin fix/selfheal-validate-clean
Write-Output 'Done'