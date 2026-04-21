$text = Get-Content .gh-run-scripts/selfhosted_repair/selfheal.ps1 -Raw
$opens = ($text.ToCharArray() | Where-Object {$_ -eq '{'}).Count
$closes = ($text.ToCharArray() | Where-Object {$_ -eq '}'}).Count
Write-Output "{ opens: $opens, closes: $closes }"
