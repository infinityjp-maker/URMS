<#
Create an annotated git tag and push it to remote.
Usage:
  .\create-and-push-tag.ps1 -Tag v1.2.3 -Message "Release v1.2.3" -Remote origin

Prereqs: git configured with credentials. This will push to the configured remote.
#>
param(
  [Parameter(Mandatory=$true)] [string]$Tag,
  [Parameter(Mandatory=$false)] [string]$Message = "Release $Tag",
  [Parameter(Mandatory=$false)] [string]$Remote = "origin",
  [Parameter(Mandatory=$false)] [string]$Branch = "$(git rev-parse --abbrev-ref HEAD)"
)
Write-Host "Creating annotated tag $Tag on branch $Branch"
git checkout $Branch
if ($LASTEXITCODE -ne 0) { Write-Error "git checkout failed"; exit 1 }
# create annotated tag (force if exists?)
if (git rev-parse -q --verify "refs/tags/$Tag") {
  Write-Host "Tag $Tag already exists locally. Deleting and recreating."
  git tag -d $Tag
}
git tag -a $Tag -m "$Message"
if ($LASTEXITCODE -ne 0) { Write-Error "git tag failed"; exit 1 }
Write-Host "Pushing tag $Tag to $Remote"
git push $Remote refs/tags/$Tag
if ($LASTEXITCODE -ne 0) { Write-Error "git push tag failed"; exit 1 }
Write-Host "Tag pushed successfully."
