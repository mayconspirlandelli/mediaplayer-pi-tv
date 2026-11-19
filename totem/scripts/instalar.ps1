# Instalador do totem (Windows 10/11). Execute pelo instalar.bat (como administrador).
$ErrorActionPreference = 'Stop'

$Raiz = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Raiz 'backend'
$Porta = 8000
$NomeTarefa = 'MediaPlayerTotem'

function Titulo($texto) {
    Write-Host ''
    Write-Host "== $texto ==" -ForegroundColor Green
}

function Perguntar($pergunta, $padraoSim = $true) {
    $sufixo = if ($padraoSim) { '[S/n]' } else { '[s/N]' }
    $resposta = Read-Host "$pergunta $sufixo"
    if ([string]::IsNullOrWhiteSpace($resposta)) { return $padraoSim }
    return $resposta.Trim().ToLower().StartsWith('s')
}

function Novo-Segredo($bytes) {
    $b = New-Object byte[] $bytes
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($b)
    return -join ($b | ForEach-Object { $_.ToString('x2') })
}

# Retorna a versão (ex.: 3.12) se o executável for um Python 3.10-3.13 utilizável
function Test-Python($exe, $argumentos) {
    $ErrorActionPreference = 'Continue'
    try {
        $v = & $exe @argumentos -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $v) { return $null }
        $partes = ([string]$v).Trim().Split('.')
        if ([int]$partes[0] -eq 3 -and [int]$partes[1] -ge 10 -and [int]$partes[1] -le 13) {
            return ([string]$v).Trim()
        }
    } catch { }
    return $null
}

# Procura um Python 3.10-3.13 e devolve o caminho do executável
function Find-Python {
    $ErrorActionPreference = 'Continue'
    $candidatos = @()
    foreach ($versao in '3.12', '3.13', '3.11', '3.10') {
        $candidatos += , @('py', @("-$versao"))
    }
    $candidatos += , @('python', @())
    foreach ($caminho in "$env:ProgramFiles\Python312\python.exe", "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe") {
        if (Test-Path $caminho) { $candidatos += , @($caminho, @()) }
    }
    foreach ($c in $candidatos) {
        $exe = $c[0]
        $argumentos = $c[1]
        if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { continue }
        if (Test-Python $exe $argumentos) {
            $real = & $exe @argumentos -c "import sys; print(sys.executable)"
            return ([string]$real).Trim()
        }
    }
    return $null
}

Write-Host '=================================='
Write-Host ' Media Player - Instalação do totem'
Write-Host '=================================='
Write-Host "Pasta: $Raiz"

# 1. Python ----------------------------------------------------------------
Titulo '1/7 Python'
$python = Find-Python
if (-not $python) {
    Write-Host 'Python 3.10-3.13 não encontrado. Instalando o Python 3.12 pelo winget...'
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "O winget não está disponível. Instale o Python 3.12 em https://www.python.org/downloads/ (marque 'Add python.exe to PATH') e rode o instalar.bat de novo."
    }
    winget install -e --id Python.Python.3.12 --scope machine --silent --accept-package-agreements --accept-source-agreements
    $python = Find-Python
    if (-not $python) {
        throw 'Python instalado, mas não foi localizado. Feche esta janela e rode o instalar.bat de novo.'
    }
}
Write-Host "Usando: $python"

# 2. Ambiente virtual e dependências ---------------------------------------
Titulo '2/7 Ambiente Python e dependências (precisa de internet)'
$venv = Join-Path $Backend '.venv'
$venvPython = Join-Path $venv 'Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    & $python -m venv $venv
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o ambiente virtual.' }
}
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $Backend 'requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar as dependências (o totem está com internet?).' }

# 3. Configuração ----------------------------------------------------------
Titulo '3/7 Configuração (backend\.env)'
$envFile = Join-Path $Backend '.env'
$senhaGerada = $null
if (Test-Path $envFile) {
    Write-Host 'backend\.env já existe: mantido (login e chaves não mudam).'
} else {
    $senhaGerada = Novo-Segredo 6
    $chave = Novo-Segredo 24
    $clima = Read-Host 'Chave da API OpenWeather (Enter para pular; sem ela o clima fica indisponível)'
    $cidade = Read-Host 'Cidade do clima [Aparecida de Goiania]'
    if ([string]::IsNullOrWhiteSpace($cidade)) { $cidade = 'Aparecida de Goiania' }
    $linhas = @(
        '# Gerado por instalar.ps1',
        'ADMIN_USER=admin',
        "ADMIN_PASSWORD=$senhaGerada",
        "SECRET_KEY=$chave",
        "OPENWEATHER_API_KEY=$($clima.Trim())",
        "WEATHER_CITY=$($cidade.Trim())",
        'WEATHER_COUNTRY=BR',
        'UPLOAD_DIR=uploads'
    )
    # Sem BOM: um BOM corromperia a primeira variável
    [IO.File]::WriteAllLines($envFile, $linhas, (New-Object Text.UTF8Encoding($false)))
    Write-Host 'backend\.env criado.'
}

