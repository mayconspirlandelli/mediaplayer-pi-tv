# 🎥 Media Player para Raspberry Pi - Digital Signage

Sistema completo de media player estilo painel de elevador para Raspberry Pi + Smart TV via HDMI.

O conteúdo é cadastrado no **Railway**; o Raspberry Pi roda uma cópia local sincronizada (a cada 60 s) e exibe o player em tela cheia na TV, funcionando mesmo sem internet.

- Player: https://mediaplayer.up.railway.app/
- Admin: https://mediaplayer.up.railway.app/admin
- 📖 **[Guia de instalação no Raspberry Pi](docs/RASPBERRY_PI.md)**

## 📋 Características

- ✅ Layout de 2048x1080 que se ajusta a qualquer TV (com faixas pretas quando a proporção difere)
- ✅ 4 regiões independentes: vertical, horizontal, clima e avisos em texto
- ✅ Mídias: vídeo e imagem (upload), avisos em texto, YouTube (inclusive Shorts e ao vivo), Instagram e TikTok
- ✅ Agendamento por período, horário, dias da semana, duração e ordem de exibição
- ✅ Rotação automática quando há mais de um conteúdo na mesma região
- ✅ Painel administrativo web com login (dashboard, mídias, upload, agendamentos com reordenação por arrastar)
- ✅ Inativação automática de agendamentos vencidos
- ✅ Previsão do tempo integrada (OpenWeatherMap)
- ✅ Servidor central no Railway + Raspberry Pi sincronizado que funciona offline
- ✅ Kiosk em tela cheia com autostart no boot do Raspberry Pi

## 🏗️ Arquitetura

```
mediaplayer-pi-tv/
├── backend/              # API Python (FastAPI)
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── routers/      # auth, media, schedule, player, sync
│   │   └── services/     # auth, scheduler, weather, sync
│   ├── uploads/          # Arquivos de mídia
│   ├── tests/
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

## 🖥️ Layout (2048x1080)

O player é desenhado em 2048x1080 (margem de 40 px, espaço de 20 px entre regiões) e escalado para caber na tela da TV.

```
┌──────────────┬────────────────────────────┬─────────────┐
│  REGIÃO 1    │        REGIÃO 2            │  REGIÃO 3   │
│  Vertical    │        Horizontal          │  Clima      │
│  440 x 840   │        1040 x 840          │  400 x 840  │
│              │                            │  data/hora  │
├──────────────┴────────────────────────────┼─────────────┤
│  REGIÃO 4 — Avisos em texto (160 px)      │   logo      │
└───────────────────────────────────────────┴─────────────┘
```

| Região | Conteúdo | Tipos aceitos | Agendável |
|---|---|---|---|
| 1 | Vertical | vídeo, imagem, YouTube, link | Sim |
| 2 | Horizontal | vídeo, imagem, YouTube, link | Sim |
| 3 | Clima, data e hora | automático | Não |
| 4 | Avisos (rolam se o texto for longo) | texto | Sim |

Cada região troca de conteúdo no seu próprio tempo: vídeo enviado dura o tamanho do vídeo; imagem, texto, YouTube e links duram a `duracao` configurada. Vídeos tocam sem som (exigência do autoplay do navegador).

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

As variáveis ficam no Railway (`railway variables`) e, no desenvolvimento, em `backend/.env` (veja `backend/.env.example`):

| Variável | Uso |
|---|---|
| `ADMIN_USER` / `ADMIN_PASSWORD` | login do admin (padrão `admin` / `admin123` — **troque**) |
| `SECRET_KEY` | assinatura dos tokens de login |
| `OPENWEATHER_API_KEY` | chave gratuita em https://openweathermap.org/api |
| `WEATHER_CITY` / `WEATHER_COUNTRY` | cidade do clima (padrão Aparecida de Goiania / BR) |
| `SYNC_TOKEN` | habilita a sincronização com o Raspberry Pi |

Para configurar o clima no Railway:

```bash
railway variable set OPENWEATHER_API_KEY=sua_chave_aqui
```

Lista completa em [docs/SOFTWARE.md](docs/SOFTWARE.md#8-configuração-backendenv).

## 📱 Uso do Painel Admin

Acesse `/admin` e entre com usuário e senha. Abas disponíveis:

- **Dashboard**: estatísticas de mídias e agendamentos
- **Mídias**: lista e exclusão
- **Upload**: vídeo, imagem, texto, YouTube ou link (Instagram/TikTok)
- **Agendamentos**: lista com ordenação por coluna, reordenação por arrastar e edição
- **Novo Agendamento**: escolhe uma mídia existente ou envia uma nova (vídeo, imagem ou link nas regiões 1 e 2; texto na região 4)

### Agendamento

Campos disponíveis:
- **Região**: 1 (vertical), 2 (horizontal) ou 4 (avisos)
- **Período**: *Tempo indeterminado* (padrão — exibe todos os dias, o dia todo, até ser desativado ou excluído) ou *Período específico*, que libera:
  - **Data Início/Fim**: período de exibição
  - **Hora Início/Fim**: horário de exibição
  - **Dias da Semana**: dias em que aparece
- **Duração**: tempo em segundos (imagens, textos e links)
- **Ordem**: sequência na rotação (1 aparece primeiro)
- **Ativo**: liga/desliga o agendamento

Agendamentos cujo período terminou são inativados automaticamente; para reativar, edite com novas datas.

### Exemplo de Agendamento

```
Vídeo Promocional (região 2):
- Data: 01/03/2026 a 15/03/2026
- Horário: 08:00 às 18:00
- Dias: Segunda a Sexta
- Ordem: 1
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

