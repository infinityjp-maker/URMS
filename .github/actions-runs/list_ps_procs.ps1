$procs = Get-CimInstance Win32_Process
$children = @{}
foreach($p in $procs){ if ($children.ContainsKey($p.ParentProcessId)) { $children[$p.ParentProcessId] += 1 } else { $children[$p.ParentProcessId] = 1 } }
$ps = $procs | Where-Object { $_.Name -match 'powershell.exe|pwsh.exe' }
$out = $ps | ForEach-Object { [PSCustomObject]@{ pid = $_.ProcessId; parent = $_.ParentProcessId; cmd = ($_.CommandLine -replace '\\','\\\\'); childCount = ($children[$_.ProcessId] -as [int]) } }
$out | ConvertTo-Json -Depth 4
