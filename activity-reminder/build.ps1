$ErrorActionPreference = 'Stop'
$compiler = Join-Path ([Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) 'csc.exe'
$outputName = if ($args.Count -gt 0) { [string]$args[0] } else { 'ActivityReminder.exe' }
if ([IO.Path]::GetFileName($outputName) -ne $outputName -or !$outputName.EndsWith('.exe')) { throw 'Output must be an EXE file name.' }
if (!(Test-Path $compiler)) { $compiler = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' }
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object Drawing.Bitmap(64,64)
$graphics = [Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = 'AntiAlias'
$graphics.Clear([Drawing.Color]::FromArgb(17,24,31))
$pen = New-Object Drawing.Pen([Drawing.Color]::FromArgb(140,236,195),5)
$pen.StartCap = 'Round'; $pen.EndCap = 'Round'
$brush = New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb(140,236,195))
$graphics.FillEllipse($brush,26,9,12,12)
$graphics.DrawLine($pen,32,26,32,42)
$graphics.DrawLine($pen,13,23,32,30)
$graphics.DrawLine($pen,32,30,51,23)
$graphics.DrawLine($pen,32,42,22,55)
$graphics.DrawLine($pen,32,42,42,55)
$icon = [Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream = [IO.File]::Create((Join-Path $PSScriptRoot 'app.ico'))
try { $icon.Save($stream) } finally { $stream.Dispose(); $icon.Dispose(); $brush.Dispose(); $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
& $compiler /nologo /target:winexe /optimize+ /codepage:65001 "/out:$PSScriptRoot\$outputName" "/win32icon:$PSScriptRoot\app.ico" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll "$PSScriptRoot\ActivityReminder.cs" "$PSScriptRoot\CodexUsage.cs" "$PSScriptRoot\UsageUpdates.cs"
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
Write-Output "Built: $outputName"
