Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(15, 22, 34))
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(110, 168, 255))
$g.FillEllipse($brush, 156, 156, 200, 200)
$g.Dispose()
$brush.Dispose()
$bmp.Save("$PSScriptRoot\..\app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
