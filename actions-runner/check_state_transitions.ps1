# check_state_transitions.ps1
# Verify that runner_auto_start.ps1 only writes allowed states
$allowed = @('Idle','Waiting','Running','Error','Recovering')
$path = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'runner_auto_start.ps1'
$content = Get-Content $path -Raw
$matches = Select-String -InputObject $content -Pattern "Write-Status\s*-State\s*'(?<s>[A-Za-z]+)'" -AllMatches
$bad = @()
foreach ($m in $matches.Matches) { $s = $m.Groups['s'].Value; if ($allowed -notcontains $s) { $bad += $s } }
if ($bad.Count -gt 0) { Write-Error "Found disallowed states: $($bad -join ', ')"; exit 2 } else { Write-Output 'State transitions OK'; exit 0 }
