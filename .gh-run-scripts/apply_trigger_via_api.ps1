$repo='infinityjp-maker/URMS'
$branch='fix/selfheal-validate-trigger-apply'

# get main sha
$mainRef = gh api repos/$repo/git/ref/heads/main --jq '.object.sha'
if (-not $mainRef) { Write-Output 'FAILED: cannot get main ref'; exit 1 }
Write-Output "mainSha=$mainRef"

# create ref
$createRef = gh api repos/$repo/git/refs -f ref=refs/heads/$branch -f sha=$mainRef
Write-Output $createRef

# prepare file content
$content = @'
name: Self-heal: Validate push triggers

on:
  push:
    branches:
      - "validate/**"
      - "validate/*"
      - validate
      - validate/final-trigger-test

permissions:
  actions: read
  contents: read

jobs:
  selfheal-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Write diagnostic marker
        run: |
          echo "selfheal validate triggered by $GITHUB_REF" > selfheal-validate.txt
      - name: Upload marker
        uses: actions/upload-artifact@v4
        with:
          name: selfheal-validate-marker
          path: selfheal-validate.txt
'@

$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$b64 = [System.Convert]::ToBase64String($bytes)

# create or update file on new branch
$resp = gh api repos/$repo/contents/.github/workflows/selfheal-validate.yml -f message='Fix trigger patterns for selfheal-validate workflow (apply via API)' -f content=$b64 -f branch=$branch
Write-Output $resp

# create PR
$prOut = gh pr create --title '[self-heal] Fix trigger patterns (apply)' --body 'Ensure GitHub recognizes validate/** pushes.' --base main --head $branch --fill
Write-Output $prOut

# get PR number
$prNum = gh pr list --head $branch --json number --jq '.[0].number'
Write-Output "PR=$prNum"
if ($prNum) { gh pr merge $prNum --merge --delete-branch=false }
