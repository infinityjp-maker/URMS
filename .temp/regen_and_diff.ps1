$t = Get-Content -Raw .\builds\screenshots\annotated-diff-template.html
$reg = $t -replace '\{\{MAP_URL\}\}','map_diff_playwright_smoke.json'
Set-Content -Path .\builds\screenshots\reg2-smoke.html -Value $reg -Encoding UTF8
cmd /c "fc .\builds\screenshots\reg2-smoke.html .\builds\screenshots\annotated-diff-playwright-smoke.html"
