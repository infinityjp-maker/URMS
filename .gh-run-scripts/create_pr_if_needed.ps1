git fetch origin
$diff = (git rev-list origin/main..fix/selfheal-validate-clean --count)
Write-Output ("Commits ahead of origin/main: $diff")
if ($diff -eq 0) {
  Write-Output 'No changes to propose in PR'
  exit 0
}
Write-Output 'Creating PR from fix/selfheal-validate-clean'
gh pr create --repo infinityjp-maker/URMS --title '[self-heal] Normalize trigger syntax (byte-clean)' --body 'Byte-clean normalization of selfheal-validate.yml' --base main --head fix/selfheal-validate-clean --fill