### Backup do banco (Railway)
O banco (`mediaplayer.db`) e os uploads ficam no volume `mediaplayer-volume`, montado em `/data`. Para navegar e baixar os arquivos (exige uma chave SSH cadastrada com `railway ssh keys add`):
```bash
railway volume files --volume mediaplayer-volume browse
```

## 📊 Banco de Dados

SQLite (tabelas criadas automaticamente na inicialização).

**Tabela: media**
- id (INTEGER PRIMARY KEY)
- tipo (TEXT: 'video', 'imagem', 'texto', 'youtube', 'link')
- nome (TEXT)
- caminho_arquivo (TEXT — caminho em `uploads/` ou URL para youtube/link)
- texto (TEXT, só para avisos)
- ativo (BOOLEAN)
- criado_em (DATETIME)

**Tabela: schedule**
- id (INTEGER PRIMARY KEY)
- media_id (INTEGER FK)
- regiao (INTEGER: 1, 2 ou 4)
- data_inicio / data_fim (DATE)
- hora_inicio / hora_fim (TIME)
- duracao (INTEGER, segundos)
- dias_semana (TEXT, lista separada por vírgula, 0 = domingo)
- prioridade (INTEGER — a "Ordem" no painel)
- ativo (BOOLEAN)

**Tabela: weather_cache** — cache da previsão do tempo.

## 🔄 Autostart e Kiosk Mode

O `scripts/install.sh` configura o Pi para:

1. Abrir o player automaticamente no boot (LXDE, Wayfire e labwc)
2. Rodar o backend local e sincronizar com o Railway a cada 60 s (funciona offline)
3. Abrir em fullscreen (sem bordas) e reabrir se o navegador fechar
4. Desabilitar o apagamento de tela e ocultar o cursor

Detalhes e solução de problemas no **[guia do Raspberry Pi](docs/RASPBERRY_PI.md)**.

## 🌡️ Previsão do Tempo

- Atualização automática a cada 10 minutos, com cache no banco
- Temperatura em Celsius e ícone do clima
- No Raspberry Pi, o clima vem do servidor central (não precisa de chave no Pi)
- Sem chave ou sem internet, mostra "Clima indisponível"

## ⚡ Performance

- Prefira vídeos **MP4 H.264**; no Raspberry Pi 3, use 720p
- Links do YouTube/Instagram/TikTok são mais pesados e dependem de internet
- No Pi, mídias ficam no cartão SD (não consomem banda a cada exibição)

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

Documentação interativa em `/docs`. Resumo:

### Media (exige login)
- `GET /api/media/` - Lista mídias
- `POST /api/media/upload` - Upload de vídeo/imagem
- `POST /api/media/text` - Cria aviso de texto
- `POST /api/media/youtube` - Cadastra link do YouTube
- `POST /api/media/link` - Cadastra link (Instagram, TikTok…)
- `PUT /api/media/{id}` - Altera nome, texto ou ativo
- `DELETE /api/media/{id}` - Remove mídia, arquivo e agendamentos

### Schedule (exige login)
- `GET /api/schedule/` - Lista agendamentos (inativa os vencidos)
- `POST /api/schedule/` - Cria agendamento
- `PUT /api/schedule/{id}` - Atualiza agendamento
- `DELETE /api/schedule/{id}` - Remove agendamento
- `PUT /api/schedule/reorder` - Atualiza a ordem em lote

### Player (público)
- `GET /api/player/active-content/region/{n}` - Conteúdo atual da região
- `GET /api/player/weather` - Dados do clima

### Auth
- `POST /api/auth/login` - Login → token
- `GET /api/auth/me` - Valida o token

### Sync (exige `SYNC_TOKEN`)
- `GET /api/sync/export` - Mídias e agendamentos para o Raspberry Pi
- `GET /api/sync/frontend` - Build do frontend para o Raspberry Pi

## 🔒 Segurança

- Painel admin e rotas de mídia/agendamento protegidos por login (token Bearer com validade de 12h)
- Troque `ADMIN_PASSWORD` e defina `SECRET_KEY` em produção
- Sincronização do Pi usa um token separado (`SYNC_TOKEN`)
- O player (`/`) e `/api/player/*` são públicos, para a TV abrir sem login

## 📄 Licença

MIT License - Uso livre

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs
2. Consulte Troubleshooting
3. Abra uma issue no repositório

---

**Desenvolvido para Raspberry Pi 3/4 + Smart TV HDMI**
**Layout: 2048x1080, ajustado à resolução da TV**
**Servidor: Railway · Pi: Raspberry Pi OS**
