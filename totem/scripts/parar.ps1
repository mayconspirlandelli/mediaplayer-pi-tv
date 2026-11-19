# Para o player e o servidor (manutenção).
$ErrorActionPreference = 'Continue'

Write-Host 'Parando o totem...'
Stop-ScheduledTask -TaskName 'MediaPlayerTotem' -ErrorAction SilentlyContinue

# Primeiro o iniciar.ps1, para ele não reabrir o Edge
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
    Where-Object { $_.CommandLine -like '*iniciar.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Edge do totem (perfil próprio; o Edge normal do Windows não é afetado)
Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
    Where-Object { $_.CommandLine -like '*edge-perfil*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Servidor
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
    Where-Object { $_.CommandLine -like '*uvicorn*app.main:app*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host 'Parado. Para voltar: iniciar.bat, "schtasks /run /tn MediaPlayerTotem" ou reinicie o Windows.'
