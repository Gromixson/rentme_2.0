$ports = 4000, 9099, 5001, 4400, 4500, 8080, 9199
$pids =
  Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  Select-Object -ExpandProperty OwningProcess -Unique

if (-not $pids) {
  Write-Host 'No emulator listeners found on ports' ($ports -join ', ')
  exit 0
}

foreach ($procId in $pids) {
  $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
  Write-Host "Stopping PID $procId ($name)..."
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

Write-Host 'Done. You can run: npm run dev:api'
