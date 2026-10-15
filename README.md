# 🎥 Media Player para Raspberry Pi - Digital Signage

Sistema completo de media player estilo painel de elevador para Raspberry Pi + Smart TV via HDMI.

O conteúdo é cadastrado no **Railway**; o Raspberry Pi roda uma cópia local sincronizada (a cada 60 s) e exibe o player em tela cheia na TV, funcionando mesmo sem internet.

- Player: https://mediaplayer.up.railway.app/
- Admin: https://mediaplayer.up.railway.app/admin
- 📖 **[Guia de instalação no Raspberry Pi](docs/RASPBERRY_PI.md)**

## 📋 Características

- ✅ Fullscreen/Kiosk mode automático
- ✅ Resolução fixa 1920x1080 (Full HD)
- ✅ 4 regiões de conteúdo independentes
- ✅ Sistema de agendamento completo
- ✅ Painel administrativo web
- ✅ Previsão do tempo integrada
- ✅ Funcionamento offline (exceto clima)
- ✅ Autostart no boot do Raspberry Pi

## 🏗️ Arquitetura

```
mediaplayer-pi/
├── backend/              # API Python (FastAPI)
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── routers/
│   │   └── services/
│   ├── uploads/          # Arquivos de mídia
│   ├── requirements.txt
│   └── run.sh
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── scripts/              # Scripts de deploy
│   ├── install.sh        # Pi: backend local sincronizado + Chromium em kiosk
│   ├── update.sh         # Pi: git pull + reinstala
│   └── railway-start.sh  # inicialização do container no Railway
├── docs/                 # SOFTWARE.md, RASPBERRY_PI.md
├── Dockerfile            # imagem usada no Railway
└── README.md
```

## 🖥️ Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────┐
│  REGIÃO 1: Vídeos Verticais  │  REGIÃO 2: Imagens         │
│  (1080x1080)                  │  (840x980)               │
│                               │                           │
│                               │  REGIÃO 3: Clima          │
│                               │  (840x100)                │
├───────────────────────────────┴───────────────────────────┤
│  REGIÃO 4: Avisos em Texto (1920x100)                     │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Instalação Rápida

### Raspberry Pi (tela da TV)

Siga o **[guia de instalação no Raspberry Pi](docs/RASPBERRY_PI.md)**. Em resumo, no terminal do Pi:

```bash
git clone https://github.com/mayconspirlandelli/mediaplayer-pi-tv.git
cd mediaplayer-pi-tv && sudo ./scripts/install.sh
```

O script pede o token de sincronização (`SYNC_TOKEN` do Railway). Depois ative o login automático na área de trabalho (`sudo raspi-config`) e reinicie. O Pi roda o backend localmente, sincroniza com o Railway e abre o player em `http://localhost:8000` em modo kiosk, com autostart no boot.

### Servidor (Railway)

O `Dockerfile` faz o build do frontend e sobe o FastAPI; banco e uploads ficam no volume `/data`. Para publicar uma nova versão:

```bash
railway up
```

