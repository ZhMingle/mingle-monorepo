[CmdletBinding()]
param([switch]$SkipRestore)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$localSdk = Join-Path $taskRoot '.dotnet/dotnet.exe'
$sdk = if (Test-Path -LiteralPath $localSdk) { $localSdk } else { 'dotnet' }
Push-Location $taskRoot
try {
    if (-not $SkipRestore) {
        & $sdk restore tests/Mailroom.Tests.csproj --packages .packages --configfile NuGet.Config
        if ($LASTEXITCODE -ne 0) { throw 'Dependency restore failed.' }
    }
    & $sdk run --project tests/Mailroom.Tests.csproj --no-restore -c Release
    if ($LASTEXITCODE -ne 0) { throw 'Verification failed.' }
    & $sdk publish Mailroom.csproj --no-restore -c Release -o publish
    if ($LASTEXITCODE -ne 0) { throw 'Web application publish failed.' }
    Write-Output 'Web deployment files: publish/'
} finally { Pop-Location }
