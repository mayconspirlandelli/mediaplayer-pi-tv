@echo off
rem Para o player e o servidor (manutencao). Para voltar: iniciar.bat ou reinicie o Windows.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\parar.ps1"
if /i not "%~1"=="/sem-pausa" pause