### Desenvolvimento local

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app/main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run build
```

## 🌐 Acessar o Sistema

### Media Player (Fullscreen)
```
https://mediaplayer.up.railway.app/
```

### Painel Administrativo
```
https://mediaplayer.up.railway.app/admin
```

### Desenvolvimento local
```
http://localhost:3000        (npm run dev)
http://localhost:8000        (backend servindo o build)
```

## 🔧 Configuração

### API de Clima (OpenWeatherMap)

1. Crie conta gratuita: https://openweathermap.org/api
2. Obtenha sua API Key
3. Edite o arquivo `.env`:

```bash
OPENWEATHER_API_KEY=sua_chave_aqui
WEATHER_CITY=Aparecida de Goiania
WEATHER_COUNTRY=BR
```

### Configuração de Cidade

Edite `backend/.env`:
```
WEATHER_CITY=SuaCidade
WEATHER_COUNTRY=BR
WEATHER_UPDATE_INTERVAL=600  # 10 minutos
```

## 📱 Uso do Painel Admin

### Upload de Mídia

1. Acesse `/admin`
2. Clique em "Nova Mídia"
3. Selecione o tipo (Vídeo/Imagem/Texto)
4. Faça upload do arquivo
5. Configure agendamento
6. Salve

### Agendamento

Campos disponíveis:
- **Data Início/Fim**: Período de exibição
- **Hora Início/Fim**: Horário de exibição
- **Duração**: Tempo em segundos (para imagens/textos)
- **Dias da Semana**: Selecione os dias
- **Prioridade**: Resolução de conflitos

### Exemplo de Agendamento

```
Vídeo Promocional:
- Data: 01/03/2026 a 15/03/2026
- Horário: 08:00 às 18:00
- Dias: Segunda a Sexta
- Duração: 30 segundos
- Prioridade: Alta
```

## 🛠️ Manutenção

### Ver logs do servidor
```bash
railway logs
```

### Publicar nova versão
```bash
railway up
```

### Atualizar o código do Raspberry Pi (o conteúdo sincroniza sozinho)
```bash
cd ~/mediaplayer-pi-tv
./scripts/update.sh
```

### Backup do banco
```bash
cp backend/mediaplayer.db backend/mediaplayer.db.backup
```

## 📊 Banco de Dados

### Estrutura

**Tabela: media**
- id (INTEGER PRIMARY KEY)
- tipo (TEXT: 'video', 'imagem', 'texto')
- caminho_arquivo (TEXT)
- texto (TEXT, nullable)
- ativo (BOOLEAN)
- criado_em (DATETIME)

**Tabela: schedule**
- id (INTEGER PRIMARY KEY)
- media_id (INTEGER FK)
- data_inicio (DATE)
- data_fim (DATE)
- hora_inicio (TIME)
- hora_fim (TIME)
- duracao (INTEGER, segundos)
- dias_semana (TEXT, JSON)
- prioridade (INTEGER)
- ativo (BOOLEAN)

## 🔄 Autostart e Kiosk Mode

O `scripts/install.sh` configura o Pi para:

1. Abrir o player automaticamente no boot (LXDE, Wayfire e labwc)
2. Rodar o backend local e sincronizar com o Railway a cada 60 s (funciona offline)
3. Abrir em fullscreen (sem bordas) e reabrir se o navegador fechar
4. Desabilitar o apagamento de tela e ocultar o cursor

Detalhes e solução de problemas no **[guia do Raspberry Pi](docs/RASPBERRY_PI.md)**.

## 🌡️ Previsão do Tempo

- Atualização automática a cada 10 minutos
- Cache local para funcionamento offline
- Fallback para última previsão salva
- Temperatura em Celsius
- Ícones de clima

## ⚡ Performance

Otimizações para Raspberry Pi:

- Build otimizado do Vite
- Vídeos em H.264 (aceleração hardware)
- Imagens otimizadas (max 1920x1080)
- SQLite com índices
- Cache de assets estáticos

## 🐛 Troubleshooting

### Player não abre no Pi
Veja a seção "Problemas comuns" do [guia do Raspberry Pi](docs/RASPBERRY_PI.md).

### Vídeos não reproduzem
- Verifique codec (use H.264)
- Teste com VLC: `vlc seu-video.mp4`
- Reconverta: `ffmpeg -i input.mp4 -c:v h264 -c:a aac output.mp4`

### Clima não atualiza
- Verifique `OPENWEATHER_API_KEY` no Railway: `railway variables`
- Teste: `curl "https://mediaplayer.up.railway.app/api/player/weather"`
- Verifique logs: `railway logs`

### Tela fica preta
- Verifique se há mídia agendada
- Verifique logs: `railway logs`
- Reinicie o Pi: `sudo reboot`

## 📝 API Endpoints

### Media
- `GET /api/media` - Lista todas as mídias
- `POST /api/media` - Upload nova mídia
- `PUT /api/media/{id}` - Atualiza mídia
- `DELETE /api/media/{id}` - Remove mídia

### Schedule
- `GET /api/schedule` - Lista agendamentos
- `POST /api/schedule` - Cria agendamento
- `PUT /api/schedule/{id}` - Atualiza agendamento
- `DELETE /api/schedule/{id}` - Remove agendamento

### Player
- `GET /api/active-content` - Conteúdo ativo no momento
- `GET /api/weather` - Dados do clima

### Admin
- `GET /admin` - Painel administrativo

## 🔒 Segurança

- Acesso restrito à rede local
- Sem autenticação (ambiente controlado)
- Para produção, adicione auth básica

## 📄 Licença

MIT License - Uso livre

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs
2. Consulte Troubleshooting
3. Abra uma issue no repositório

---

**Desenvolvido para Raspberry Pi 4 + Smart TV HDMI**
**Resolução: 1920x1080 (Full HD)**
**Sistema: Raspberry Pi OS**
