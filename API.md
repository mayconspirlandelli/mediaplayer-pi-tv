# 📡 API Documentation - Media Player

API REST completa para gerenciamento do media player.

Base URL: `http://localhost:8000` ou `http://IP-DO-RASPBERRY:8000`

## 🎬 Media Endpoints

### Listar todas as mídias
```http
GET /api/media
```

**Query Parameters:**
- `tipo` (opcional): `video`, `imagem`, `texto`
- `ativo` (opcional): `true`, `false`

**Response:**
```json
[
  {
    "id": 1,
    "tipo": "video",
    "nome": "Vídeo Promocional",
    "caminho_arquivo": "/uploads/video.mp4",
    "texto": null,
    "ativo": true,
    "criado_em": "2026-02-15T10:00:00",
    "schedules_count": 2
  }
]
```

### Upload de vídeo/imagem
```http
POST /api/media/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: arquivo (obrigatório)
- `tipo`: "video" ou "imagem" (obrigatório)
- `nome`: nome descritivo (opcional)

**Response:**
```json
{
  "id": 1,
  "tipo": "video",
  "nome": "Meu Vídeo",
  "caminho_arquivo": "/uploads/20260215_100000_video.mp4",
  "message": "Upload realizado com sucesso"
}
```

### Criar mídia de texto
```http
POST /api/media/text
Content-Type: multipart/form-data
```

**Form Data:**
- `nome`: nome do aviso (obrigatório)
- `texto`: conteúdo do texto (obrigatório)

**Response:**
```json
{
  "id": 1,
  "tipo": "texto",
  "nome": "Aviso Importante",
  "texto": "Manutenção programada hoje às 14h",
  "message": "Texto criado com sucesso"
}
```

### Deletar mídia
```http
DELETE /api/media/{id}
```

**Response:**
```json
{
  "message": "Mídia removida com sucesso"
}
```

### Estatísticas
```http
GET /api/media/stats/summary
```

**Response:**
```json
{
  "total": 15,
  "videos": 5,
  "imagens": 8,
  "textos": 2,
  "ativos": 12,
  "inativos": 3
}
```

---

## 📅 Schedule Endpoints

### Listar agendamentos
```http
GET /api/schedule
```

**Query Parameters:**
- `regiao` (opcional): 1, 2, ou 4
- `ativo` (opcional): `true`, `false`

**Response:**
```json
[
  {
    "id": 1,
    "media_id": 5,
    "media_nome": "Vídeo Promocional",
    "media_tipo": "video",
    "regiao": 1,
    "data_inicio": "2026-02-01",
    "data_fim": "2026-02-28",
    "hora_inicio": "08:00:00",
    "hora_fim": "18:00:00",
    "duracao": 30,
    "dias_semana": "1,2,3,4,5",
    "prioridade": 5,
    "ativo": true,
    "criado_em": "2026-01-15T10:00:00"
  }
]
```

### Criar agendamento
```http
POST /api/schedule
Content-Type: application/json
```

**Body:**
```json
{
  "media_id": 5,
  "regiao": 1,
  "data_inicio": "2026-02-01",
  "data_fim": "2026-02-28",
  "hora_inicio": "08:00:00",
  "hora_fim": "18:00:00",
  "duracao": 30,
  "dias_semana": "1,2,3,4,5",
  "prioridade": 5,
  "ativo": true
}
```

**Campos:**
- `media_id`: ID da mídia (obrigatório)
- `regiao`: 1=vídeo, 2=imagem, 4=texto (obrigatório)
- `data_inicio`: YYYY-MM-DD (obrigatório)
- `data_fim`: YYYY-MM-DD (obrigatório)
- `hora_inicio`: HH:MM:SS (obrigatório)
- `hora_fim`: HH:MM:SS (obrigatório)
- `duracao`: segundos (default: 10)
- `dias_semana`: "0,1,2,3,4,5,6" onde 0=domingo (default: todos)
- `prioridade`: 1-10 (default: 1)
- `ativo`: true/false (default: true)

**Response:**
```json
{
  "id": 1,
  "message": "Agendamento criado com sucesso"
}
```

### Atualizar agendamento
```http
PUT /api/schedule/{id}
Content-Type: application/json
```

**Body:** (todos campos opcionais)
```json
{
  "data_fim": "2026-03-31",
  "prioridade": 8,
  "ativo": false
}
```

### Deletar agendamento
```http
DELETE /api/schedule/{id}
```

### Próximos agendamentos
```http
GET /api/schedule/next/{regiao}?hours=24
```

Retorna agendamentos futuros para uma região específica.

---

## 🎮 Player Endpoints

### Conteúdo ativo
```http
GET /api/player/active-content
```

Retorna o conteúdo que deve estar sendo exibido AGORA em cada região.

**Response:**
```json
{
  "video": {
    "id": 5,
    "tipo": "video",
    "nome": "Vídeo Promocional",
    "caminho_arquivo": "/uploads/video.mp4",
    "texto": null,
    "duracao": 30,
    "schedule_id": 1
  },
  "imagem": {
    "id": 8,
    "tipo": "imagem",
    "nome": "Banner",
    "caminho_arquivo": "/uploads/banner.jpg",
    "texto": null,
    "duracao": 15,
    "schedule_id": 3
  },
  "texto": null,
  "timestamp": "2026-02-15T14:30:00"
}
```

### Clima
```http
GET /api/player/weather
```

**Response:**
```json
{
  "temperatura": 28,
  "condicao": "Parcialmente nublado",
  "icone": "02d",
  "cidade": "Aparecida de Goiania",
  "emoji": "⛅",
  "cached": false
}
```

### Health Check
```http
GET /api/player/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "mediaplayer-api"
}
```

---

## 🔧 Exemplos de Uso

### Exemplo: Upload e Agendamento Completo

```bash
# 1. Upload de vídeo
curl -X POST http://localhost:8000/api/media/upload \
  -F "file=@meu-video.mp4" \
  -F "tipo=video" \
  -F "nome=Vídeo Promocional Março"

