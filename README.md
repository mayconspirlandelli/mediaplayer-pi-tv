# 🎥 Media Player para Raspberry Pi - Digital Signage

Sistema completo de media player estilo painel de elevador para Raspberry Pi + Smart TV via HDMI.

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
│   ├── install.sh
│   ├── autostart.sh
│   └── kiosk-setup.sh
└── README.md
```

## 🖥️ Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────┐
│  REGIÃO 1: Vídeos Verticais  │  REGIÃO 2: Fotos         │
│  (1080x1080)                  │  (840x980)               │
│                               │                           │
│                               │  REGIÃO 3: Clima          │
│                               │  (840x100)                │
├───────────────────────────────┴───────────────────────────┤
│  REGIÃO 4: Avisos em Texto (1920x100)                     │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Instalação Rápida

### Pré-requisitos
- Raspberry Pi 4 (2GB+ RAM)
- Raspberry Pi OS (64-bit recomendado)
- Conexão internet (para instalação inicial)

### Instalação Automática

```bash
# Clone o projeto
cd /home/pi
git clone [seu-repositorio]
cd mediaplayer-pi

# Execute o instalador
chmod +x scripts/install.sh
./scripts/install.sh
```

O script irá:
1. Instalar Node.js e Python
2. Instalar dependências
3. Configurar banco de dados
4. Fazer build do frontend
5. Configurar autostart
6. Configurar modo kiosk

### Instalação Manual

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
http://localhost:8000
```

### Painel Administrativo
```
http://localhost:8000/admin
```

### Da rede local
```
http://IP_DO_RASPBERRY:8000
http://IP_DO_RASPBERRY:8000/admin
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

### Ver logs
```bash
journalctl -u mediaplayer -f
```

### Reiniciar serviço
```bash
sudo systemctl restart mediaplayer
```

### Atualizar conteúdo
```bash
cd /home/pi/mediaplayer-pi
git pull
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

O sistema está configurado para:

1. Iniciar automaticamente no boot
2. Abrir em fullscreen (sem bordas)
3. Desabilitar screensaver
4. Ocultar cursor do mouse
5. Reiniciar automaticamente se travar

### Configuração Manual

Edite `/etc/xdg/lxsession/LXDE-pi/autostart`:
```bash
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:8000
@unclutter -idle 0
```

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

### Sistema não inicia
```bash
sudo systemctl status mediaplayer
journalctl -u mediaplayer -n 50
```

### Vídeos não reproduzem
- Verifique codec (use H.264)
- Teste com VLC: `vlc seu-video.mp4`
- Reconverta: `ffmpeg -i input.mp4 -c:v h264 -c:a aac output.mp4`

### Clima não atualiza
- Verifique API key no `.env`
- Teste: `curl "http://localhost:8000/api/weather"`
- Verifique logs do backend

### Tela fica preta
- Verifique se há mídia agendada
- Verifique logs: `journalctl -u mediaplayer -f`
- Reinicie: `sudo systemctl restart mediaplayer`

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
