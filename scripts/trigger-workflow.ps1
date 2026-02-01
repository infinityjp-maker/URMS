<#
Trigger a GitHub Actions workflow using the gh CLI.
Usage:
  .\trigger-workflow.ps1 -RepoOwner myorg -RepoName URMS -Workflow release-preview.yml

Prereqs: gh CLI installed and `gh auth login` completed and has repo write access.
#>
param(
  [Parameter(Mandatory=$true)] [string]$RepoOwner,
  [Parameter(Mandatory=$true)] [string]$RepoName,
  [Parameter(Mandatory=$true)] [string]$Workflow,
  [string]$Ref = "main",
  [string]$InputsJson = ""
)
$repo = "$RepoOwner/$RepoName"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh CLI not found. Install from https://github.com/cli/cli"
  exit 1
}
Write-Host "Triggering workflow $Workflow on $repo (ref: $Ref)"
if ($InputsJson -and (Test-Path $InputsJson)) {
  gh workflow run $Workflow --ref $Ref --repo $repo --field-file $InputsJson
} elseif ($InputsJson) {
  # Inputs as JSON string
  gh workflow run $Workflow --ref $Ref --repo $repo --raw-field "$InputsJson"
} else {
  gh workflow run $Workflow --ref $Ref --repo $repo
}
if ($LASTEXITCODE -ne 0) { Write-Error "gh workflow run failed"; exit $LASTEXITCODE }
Write-Host "Workflow dispatched. Use 'gh run list --repo $repo' to follow progress."