# 4. Firewall --------------------------------------------------------------
Titulo "4/7 Firewall (porta $Porta, só redes privadas)"
Get-NetFirewallRule -DisplayName 'Media Player Totem' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName 'Media Player Totem' -Direction Inbound -Protocol TCP `
    -LocalPort $Porta -Action Allow -Profile Private, Domain | Out-Null
Write-Host 'Regra criada. Se a rede do totem estiver como "Pública", o admin não abre por outro computador:'
Write-Host '  Configurações > Rede e Internet > (Wi-Fi ou Ethernet) > Propriedades > Tipo de perfil de rede: Privada.'

# 5. Inicialização automática ----------------------------------------------
Titulo '5/7 Inicialização automática ao entrar no Windows'
$usuario = "$env:USERDOMAIN\$env:USERNAME"
$scriptIniciar = Join-Path $Raiz 'scripts\iniciar.ps1'
$acao = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptIniciar`"" `
    -WorkingDirectory $Raiz
$gatilho = New-ScheduledTaskTrigger -AtLogOn -User $usuario
$gatilho.Delay = 'PT10S'
$config = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)
$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
Unregister-ScheduledTask -TaskName $NomeTarefa -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $NomeTarefa -Action $acao -Trigger $gatilho `
    -Settings $config -Principal $principal | Out-Null
Write-Host "Tarefa '$NomeTarefa' criada para o usuário $usuario."

# 6. Energia e tela --------------------------------------------------------
Titulo '6/7 Energia e tela (sem suspender nem apagar a tela)'
foreach ($opcao in 'monitor-timeout-ac', 'monitor-timeout-dc', 'standby-timeout-ac', 'standby-timeout-dc', 'hibernate-timeout-ac', 'hibernate-timeout-dc') {
    powercfg /change $opcao 0 | Out-Null
}
Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name ScreenSaveActive -Value '0'
Write-Host 'Suspensão, hibernação, desligamento da tela e protetor de tela desativados.'

if (Perguntar 'Tentar desativar os gestos de borda da tela de toque (widgets/central de ações)? No Windows Home pode não ter efeito.') {
    $edgeUI = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI'
    New-Item -Path $edgeUI -Force | Out-Null
    Set-ItemProperty -Path $edgeUI -Name AllowEdgeSwipe -Value 0 -Type DWord
    $dsh = 'HKLM:\SOFTWARE\Policies\Microsoft\Dsh'
    New-Item -Path $dsh -Force | Out-Null
    Set-ItemProperty -Path $dsh -Name AllowNewsAndInterests -Value 0 -Type DWord
    Write-Host 'Políticas aplicadas (valem após reiniciar o Windows).'
}

# 7. SSH -------------------------------------------------------------------
Titulo '7/7 Acesso remoto para manutenção (SSH / WinSCP)'
if (Perguntar 'Habilitar o servidor SSH (OpenSSH) do Windows?') {
    try {
        $capacidade = Get-WindowsCapability -Online -Name 'OpenSSH.Server*' | Select-Object -First 1
        if ($capacidade.State -ne 'Installed') {
            Write-Host 'Instalando o OpenSSH Server (precisa de internet)...'
            Add-WindowsCapability -Online -Name $capacidade.Name | Out-Null
        }
        Set-Service -Name sshd -StartupType Automatic
        Start-Service sshd
        if (-not (Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' `
                -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 `
                -Profile Private, Domain | Out-Null
        }
        Write-Host 'SSH ativo na porta 22 (entre com o usuário e a senha do Windows).'
        Write-Host 'ATENÇÃO: o SSH do Windows recusa contas SEM senha. Defina uma senha para este usuário;'
        Write-Host 'o login automático (netplwiz) mantém o totem entrando direto na área de trabalho.' -ForegroundColor Yellow
    } catch {
        Write-Host "Não foi possível habilitar o SSH: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Resumo -------------------------------------------------------------------
$ip = $null
try {
    $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.IPv4Address } |
        Select-Object -First 1).IPv4Address.IPAddress
} catch { }
if (-not $ip) { $ip = 'IP_DO_TOTEM' }

Write-Host ''
Write-Host '==================================' -ForegroundColor Green
Write-Host ' Instalação concluída!' -ForegroundColor Green
Write-Host '==================================' -ForegroundColor Green
Write-Host "Admin (de outro computador ou celular): http://${ip}:${Porta}/admin"
Write-Host 'Usuário: admin'
if ($senhaGerada) {
    Write-Host "Senha:   $senhaGerada   <-- anote! (fica em backend\.env)" -ForegroundColor Yellow
} else {
    Write-Host 'Senha:   a que já está em backend\.env'
}
Write-Host ''

if (Perguntar 'Iniciar o player agora?') {
    Start-ScheduledTask -TaskName $NomeTarefa
    Write-Host 'Iniciando... o player abre em tela cheia em alguns segundos.'
}
Write-Host 'Nas próximas vezes ele inicia sozinho ao entrar no Windows.'
