@echo off
rem Atualiza o programa a partir de um novo ZIP, preservando banco, midias e .env.
rem Uso: atualizar.bat [caminho_do_zip] [/sem-pausa]
rem Sem caminho, usa o mediaplayer-totem*.zip mais recente desta pasta ou da pasta acima.
rem Roda uma copia do script em %TEMP%, para poder substituir a propria pasta scripts.
copy /y "%~dp0scripts\atualizar.ps1" "%TEMP%\mediaplayer-atualizar.ps1" >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\mediaplayer-atualizar.ps1" -Raiz "%~dp0." -Zip "%~1"
if /i not "%~2"=="/sem-pausa" pause
