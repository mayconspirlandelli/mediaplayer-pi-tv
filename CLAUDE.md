# CLAUDE.md

Guia para o Claude Code neste repositório. Documentação completa do produto: [docs/SOFTWARE.md](docs/SOFTWARE.md).

## O que é

Sistema de **digital signage** (painel de TV estilo elevador). Admin cadastra mídias (vídeo, imagem, texto, links YouTube/Instagram/TikTok), agenda quando cada uma aparece em cada região da tela, e o player (`/`) exibe isso em tela cheia numa TV. Roda em Raspberry Pi (Chromium em kiosk) ou na nuvem (a TV abre a URL).

Idioma do projeto: **português** (código de domínio, UI, commits, docs).

## Stack

- **Backend**: FastAPI + SQLAlchemy 2 + SQLite (`backend/mediaplayer.db`), httpx (clima OpenWeather). Python, venv em `.venv`.
- **Frontend**: React 18 + Vite 5 + react-router-dom 6. JS puro (sem TypeScript), CSS por componente, sem libs de UI/estado.
- Autenticação simples (usuário/senha do `.env` → token Bearer HMAC). Sem migrations (tabelas via `Base.metadata.create_all`), sem lint configurado.

## Comandos

```bash
# Backend (porta 8000) — a partir de backend/
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env
./run.sh                 # ou: python -m app.main   (Windows: run.bat)
# Docs da API: http://localhost:8000/docs

# Frontend (porta 3000, proxy /api e /uploads -> 127.0.0.1:8000) — a partir de frontend/
npm install
npm run dev
npm run build            # gera frontend/dist, servido pelo FastAPI em / e /admin

# Testes — a partir de backend/
pytest tests/            # (run_tests.bat no Windows); test_image_schedule.py exige servidor rodando
```

Produção: backend+frontend no **Railway** (`Dockerfile`, `railway.json`, `scripts/railway-start.sh`; banco e uploads no volume `/data`; publicar com `railway up`). URL: https://mediaplayer.up.railway.app/.
Raspberry Pi = só tela: `sudo ./scripts/install.sh [URL]` instala o Chromium em kiosk apontando para o Railway (autostart LXDE/Wayfire/labwc, espera a rede, reabre se fechar); `scripts/update.sh` faz `git pull` e reaplica. Guia de instalação: [docs/RASPBERRY_PI.md](docs/RASPBERRY_PI.md).

## Estrutura

```
backend/app/
  main.py            # app FastAPI, CORS *, monta /uploads e (se existir) frontend/dist
  database.py        # engine/sessão, init_db()
  models.py          # Media, Schedule, WeatherCache
  routers/auth.py    # /api/auth (login, me)
  routers/media.py   # /api/media  (upload, text, youtube, link, CRUD, stats) — exige login
  routers/schedule.py# /api/schedule (CRUD, next, conflicts, reorder) — exige login
  routers/player.py  # /api/player (active-content, weather)
  services/auth.py       # credenciais do .env, criação/validação do token
  services/scheduler.py  # regra de "o que exibir agora" + validação + deactivate_expired
  services/weather.py    # OpenWeather + cache em banco
frontend/src/
  App.jsx            # rotas: "/" Player, "/admin" AdminPage
  components/Player.jsx          # grid 2048x1080 escalado p/ caber na tela (getStageTransform), busca conteúdo por região
  components/UniversalRegion.jsx # regiões 1 e 2 (vídeo/imagem/youtube/link) — USAR ESTE
  components/TextRegion.jsx, WeatherRegion.jsx
  components/Login.jsx           # tela de login do /admin
  components/admin/  # MediaUpload, MediaList, ScheduleForm, ScheduleList, Stats
  pages/AdminPage.jsx            # abas: Dashboard, Mídias, Upload, Agendamentos, Novo Agendamento
  services/api.js    # único cliente HTTP (fetch); `auth` guarda o token no localStorage; `authFetch` envia Bearer e desloga em 401
```

## Conceitos-chave

