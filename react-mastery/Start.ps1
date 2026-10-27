$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$nodePath = if (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { (Get-Command node.exe -ErrorAction Stop).Source }
if (!(Test-Path -LiteralPath 'dist/index.html')) { throw 'Run pnpm install and pnpm build first. See README.md.' }
$url = 'http://127.0.0.1:4317'
$running = $false
try { $response = Invoke-RestMethod "$url/api/bootstrap" -TimeoutSec 2; $running = $null -ne $response.lessons } catch { }
if (!$running) {
    New-Item -ItemType Directory -Path 'data' -Force | Out-Null
    Start-Process -FilePath $nodePath -ArgumentList @('server/index.ts', '--production') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput 'data/server.log' -RedirectStandardError 'data/server-error.log' | Out-Null
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 300
        try { $null = Invoke-RestMethod "$url/api/bootstrap" -TimeoutSec 1; $running = $true; break } catch { }
    }
}
if (!$running) { throw 'The local server did not start. Check data/server-error.log.' }
# Bypass entry documents cached by older server versions.
Start-Process "$url/?launch=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
