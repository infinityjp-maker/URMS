<#
PowerShell script to Base64-encode a PFX file for use as a GitHub secret.
Usage:
  .\encode-pfx.ps1 -PfxPath .\cert.pfx -OutFile cert.b64.txt -CopyToClipboard
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$PfxPath,
    [string]$OutFile = "cert.b64.txt",
    [switch]$CopyToClipboard
)
if (-not (Test-Path $PfxPath)) {
    Write-Error "PFX file not found: $PfxPath"
    exit 1
}
$bytes = [System.IO.File]::ReadAllBytes($PfxPath)
$b64 = [System.Convert]::ToBase64String($bytes)
Set-Content -Path $OutFile -Value $b64 -Encoding Ascii
Write-Host "Wrote Base64 to $OutFile"
if ($CopyToClipboard) {
    $b64 | Set-Clipboard
    Write-Host "Copied Base64 to clipboard"
}
