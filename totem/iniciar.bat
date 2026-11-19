@echo off
rem Inicia o servidor e abre o player em tela cheia (manualmente).
rem No uso normal isso roda sozinho ao entrar no Windows.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar.ps1"
