@echo off
REM Script para rodar o frontend em modo desenvolvimento

echo.
echo ========================================
echo   Media Player - Frontend Dev
echo ========================================
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [ERRO] node_modules nao encontrado!
    echo Execute install.bat primeiro
    pause
    exit /b 1
)

echo Iniciando servidor de desenvolvimento...
echo.
echo Acesse: http://localhost:3000
echo.
echo O backend deve estar rodando em http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev
