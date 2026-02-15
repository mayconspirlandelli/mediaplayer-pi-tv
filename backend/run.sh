#!/bin/bash

# Script para rodar o backend manualmente (desenvolvimento)

echo "🎬 Iniciando Media Player Backend..."
echo ""

cd "$(dirname "$0")"

# Ativar ambiente virtual
if [ -d "venv" ]; then
  source venv/bin/activate
else
  echo "❌ Ambiente virtual não encontrado!"
  echo "Execute: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
  echo "⚠️  Arquivo .env não encontrado. Criando a partir do exemplo..."
  cp .env.example .env
  echo "✓ Arquivo .env criado. Configure antes de continuar!"
  exit 1
fi

# Criar diretórios necessários
mkdir -p uploads

# Inicializar banco se necessário
if [ ! -f "mediaplayer.db" ]; then
  echo "📊 Inicializando banco de dados..."
  python3 -c "from app.database import init_db; init_db()"
fi

# Iniciar servidor
echo ""
echo "✓ Iniciando servidor..."
echo ""

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
