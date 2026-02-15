#!/bin/bash

# Script para atualizar o sistema após mudanças no código

echo "🔄 Atualizando Media Player..."
echo ""

cd "$(dirname "$0")/.."

echo "[1/4] Atualizando backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

echo ""
echo "[2/4] Atualizando frontend..."
cd ../frontend
npm install
npm run build

echo ""
echo "[3/4] Reiniciando serviço..."
sudo systemctl restart mediaplayer

echo ""
echo "[4/4] Verificando status..."
sleep 2
sudo systemctl status mediaplayer --no-pager

echo ""
echo "✓ Atualização concluída!"
