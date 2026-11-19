# Atualiza o programa a partir de um ZIP novo. Preserva: backend\.env, banco, uploads,
# .venv, dados, logs e backups. Executado pelo atualizar.bat (de uma cópia em %TEMP%).
param(
    [string]$Raiz,
    [string]$Zip
)
$ErrorActionPreference = 'Stop'

$Raiz = (Resolve-Path $Raiz).Path
Write-Host '=================================='
Write-Host ' Media Player - Atualização do totem'
Write-Host '=================================='

# 1. Localizar o ZIP --------------------------------------------------------
if (-not $Zip) {
    $pastas = @($Raiz, (Split-Path $Raiz -Parent))
    $encontrados = foreach ($pasta in $pastas) {
        Get-ChildItem -Path $pasta -Filter 'mediaplayer-totem*.zip' -File -ErrorAction SilentlyContinue
    }
    $Zip = ($encontrados | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}
if (-not $Zip -or -not (Test-Path $Zip)) {
    throw "ZIP não encontrado. Envie o mediaplayer-totem-AAAAMMDD-HHMM.zip para $Raiz (ou para a pasta acima) ou informe: atualizar.bat C:\caminho\arquivo.zip"
}
Write-Host "ZIP: $Zip"

# 2. Extrair ----------------------------------------------------------------
$temp = Join-Path $env:TEMP ('mp-totem-' + (Get-Date -Format 'yyyyMMddHHmmss'))
Expand-Archive -Path $Zip -DestinationPath $temp -Force
$origem = $temp
if (-not (Test-Path (Join-Path $origem 'backend'))) {
    $origem = (Get-ChildItem $temp -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'backend') } | Select-Object -First 1).FullName
}
if (-not $origem -or -not (Test-Path (Join-Path $origem 'backend\app'))) {
    throw 'O ZIP não parece ser um pacote do totem (backend\app não encontrado).'
}

# 3. Parar ------------------------------------------------------------------
Write-Host 'Parando o totem...'
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Raiz 'scripts\parar.ps1') | Out-Null

# 4. Backup do banco --------------------------------------------------------
$banco = Join-Path $Raiz 'backend\mediaplayer.db'
if (Test-Path $banco) {
    $backups = Join-Path $Raiz 'backups'
    New-Item -ItemType Directory -Force -Path $backups | Out-Null
    $copia = Join-Path $backups ('mediaplayer-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.db')
    Copy-Item $banco $copia
    Write-Host "Backup do banco: $copia"
}

# 5. Copiar o programa ------------------------------------------------------
$versaoAntes = ''
$arquivoVersao = Join-Path $Raiz 'VERSAO.txt'
if (Test-Path $arquivoVersao) { $versaoAntes = (Get-Content $arquivoVersao -Raw).Trim() }

function Sincronizar($de, $para) {
    New-Item -ItemType Directory -Force -Path $para | Out-Null
    robocopy $de $para /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar $de (robocopy código $LASTEXITCODE)" }
}

Write-Host 'Atualizando o programa...'
Sincronizar (Join-Path $origem 'backend\app') (Join-Path $Raiz 'backend\app')
Sincronizar (Join-Path $origem 'frontend\dist') (Join-Path $Raiz 'frontend\dist')
Sincronizar (Join-Path $origem 'scripts') (Join-Path $Raiz 'scripts')
Copy-Item (Join-Path $origem 'backend\requirements.txt') (Join-Path $Raiz 'backend\requirements.txt') -Force
foreach ($arquivo in Get-ChildItem $origem -File) {
    Copy-Item $arquivo.FullName (Join-Path $Raiz $arquivo.Name) -Force
}
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue

# 6. Dependências -----------------------------------------------------------
Write-Host 'Atualizando dependências...'
$python = Join-Path $Raiz 'backend\.venv\Scripts\python.exe'
& $python -m pip install -r (Join-Path $Raiz 'backend\requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao atualizar as dependências (internet?).' }

# 7. Reiniciar --------------------------------------------------------------
$versaoDepois = ''
if (Test-Path $arquivoVersao) { $versaoDepois = (Get-Content $arquivoVersao -Raw).Trim() }
Write-Host ''
Write-Host 'Atualização concluída.' -ForegroundColor Green
if ($versaoAntes) { Write-Host "Versão anterior: $($versaoAntes -replace '\s+', ' ')" }
if ($versaoDepois) { Write-Host "Versão atual:    $($versaoDepois -replace '\s+', ' ')" }

if (Get-ScheduledTask -TaskName 'MediaPlayerTotem' -ErrorAction SilentlyContinue) {
    Start-ScheduledTask -TaskName 'MediaPlayerTotem'
    Write-Host 'Totem reiniciando...'
} else {
    Write-Host 'Tarefa de inicialização não encontrada: rode o instalar.bat.' -ForegroundColor Yellow
}
