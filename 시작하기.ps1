$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundledNode = 'C:\Users\이창륜pc\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'

if (Get-Command node -ErrorAction SilentlyContinue) {
  $node = 'node'
} elseif (Test-Path $bundledNode) {
  $node = $bundledNode
} else {
  Write-Host 'Node.js를 찾지 못했습니다. Node.js LTS를 설치한 뒤 다시 실행해 주세요.' -ForegroundColor Yellow
  Read-Host '종료하려면 Enter를 누르세요'
  exit 1
}

Write-Host '달란트마블 서버를 시작합니다...' -ForegroundColor Cyan
Start-Process 'http://localhost:3000'
& $node (Join-Path $root 'server.js')
