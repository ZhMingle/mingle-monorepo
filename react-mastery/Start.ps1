$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$nodePath = if (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { (Get-Command node.exe -ErrorAction Stop).Source }
if (!(Test-Path -LiteralPath 'dist/index.html')) { throw 'Run pnpm install and pnpm build first. See README.md.' }
$url = 'http://127.0.0.1:4317'
$running = $false
try { $response = Invoke-RestMethod "$url/api/bootstrap" -TimeoutSec 2; $running = $null -ne $response.lessons } catch { }
if ($running) {
    $expectedVersion = [regex]::Match((Get-Content -LiteralPath 'shared/runtime-version.ts' -Raw), "runtimeVersion = '([^']+)'").Groups[1].Value
    $runtime = $null
    try { $runtime = Invoke-RestMethod "$url/api/runtime" -TimeoutSec 2 } catch { }
    if (!$runtime -or $runtime.version -ne $expectedVersion) {
        $listener = Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction Stop | Where-Object LocalAddress -eq '127.0.0.1' | Select-Object -First 1
        $service = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
        $knownRoot = $runtime -and $runtime.root -eq $PSScriptRoot -and $runtime.pid -eq $listener.OwningProcess
        # Older Clarity servers have no runtime endpoint. Require their exact launch command.
        $legacyClarity = !$runtime -and $service.CommandLine -match '"?server[/\\]index\.ts"?\s+--production\s*$' -and $service.ExecutablePath -eq $nodePath
        if (!$knownRoot -and !$legacyClarity) { throw 'Port 4317 is occupied by an unrecognized server. Close it before starting Clarity.' }
        Stop-Process -Id $listener.OwningProcess -ErrorAction Stop
        $running = $false
    }
}
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
