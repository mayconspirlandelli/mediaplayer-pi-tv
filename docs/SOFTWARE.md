# Media Player TV — Documentação do Software

## 1. Visão geral

Sistema de **digital signage** para exibir vídeos, imagens, textos e conteúdos de redes sociais em uma TV, no estilo de painel de elevador/recepção. O conteúdo é cadastrado e agendado por uma página de administração web; a TV apenas abre a URL do player em tela cheia.

**Formas de implantação**

| Modo | Como funciona |
|---|---|
| **Raspberry Pi (sincronizado)** | O conteúdo é cadastrado no Railway; o Pi, ligado à TV por HDMI, roda o backend localmente, sincroniza mídias/agendamentos/frontend a cada 60 s e abre `http://localhost:8000` no Chromium em modo kiosk. Funciona offline com o último conteúdo. Instalação via `sudo ./scripts/install.sh [URL]`. |
| **Nuvem** | Backend hospedado em um servidor; a TV (ou um Pi/Smart TV/stick) só abre a URL pública do player. O admin é acessado de qualquer navegador em `/admin`. |

## 2. Funcionalidades

- Cadastro de mídias: **vídeo** (upload), **imagem** (upload), **texto** (avisos), **YouTube** (link), **link externo** (Instagram, TikTok etc.).
- Player exibe vídeos diretos do YouTube (incluindo Shorts e transmissões ao vivo), Instagram (posts/reels/stories) e TikTok apenas com a URL.
- **Agendamento** por mídia: período (data início/fim), faixa de horário, dias da semana, duração, ordem e status ativo/inativo.
- **Regiões independentes**: cada região da tela troca de conteúdo no seu próprio tempo.
  - Vídeo local: dura o tamanho do vídeo.
  - Imagem, texto, YouTube e links: duram o tempo configurado (`duracao`, em segundos).
- Previsão do tempo (OpenWeatherMap) com cache.
- Painel admin protegido por **login e senha**: dashboard com estatísticas, lista/exclusão de mídias, upload, lista de agendamentos (ordenação por coluna e reordenação por arrastar), criação e edição de agendamento.
- **Upload dentro do Novo Agendamento**: nas regiões 1 e 2 é possível escolher "Nova mídia" (vídeo, imagem ou link) e ela é enviada só ao clicar em Salvar. A aba Upload continua existindo.
- **Inativação automática**: agendamentos cujo período terminou passam a `ativo=false` ao listar os agendamentos; podem ser reativados editando-os.

## 3. Layout do player

Canvas fixo de **2048×1080** (escalado proporcionalmente em telas diferentes), padding de 40 px.

```
┌──────────────┬────────────────────────────┬─────────────┐
│  REGIÃO 1    │        REGIÃO 2            │  REGIÃO 3   │
│  Vertical    │        Horizontal          │  Clima      │
│  440 x 840   │        1040 x 840          │  400 x 840  │
├──────────────┴────────────────────────────┴─────────────┤
│  REGIÃO 4 — Avisos em texto (rolagem se ultrapassar)    │
│  160 px de altura                                       │
└─────────────────────────────────────────────────────────┘
```

| Região | Conteúdo | Tipos aceitos | Agendável |
|---|---|---|---|
| 1 | Vertical | video, imagem, youtube, link | Sim |
| 2 | Horizontal | video, imagem, youtube, link | Sim |
| 3 | Clima | — (automático) | Não |
| 4 | Avisos | texto (máx. 200 caracteres no formulário) | Sim |

## 4. Arquitetura

```
 TV / Chromium ──► GET /            (Player React)
 Navegador admin ─► GET /admin      (AdminPage React)
        │
        ▼  fetch /api/*
 FastAPI (porta 8000) ── SQLAlchemy ── SQLite (mediaplayer.db)
        │                    └─ tabelas: media, schedule, weather_cache
        ├── /uploads/*  (arquivos enviados)
        └── OpenWeatherMap (httpx, cache de 10 min)
```

- **Backend** (`backend/app`): FastAPI; routers `media`, `schedule`, `player`; serviços `scheduler` (regra de exibição) e `weather`.
- **Frontend** (`frontend/src`): React + Vite. Em desenvolvimento roda na porta 3000 com proxy para o backend; em produção o `npm run build` gera `frontend/dist`, servido pelo próprio FastAPI.
- **Segurança**: o painel e as rotas `/api/media` e `/api/schedule` exigem token Bearer obtido em `POST /api/auth/login` (usuário/senha do `.env`, validade de 12 h). O player (`/`, `/api/player/*`, `/uploads/*`) é público, pois a TV abre a URL sem login. O CORS continua `*`. Na nuvem use HTTPS e troque `ADMIN_PASSWORD`.

## 5. Modelo de dados

**Media**

| Campo | Descrição |
|---|---|
| `id`, `nome`, `criado_em` | identificação |
| `tipo` | `video`, `imagem`, `texto`, `youtube`, `link` |
| `caminho_arquivo` | caminho do arquivo em `uploads/` **ou** a URL (youtube/link) |
| `texto` | conteúdo, quando `tipo=texto` |
| `ativo` | mídia habilitada |

