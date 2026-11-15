$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (!(Test-Path -LiteralPath 'data/cloud-bridge.json')) { throw 'The cloud bridge has not been configured.' }
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$nodePath = if (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { (Get-Command node.exe -ErrorAction Stop).Source }
Start-Process -FilePath $nodePath -ArgumentList @('scripts/cloud-bridge.ts') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput 'data/cloud-bridge.log' -RedirectStandardError 'data/cloud-bridge-error.log' | Out-Null
