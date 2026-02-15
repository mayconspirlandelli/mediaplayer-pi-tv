@echo off
REM Script para rodar o backend no Windows

echo.
echo ========================================
echo   Media Player - Backend (Windows)
echo ========================================
echo.

REM Verificar se está no diretório correto
if not exist "venv" (
    echo [ERRO] Ambiente virtual nao encontrado!
    echo Execute install.bat primeiro
    pause
    exit /b 1
)

REM Verificar se .env existe
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado. Criando...
    copy .env.example .env
    echo.
    echo Configure sua API key antes de continuar!
    echo Edite o arquivo backend\.env
    pause
    exit /b 1
)

REM Ativar ambiente virtual
call venv\Scripts\activate.bat

REM Criar diretórios necessários
if not exist "uploads" mkdir uploads

REM Inicializar banco se necessário
if not exist "mediaplayer.db" (
    echo Inicializando banco de dados...
    python -c "from app.database import init_db; init_db()"
)

REM Iniciar servidor
echo.
echo Iniciando servidor...
echo.
echo Acesse:
echo   - Player: http://localhost:8000
echo   - Admin: http://localhost:8000/admin
echo   - API Docs: http://localhost:8000/docs
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
