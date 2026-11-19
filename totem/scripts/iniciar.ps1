# Inicia o servidor local e abre o player em tela cheia (Edge em modo quiosque).
# Roda sozinho ao entrar no Windows (tarefa agendada) ou manualmente pelo iniciar.bat.
$ErrorActionPreference = 'Continue'

$Raiz = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Raiz 'backend'
$Logs = Join-Path $Raiz 'logs'
$Url = 'http://127.0.0.1:8000/'
$HealthUrl = 'http://127.0.0.1:8000/api/health'
$Perfil = Join-Path $Raiz 'dados\edge-perfil'
New-Item -ItemType Directory -Force -Path $Logs, $Perfil | Out-Null

function Log($mensagem) {
    $linha = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $mensagem
    Add-Content -Path (Join-Path $Logs 'totem.log') -Value $linha -Encoding UTF8
    Write-Host $linha
}

# Uma única instância por sessão
$mutex = New-Object System.Threading.Mutex($false, 'Local\MediaPlayerTotem')
if (-not $mutex.WaitOne(0)) { exit 0 }

# Variáveis do backend\.env (o app lê o ambiente do processo)
$envFile = Join-Path $Backend '.env'
if (Test-Path $envFile) {
    foreach ($linha in Get-Content $envFile -Encoding UTF8) {
        if ($linha -match '^\s*#' -or $linha -notmatch '=') { continue }
        $chave, $valor = $linha -split '=', 2
        [Environment]::SetEnvironmentVariable($chave.Trim(), $valor.Trim(), 'Process')
    }
}
$env:PYTHONUTF8 = '1'
$env:PYTHONUNBUFFERED = '1'

function Test-Backend {
    try {
        return (Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-Backend($segundos) {
    $fim = (Get-Date).AddSeconds($segundos)
    while ((Get-Date) -lt $fim) {
        if (Test-Backend) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

# O python.exe do venv é um redirecionador que cria um processo filho:
# por isso o servidor é localizado pela linha de comando, não pelo PID.
function Stop-Backend {
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        Where-Object { $_.CommandLine -like '*uvicorn*app.main:app*' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

function Start-Backend {
    $python = Join-Path $Backend '.venv\Scripts\python.exe'
    if (-not (Test-Path $python)) {
        Log 'ERRO: ambiente Python não encontrado. Rode o instalar.bat.'
        return
    }
    foreach ($nome in 'backend.log', 'backend-erro.log') {
        $arquivo = Join-Path $Logs $nome
        if ((Test-Path $arquivo) -and ((Get-Item $arquivo).Length -gt 5MB)) {
            Move-Item $arquivo "$arquivo.antigo" -Force
        }
    }
    Log 'Iniciando o servidor...'
    Start-Process -FilePath $python `
        -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000' `
        -WorkingDirectory $Backend -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $Logs 'backend.log') `
        -RedirectStandardError (Join-Path $Logs 'backend-erro.log') | Out-Null
}

function Find-Edge {
    $caminhos = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($caminho in $caminhos) {
        if (Test-Path $caminho) { return $caminho }
    }
    return $null
}

function Get-EdgeKiosk {
    Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
        Where-Object { $_.CommandLine -like '*edge-perfil*' }
}

# Evita o aviso "Restaurar páginas?" depois de queda de energia
function Repair-Perfil {
    $prefs = Join-Path $Perfil 'Default\Preferences'
    if (-not (Test-Path $prefs)) { return }
    try {
        $texto = Get-Content $prefs -Raw -Encoding UTF8
        $novo = $texto -replace '"exited_cleanly":false', '"exited_cleanly":true' `
                       -replace '"exit_type":"[^"]*"', '"exit_type":"Normal"'
        if ($novo -ne $texto) {
            [IO.File]::WriteAllText($prefs, $novo, (New-Object Text.UTF8Encoding($false)))
        }
    } catch { }
}

# --- Principal ---------------------------------------------------------------
Log 'Totem iniciando.'
if (-not (Test-Backend)) {
    Stop-Backend
    Start-Backend
}
if (-not (Wait-Backend 120)) {
    Log 'AVISO: o servidor não respondeu em 120 s (veja logs\backend-erro.log). Continuando mesmo assim.'
}

$edge = Find-Edge
if (-not $edge) {
    Log 'ERRO: Microsoft Edge não encontrado.'
    exit 1
}

$argumentosEdge = @(
    '--kiosk', $Url,
    '--edge-kiosk-type=fullscreen',
    '--no-first-run',
    '--noerrdialogs',
    '--disable-infobars',
    '--disable-session-crashed-bubble',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-pinch',
    '--overscroll-history-navigation=0',
    "--user-data-dir=`"$Perfil`""
)

$falhas = 0
while ($true) {
    if (-not (Test-Backend)) {
        Log 'Servidor não respondeu; reiniciando.'
        Stop-Backend
        Start-Backend
        Wait-Backend 60 | Out-Null
    }

    Repair-Perfil
    Log 'Abrindo o Edge em tela cheia.'
    Start-Process -FilePath $edge -ArgumentList $argumentosEdge | Out-Null
    Start-Sleep -Seconds 10

    # Enquanto o Edge do totem estiver aberto, vigia o servidor
    while (Get-EdgeKiosk) {
        Start-Sleep -Seconds 30
        if (Test-Backend) {
            $falhas = 0
        } else {
            $falhas++
            if ($falhas -ge 2) {
                Log 'Servidor sem resposta; reiniciando.'
                Stop-Backend
                Start-Backend
                Wait-Backend 60 | Out-Null
                $falhas = 0
            }
        }
    }

    Log 'Edge fechado; reabrindo em 5 s.'
    Start-Sleep -Seconds 5
}
