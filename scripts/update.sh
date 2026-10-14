#!/bin/bash

# Atualiza o Raspberry Pi (kiosk) com a versão mais recente do repositório.
# O conteúdo do player vem do Railway; publicar lá é com `railway up`.
#
# Uso: ./scripts/update.sh [URL_DO_PLAYER]

echo "🔄 Atualizando Media Player..."
echo ""

cd "$(dirname "$0")/.."

echo "[1/2] Baixando atualizações..."
git pull

echo ""
echo "[2/2] Reaplicando configuração do kiosk..."
sudo ./scripts/install.sh "$@"

echo ""
echo "✓ Atualização concluída! Reinicie o Pi (sudo reboot) para aplicar."
