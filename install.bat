@echo off
REM Media Player - Script de Instalação para Windows
REM Para desenvolvimento no VSCode

echo ==================================
echo Media Player - Instalação Windows
echo ==================================
echo.

REM Verificar se está no diretório correto
if not exist "backend" (
    echo [ERRO] Diretorio backend nao encontrado!
    echo Execute este script na raiz do projeto mediaplayer-pi
    pause
    exit /b 1
)

echo [1/6] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo Instale Python 3.9+ em: https://www.python.org/downloads/
    echo IMPORTANTE: Marque "Add Python to PATH" durante a instalacao
    pause
    exit /b 1
)
echo [OK] Python encontrado
echo.

echo [2/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale Node.js 18+ em: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
echo.

echo [3/6] Configurando backend Python...
cd backend

REM Criar ambiente virtual
if not exist "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Ativar ambiente virtual
call venv\Scripts\activate.bat

REM Instalar dependências
echo Instalando dependencias Python...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Criar arquivo .env
if not exist ".env" (
    echo Criando arquivo .env...
    copy .env.example .env
    echo.
    echo [AVISO] Configure sua API key no arquivo backend\.env
    echo.
)

REM Criar diretório de uploads
if not exist "uploads" mkdir uploads

REM Inicializar banco de dados
echo Inicializando banco de dados...
python -c "from app.database import init_db; init_db()"

deactivate
cd ..

echo.
echo [4/6] Configurando frontend React...
cd frontend

REM Instalar dependências
echo Instalando dependencias Node.js...
call npm install

echo.
echo [5/6] Fazendo build do frontend...
call npm run build

cd ..

echo.
echo [6/6] Instalacao concluida!
echo.
echo ==================================
echo      Instalacao Concluida!
echo ==================================
echo.
echo Para iniciar o sistema:
echo.
echo   1. Abra um terminal e execute:
echo      cd backend
echo      .\run.bat
echo.
echo   2. Para desenvolvimento do frontend (opcional):
echo      Abra outro terminal e execute:
echo      cd frontend
echo      npm run dev
echo.
echo Acessar:
echo   - Backend API: http://localhost:8000
echo   - Frontend Dev: http://localhost:3000
echo   - Admin: http://localhost:8000/admin
echo   - API Docs: http://localhost:8000/docs
echo.
echo IMPORTANTE:
echo   Configure sua API key do OpenWeatherMap em:
echo   backend\.env
echo.
echo ==================================
pause
