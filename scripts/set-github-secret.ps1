<#
Set a GitHub repository secret using the `gh` CLI.
Requirements: gh CLI installed and authenticated (gh auth login).
Usage:
  .\set-github-secret.ps1 -RepoOwner myorg -RepoName myrepo -SecretName SIGN_CERT_PFX -SecretFile cert.b64.txt
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$RepoOwner,
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    [Parameter(Mandatory=$true)]
    [string]$SecretName,
    [Parameter(Mandatory=$true)]
    [string]$SecretFile
)
$fullRepo = "$RepoOwner/$RepoName"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install from https://github.com/cli/cli"
    exit 1
}
if (-not (Test-Path $SecretFile)) {
    Write-Error "Secret file not found: $SecretFile"
    exit 1
}
# Use gh to set the secret (gh encrypts on server side)
Write-Host "Setting secret $SecretName for repository $fullRepo"
gh secret set $SecretName --body-file $SecretFile --repo $fullRepo
if ($LASTEXITCODE -ne 0) { Write-Error "gh secret set failed"; exit $LASTEXITCODE }
Write-Host "Secret set successfully."
