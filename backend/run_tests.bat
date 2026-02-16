@echo off
REM Script para executar os testes do backend

echo ======================================
echo Executando testes do SchedulerService
echo ======================================
echo.

cd /d "%~dp0"

REM Verificar se pytest está instalado
python -c "import pytest" 2>nul
if errorlevel 1 (
    echo [AVISO] pytest nao esta instalado. Instalando...
    pip install pytest pytest-asyncio
    echo.
)

REM Executar os testes
echo Executando testes...
echo.
python -m pytest tests\test_scheduler_service.py -v --tb=short

echo.
echo ======================================
echo Testes concluidos!
echo ======================================
pause
