#!/bin/bash

# Atualiza o código do Raspberry Pi (backend local e scripts) com a versão do repositório.
# Mídias, agendamentos e o frontend já chegam sozinhos pela sincronização com o servidor.
#
# Uso: ./scripts/update.sh [URL_DO_SERVIDOR]

echo "🔄 Atualizando Media Player..."
echo ""

cd "$(dirname "$0")/.."

echo "[1/2] Baixando atualizações..."
git pull

echo ""
echo "[2/2] Reaplicando a instalação (o token salvo em backend/.env é reaproveitado)..."
sudo ./scripts/install.sh "$@"

echo ""
echo "✓ Atualização concluída! Reinicie o Pi (sudo reboot) para aplicar."