# Resposta: {"id": 10, ...}

# 2. Criar agendamento
curl -X POST http://localhost:8000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "media_id": 10,
    "regiao": 1,
    "data_inicio": "2026-03-01",
    "data_fim": "2026-03-31",
    "hora_inicio": "08:00:00",
    "hora_fim": "18:00:00",
    "dias_semana": "1,2,3,4,5",
    "prioridade": 5
  }'

# 3. Verificar conteúdo ativo
curl http://localhost:8000/api/player/active-content
```

### Exemplo: Criar Aviso de Texto

```bash
curl -X POST http://localhost:8000/api/media/text \
  -F "nome=Aviso Manutenção" \
  -F "texto=Manutenção programada hoje às 15h. Sistema pode ficar indisponível."

# Depois agendar na região 4 (texto)
```

### Exemplo: Listar apenas vídeos ativos

```bash
curl "http://localhost:8000/api/media?tipo=video&ativo=true"
```

---

## 📝 Notas Importantes

1. **Região vs Tipo de Mídia:**
   - Região 1 aceita apenas `video`
   - Região 2 aceita apenas `imagem`
   - Região 4 aceita apenas `texto`

2. **Dias da Semana:**
   - 0 = Domingo
   - 1 = Segunda
   - 2 = Terça
   - 3 = Quarta
   - 4 = Quinta
   - 5 = Sexta
   - 6 = Sábado
   - Exemplo: "1,2,3,4,5" = Segunda a Sexta

3. **Prioridade:**
   - Quando há conflito de agendamentos, o de maior prioridade é exibido
   - Valores: 1 (baixa) a 10 (alta)

4. **Duração:**
   - Para vídeos: ignorado (usa duração natural do vídeo)
   - Para imagens: tempo em segundos de exibição
   - Para textos: tempo em segundos de exibição

---

## 🌐 Documentação Interativa

Acesse a documentação Swagger automática:
```
http://localhost:8000/docs
```

Ou ReDoc:
```
http://localhost:8000/redoc
```
