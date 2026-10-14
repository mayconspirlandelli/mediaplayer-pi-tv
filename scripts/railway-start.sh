#!/bin/sh
# Inicialização na nuvem (Railway/Docker).
# Banco e uploads ficam em $DATA_DIR (volume persistente). O link simbólico
# mantém caminho_arquivo relativo ("uploads/...") como no Pi.
set -e
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/uploads"
rm -rf uploads
ln -s "$DATA_DIR/uploads" uploads
export DATABASE_URL="${DATABASE_URL:-sqlite:///$DATA_DIR/mediaplayer.db}"
export UPLOAD_DIR=uploads
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips='*'
