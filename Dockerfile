# Build do frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend (FastAPI) servindo também o frontend/dist
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DATA_DIR=/data \
    TZ=America/Sao_Paulo
# tzdata: agendamentos usam o horário local do servidor
RUN apt-get update && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/app ./app
COPY backend/test_player.html ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist
COPY scripts/railway-start.sh /app/railway-start.sh
RUN chmod +x /app/railway-start.sh
EXPOSE 8000
CMD ["/app/railway-start.sh"]