- **Regiões**: 1 = vertical (440x840), 2 = horizontal (1040x840), 3 = clima (automático, sem agendamento), 4 = avisos de texto (barra inferior). Regiões 1 e 2 aceitam `video|imagem|youtube|link`; região 4 só `texto`.
- **Tipos de `Media.tipo`**: `video`, `imagem`, `texto`, `youtube`, `link`. Para `youtube`/`link`, a URL fica em `caminho_arquivo`.
- **Schedule** liga mídia + região + janela (`data_inicio/fim`, `hora_inicio/fim`) + `dias_semana` (CSV, 0=domingo) + `duracao` (s) + `prioridade` (na UI chamada "Ordem": menor = primeiro) + `ativo`.
- **Seleção de conteúdo** (`SchedulerService._get_content_for_region`): filtra schedules ativos na janela/dia, ordena por `prioridade ASC, id DESC` e rotaciona por `segundos_desde_meia_noite % soma(duracao)`. Cada região é **independente**.
- **Player**: cada região pede `/api/player/active-content/region/{n}` e, ao terminar (vídeo `onEnded`; demais por timer `duracao`; erro → pula após 5s), chama `onComplete` para buscar o próximo. Regiões vazias são re-consultadas a cada 15s. Clima a cada 10 min.
- Datas/horas usam o **horário local do servidor** (`datetime.now()`); `criado_em` usa UTC.

## Autenticação

- `ADMIN_USER` / `ADMIN_PASSWORD` no `backend/.env` (padrão `admin` / `admin123` — **trocar na nuvem**). `SECRET_KEY` e `AUTH_TOKEN_TTL` (12h) opcionais.
- Routers `media` e `schedule` têm `dependencies=[Depends(require_auth)]`. Ficam **públicos**: `/api/player/*`, `/api/health`, `/api/auth/login`, `/uploads/*`, o frontend (`/`, `/admin`).
- Não colocar auth em `/api/player/*`: a TV abre a URL sem login.

## Agendamentos vencidos

`SchedulerService.deactivate_expired` põe `ativo=False` quando `data_fim < hoje` ou (`data_fim == hoje` e `hora_fim < agora`). Roda **apenas ao listar** (`GET /api/schedule/`), por decisão do dono do projeto. Para reativar, edite o agendamento com nova data e marque ativo (se a data continuar no passado, volta a ser inativado na próxima listagem).

## Convenções e armadilhas

- Rotas de listagem usam barra final (`/api/media/`, `/api/schedule/`); o frontend às vezes chama com `/` extra no fim (`/schedule/{id}/`) — o FastAPI redireciona.
- Em `routers/media.py` e `routers/schedule.py`, rotas estáticas (`/stats/summary`, `/reorder`) devem ficar **antes** de `/{id}`, senão a rota paramétrica as captura (422).
- `api.js` lança `Error(detail)` quando a resposta não é 2xx (`parseResponse`); os componentes tratam com try/catch.
- `MediaList` usa `<img src=caminho_arquivo>` também para vídeo (sem thumbnail real) e sem `/` inicial — depende de caminho relativo `uploads/...`.
- Uploads são salvos em `UPLOAD_DIR` (`uploads/`) com prefixo de timestamp; `caminho_arquivo` guarda o caminho relativo e o player usa `/${caminho_arquivo}`.
- Embeds: YouTube via `youtube.com/embed/ID`, Instagram via `<url>/embed`, TikTok via `tiktok.com/embed/v2/ID` (`getEmbedUrl` em `UniversalRegion.jsx`). Vídeos locais/embeds rodam **mudos** (autoplay exige).
- Ao editar o player, mantenha as regiões independentes (cada uma com seu `refreshKey`).
- Não commitar `.env`, `mediaplayer.db`, `uploads/`, `node_modules/`, `dist/`.

## Pendências conhecidas (ver docs/SOFTWARE.md §Roadmap)

- Edição de mídia além de nome/texto/ativo (trocar arquivo/URL) — decidido deixar como está por ora; `MediaList` só tem Excluir.
- Upload no Novo Agendamento cobre vídeo, imagem e link nas regiões 1/2 (texto na região 4 já era criado ali mesmo).