**Schedule** (N agendamentos por mídia; remover a mídia remove seus agendamentos)

| Campo | Descrição |
|---|---|
| `media_id`, `regiao` | o que e onde (1, 2 ou 4) |
| `data_inicio`, `data_fim` | período (inclusivo) |
| `hora_inicio`, `hora_fim` | faixa diária (fim > início) |
| `dias_semana` | CSV, 0=domingo … 6=sábado |
| `duracao` | segundos na tela (imagem/texto/embeds) |
| `prioridade` | "Ordem" na UI: menor aparece primeiro |
| `ativo` | agendamento habilitado |

**WeatherCache**: cidade, temperatura, condição, ícone, JSON completo, data do cache.

## 6. Como o conteúdo é escolhido

Para cada região, a cada consulta (`GET /api/player/active-content/region/{n}`):

1. Seleciona schedules com `ativo`, mídia `ativo`, `data_inicio ≤ hoje ≤ data_fim`, `hora_inicio ≤ agora ≤ hora_fim` e dia da semana permitido.
2. Ordena por `prioridade` crescente e, em empate, `id` decrescente.
3. Se houver mais de um, rotaciona: `posição = segundos_desde_meia_noite % soma(duracao)` e escolhe o item cujo intervalo acumulado contém a posição.
4. Retorna a mídia (ou `null` se nada estiver agendado).

No player, ao fim da mídia (evento `ended` do vídeo ou timer de `duracao`) a região pede o próximo conteúdo. Se houver erro de carregamento, pula após 5 s. Regiões sem conteúdo são consultadas de novo a cada 15 s.

> Observação: a rotação é calculada pelo relógio do servidor, não pelo término real da mídia. Para vídeos locais, `duracao` deve refletir a duração real do vídeo quando houver mais de um item na região, senão a troca pode cortar o vídeo ou repetir.

## 7. API (resumo)

Documentação interativa em `/docs`.

| Método | Rota | Função |
|---|---|---|
| GET | `/api/media/` | lista (filtros `tipo`, `ativo`) |
| GET | `/api/media/{id}` | detalhe + agendamentos |
| POST | `/api/media/upload` | upload de vídeo/imagem (`file`, `tipo`, `nome`) — mp4, webm, avi, mov / jpg, jpeg, png, webp, gif |
| POST | `/api/media/text` | cria texto |
| POST | `/api/media/youtube` | cadastra link do YouTube |
| POST | `/api/media/link` | cadastra link genérico (Instagram, TikTok…) |
| PUT | `/api/media/{id}` | altera `nome`, `texto`, `ativo` |
| DELETE | `/api/media/{id}` | remove mídia, arquivo e agendamentos |
| GET | `/api/media/stats/summary` | contagens |
| GET/POST | `/api/schedule/` | lista / cria |
| GET/PUT/DELETE | `/api/schedule/{id}` | detalhe / altera / remove |
| GET | `/api/schedule/next/{regiao}?hours=` | próximos agendamentos |
| GET | `/api/schedule/conflicts/{media_id}` | valida agendamento |
| PUT | `/api/schedule/reorder` | atualiza `prioridade` em lote |
| GET | `/api/player/active-content` | conteúdo atual das 3 regiões agendáveis |
| GET | `/api/player/active-content/region/{n}` | conteúdo atual de uma região |
| GET | `/api/player/weather` | clima (com emoji) |
| GET | `/api/health` | health check |
| GET | `/api/sync/export` | mídias + agendamentos + versão do frontend (para o Pi) |
| GET | `/api/sync/frontend` | build do frontend em `.tar.gz` (para o Pi) |
| POST | `/api/auth/login` | login (`username`, `password`) → `token` |
| GET | `/api/auth/me` | valida o token |

As rotas `/api/media/*` e `/api/schedule/*` exigem o cabeçalho `Authorization: Bearer <token>`. As rotas `/api/sync/*` exigem `Authorization: Bearer <SYNC_TOKEN>` (503 se `SYNC_TOKEN` não estiver configurado).

Mais detalhes em `API.md` na raiz.

## 8. Configuração (`backend/.env`)

| Variável | Padrão | Uso |
|---|---|---|
| `OPENWEATHER_API_KEY` | — | chave do OpenWeatherMap (sem ela o clima usa valor fallback) |
| `WEATHER_CITY` / `WEATHER_COUNTRY` | Aparecida de Goiania / BR | cidade do clima |
| `WEATHER_UPDATE_INTERVAL` | 600 | validade do cache (s) |
| `HOST` / `PORT` | 0.0.0.0 / 8000 | servidor |
| `UPLOAD_DIR` | uploads | pasta dos arquivos |
| `DATABASE_URL` | sqlite:///./mediaplayer.db | banco |
| `ADMIN_USER` / `ADMIN_PASSWORD` | admin / admin123 | login do admin (**trocar**) |
| `SECRET_KEY` | derivada da senha | assinatura dos tokens |
| `AUTH_TOKEN_TTL` | 43200 | validade do login (s) |
| `SYNC_TOKEN` | — | servidor: habilita `/api/sync/*`; Pi: token usado para sincronizar |
| `SYNC_URL` | — | só no Pi: URL do servidor central; liga a sincronização em segundo plano |
| `SYNC_INTERVAL` | 60 | só no Pi: intervalo da sincronização (s) |
| `FRONTEND_DIST` | ../frontend/dist | pasta do build do frontend |

