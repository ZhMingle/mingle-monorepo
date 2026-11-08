$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$bundledNode=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$nodePath=if(Test-Path -LiteralPath $bundledNode){$bundledNode}else{(Get-Command node.exe -ErrorAction Stop).Source}
$running=$false
try{$null=Invoke-RestMethod 'http://127.0.0.1:4331/api/state' -TimeoutSec 2;$running=$true}catch{}
if(!$running){
  New-Item -ItemType Directory -Path 'data' -Force|Out-Null
  Start-Process -FilePath $nodePath -ArgumentList @('server.mjs') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput 'data/server.log' -RedirectStandardError 'data/server-error.log'|Out-Null
  for($attempt=0;$attempt -lt 25;$attempt++){
    Start-Sleep -Milliseconds 300
    try{$null=Invoke-RestMethod 'http://127.0.0.1:4331/api/state' -TimeoutSec 1;$running=$true;break}catch{}
  }
}
if(!$running){throw 'The local inbox did not start. Check data/server-error.log.'}
Start-Process 'http://127.0.0.1:4331/'
