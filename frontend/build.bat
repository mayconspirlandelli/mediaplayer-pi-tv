@echo off
REM Script para fazer build do frontend

echo.
echo ========================================
echo   Media Player - Build Frontend
echo ========================================
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [ERRO] node_modules nao encontrado!
    echo Execute: npm install
    pause
    exit /b 1
)

echo Fazendo build de producao...
echo.

call npm run build

if errorlevel 1 (
    echo.
    echo [ERRO] Build falhou!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build concluido com sucesso!
echo ========================================
echo.
echo Arquivos gerados em: dist\
echo.
echo O backend em http://localhost:8000 vai servir estes arquivos
echo.
pause