## 9. Operação

**Desenvolvimento**: backend `./run.sh` (8000) + frontend `npm run dev` (3000). Player em `http://localhost:3000/`, admin em `/admin`.

**Raspberry Pi**: `scripts/install.sh` instala Python e Chromium, cria `backend/.venv` e `backend/.env` (`SYNC_URL`, `SYNC_TOKEN`), faz a primeira sincronização, cria o serviço systemd `mediaplayer` (backend em `127.0.0.1:8000` com a sincronização em segundo plano — `app/services/sync.py`) e `/usr/local/bin/mediaplayer-kiosk` (espera o player local, abre em kiosk com `--autoplay-policy=no-user-gesture-required` e reabre se fechar), registrado no autostart (LXDE, Wayfire e labwc). A cada ciclo o Pi substitui mídias/agendamentos locais pelos do servidor, baixa arquivos novos, apaga os removidos e atualiza o frontend; sem internet mantém o último conteúdo. O clima também vem do servidor. Atualização do código com `scripts/update.sh` (git pull + reinstala). Passo a passo completo em [RASPBERRY_PI.md](RASPBERRY_PI.md).

**Railway**: `Dockerfile` (build do frontend + FastAPI), volume em `/data` para banco e uploads, fuso `America/Sao_Paulo`. Publicar com `railway up`.

**Nuvem**: rodar o backend (uvicorn) atrás de HTTPS, com `frontend/dist` construído e um volume persistente para `uploads/` e o banco. A TV abre `https://seu-dominio/`. Vídeos grandes consomem banda da TV: considerar CDN/armazenamento externo.

## 10. Estado atual vs. roadmap

**Implementado**: upload, texto, YouTube, links sociais, agendamento completo (criar, editar, excluir, reordenar), upload dentro do Novo Agendamento, inativação automática de vencidos, login do admin, player com regiões independentes, clima.

**Decisões de produto**

- Vencido = `data_fim` anterior a hoje, ou `data_fim` hoje com `hora_fim` já passada. A verificação ocorre ao consultar a lista de agendamentos (não há tarefa em segundo plano).
- Reativar um vencido: editar o agendamento com nova data e marcar "Agendamento Ativo".
- Edição de mídia: mantida como está (nome/texto/ativo via API; sem botão na interface).
- Rotação e duração de vídeos locais: mantidas como estão (relógio do servidor).
- Fuso: relógio do servidor.

**Pontos de atenção**

- Credenciais padrão (`admin`/`admin123`) devem ser trocadas em qualquer instalação exposta.
- Se a mídia é enviada e o agendamento falha em seguida (ex.: conflito de validação), a mídia fica salva na aba Mídias.
- Um agendamento reativado com data ainda no passado volta a ser inativado na próxima listagem.
- Sem rate-limit no login.
- Vídeos locais e embeds rodam sem som (limitação de autoplay).
- Instagram/TikTok podem bloquear embed em iframe (stories em geral exigem login).
- Datas/horas dependem do fuso do servidor; na nuvem pode diferir do fuso da TV.

## 11. Outros documentos na raiz

`README.md`, `QUICKSTART.md`, `START_HERE.md`, `API.md`, `ESTRUTURA.md`, `NOVO_LAYOUT.md`, `RESUMO_PROJETO.md`, `README_WINDOWS.md` — documentação anterior; parte descreve o layout antigo de 4 regiões (vídeos verticais/imagens) e pode estar desatualizada.

## 12. Histórico de alterações

### Login, upload no agendamento e inativação de vencidos
- **Autenticação**: `services/auth.py`, `routers/auth.py`, tela `Login.jsx`, botão Sair, `authFetch` em `api.js` (401 → volta ao login). Variáveis `ADMIN_USER`, `ADMIN_PASSWORD`, `SECRET_KEY`, `AUTH_TOKEN_TTL`.
- **Novo Agendamento**: opção "Nova mídia" (vídeo, imagem, link) nas regiões 1 e 2, enviada somente ao salvar.
- **Vencidos**: `SchedulerService.deactivate_expired`, executado em `GET /api/schedule/`.
- **Correções**: `PUT /api/schedule/reorder` e `GET /api/media/stats/summary` movidas antes das rotas `/{id}`; `api.js` agora lança erro em respostas não 2xx.
- **Limpeza**: removidos `VideoRegion` e `PhotoRegion` (legados).
- **Testes**: `backend/tests/test_auth_and_expiration.py` (login, token, rotas protegidas, rotas públicas do player, ordem das rotas, vencimento e reativação).
