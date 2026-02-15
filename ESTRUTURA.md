# 📁 Estrutura do Projeto - Media Player

## Visão Geral da Arquitetura

```
mediaplayer-pi/
├── 📄 README.md                    # Documentação principal completa
├── 📄 QUICKSTART.md                # Guia rápido de 5 minutos
├── 📄 API.md                       # Documentação da API REST
├── 📄 ESTRUTURA.md                 # Este arquivo
├── 📄 .gitignore                   # Arquivos ignorados pelo git
│
├── 📂 backend/                     # API Python (FastAPI)
│   ├── 📄 requirements.txt         # Dependências Python
│   ├── 📄 .env.example             # Exemplo de configuração
│   ├── 📄 run.sh                   # Script para rodar manualmente
│   ├── 📂 uploads/                 # Arquivos de mídia (vídeos/imagens)
│   │   └── .gitkeep
│   └── 📂 app/                     # Código da aplicação
│       ├── 📄 __init__.py
│       ├── 📄 main.py              # Entry point, FastAPI app
│       ├── 📄 database.py          # Configuração SQLAlchemy
│       ├── 📄 models.py            # Modelos do banco (Media, Schedule, WeatherCache)
│       ├── 📂 routers/             # Endpoints da API
│       │   ├── 📄 __init__.py
│       │   ├── 📄 media.py         # CRUD de mídias + upload
│       │   ├── 📄 schedule.py      # CRUD de agendamentos
│       │   └── 📄 player.py        # Conteúdo ativo + clima
│       └── 📂 services/            # Lógica de negócio
│           ├── 📄 __init__.py
│           ├── 📄 scheduler.py     # Sistema de agendamento
│           └── 📄 weather.py       # Integração OpenWeatherMap
│
├── 📂 frontend/                    # Interface React + Vite
│   ├── 📄 package.json             # Dependências Node.js
│   ├── 📄 vite.config.js           # Configuração Vite
│   ├── 📄 index.html               # HTML base
│   └── 📂 src/
│       ├── 📄 main.jsx             # Entry point React
│       ├── 📄 App.jsx              # Roteamento principal
│       ├── 📂 services/
│       │   └── 📄 api.js           # Cliente API REST
│       ├── 📂 components/          # Componentes do Player
│       │   ├── 📄 Player.jsx       # Container principal (4 regiões)
│       │   ├── 📄 Player.css       # Layout fixo 1920x1080
│       │   ├── 📄 VideoRegion.jsx  # Região 1: Vídeos
│       │   ├── 📄 VideoRegion.css
│       │   ├── 📄 PhotoRegion.jsx  # Região 2: Imagens
│       │   ├── 📄 PhotoRegion.css
│       │   ├── 📄 WeatherRegion.jsx # Região 3: Clima
│       │   ├── 📄 WeatherRegion.css
│       │   ├── 📄 TextRegion.jsx   # Região 4: Texto
│       │   ├── 📄 TextRegion.css
│       │   └── 📂 admin/           # Componentes Admin
│       │       ├── 📄 Stats.jsx           # Dashboard stats
│       │       ├── 📄 MediaList.jsx       # Lista de mídias
│       │       ├── 📄 MediaUpload.jsx     # Upload de arquivos
│       │       ├── 📄 ScheduleList.jsx    # Lista de agendamentos
│       │       └── 📄 ScheduleForm.jsx    # Formulário agendamento
│       └── 📂 pages/
│           ├── 📄 AdminPage.jsx    # Painel administrativo
│           └── 📄 AdminPage.css    # Estilos do admin
│
└── 📂 scripts/                     # Scripts de instalação
    ├── 📄 install.sh               # Instalação automática completa
    └── 📄 update.sh                # Script de atualização
```

## 🎯 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO ADMIN                            │
│                 (http://IP:8000/admin)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  React Admin Panel   │
            │  - Upload mídia      │
            │  - Criar agendamento │
            └──────────┬───────────┘
                       │
                       ▼ HTTP POST/PUT/DELETE
            ┌──────────────────────┐
            │   FastAPI Backend    │
            │   - Valida dados     │
            │   - Salva arquivos   │
            │   - Atualiza banco   │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   SQLite Database    │
            │   - media            │
            │   - schedule         │
            │   - weather_cache    │
            └──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PLAYER (TV)                              │
│                 (http://IP:8000)                            │
│                 Fullscreen Kiosk Mode                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ GET (cada 5s)
            ┌──────────────────────┐
            │   FastAPI Backend    │
            │   /api/player/       │
            │   active-content     │
            └──────────┬───────────┘
                       │
                       ▼ Query
            ┌──────────────────────┐
            │  Scheduler Service   │
            │  - Verifica horário  │
            │  - Aplica regras     │
            │  - Retorna conteúdo  │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   React Player       │
            │   - Região 1: Vídeo  │
            │   - Região 2: Imagem   │
            │   - Região 3: Clima  │
            │   - Região 4: Texto  │
            └──────────────────────┘
```

## 📊 Banco de Dados (SQLite)

### Tabela: media
```sql
CREATE TABLE media (
    id INTEGER PRIMARY KEY,
    tipo TEXT NOT NULL,              -- 'video', 'imagem', 'texto'
    caminho_arquivo TEXT,            -- path do arquivo
    texto TEXT,                      -- conteúdo se tipo='texto'
    nome TEXT NOT NULL,              -- nome descritivo
    ativo BOOLEAN DEFAULT TRUE,      -- ativo/inativo
    criado_em DATETIME               -- timestamp criação
);
```

### Tabela: schedule
```sql
CREATE TABLE schedule (
    id INTEGER PRIMARY KEY,
    media_id INTEGER NOT NULL,       -- FK para media
    regiao INTEGER NOT NULL,         -- 1, 2 ou 4
    data_inicio DATE NOT NULL,       -- início agendamento
    data_fim DATE NOT NULL,          -- fim agendamento
    hora_inicio TIME NOT NULL,       -- hora início
    hora_fim TIME NOT NULL,          -- hora fim
    duracao INTEGER DEFAULT 10,      -- segundos
    dias_semana TEXT DEFAULT '0,1,2,3,4,5,6',  -- dias ativos
    prioridade INTEGER DEFAULT 1,    -- 1-10
    ativo BOOLEAN DEFAULT TRUE,      -- ativo/inativo
    criado_em DATETIME,              -- timestamp criação
    FOREIGN KEY (media_id) REFERENCES media(id)
);
```

### Tabela: weather_cache
```sql
CREATE TABLE weather_cache (
    id INTEGER PRIMARY KEY,
    cidade TEXT NOT NULL,
    temperatura INTEGER,
    condicao TEXT,
    icone TEXT,
    data_cache DATETIME,
    dados_completos JSON
);
```

## 🔧 Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy**: ORM para banco de dados
- **Uvicorn**: Servidor ASGI
- **Python-multipart**: Upload de arquivos
- **HTTPX**: Cliente HTTP async
- **Pillow**: Processamento de imagens
- **Python-dotenv**: Variáveis de ambiente

### Frontend
- **React 18**: Biblioteca UI
- **Vite**: Build tool ultra-rápido
- **React Router**: Roteamento SPA
- **CSS Puro**: Sem framework (performance)

### Infraestrutura
- **SQLite**: Banco de dados leve
- **Chromium**: Browser em kiosk mode
- **Systemd**: Gerenciamento de serviço
- **Node.js 18**: Runtime JavaScript
- **Python 3.9+**: Runtime backend

## 🚀 Arquivos Executáveis

### /scripts/install.sh
Instalação automática completa:
1. Atualiza sistema
2. Instala dependências (Node, Python)
3. Configura backend (venv, pip)
4. Configura frontend (npm, build)
5. Cria serviço systemd
6. Configura autostart/kiosk

### /scripts/update.sh
Atualização após mudanças no código:
1. Atualiza dependências
2. Rebuilda frontend
3. Reinicia serviço

### /backend/run.sh
Execução manual do backend (desenvolvimento):
1. Ativa virtualenv
2. Verifica .env
3. Inicializa banco
4. Inicia servidor com reload

## 📦 Dependências

### Python (backend/requirements.txt)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
sqlalchemy==2.0.25
aiosqlite==0.19.0
python-dotenv==1.0.0
httpx==0.26.0
pillow==10.2.0
pydantic==2.5.3
pydantic-settings==2.1.0
```

### Node.js (frontend/package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

## 🎨 Layout do Player (1920x1080)

```
┌───────────────────────────────────────────────────────┐
│                                                       │
│  ┌─────────────────┬──────────────────────────────┐  │
│  │                 │                              │  │
│  │                 │                              │  │
│  │   REGIÃO 1      │      REGIÃO 2                │  │
│  │   Vídeos        │      Imagens                   │  │
│  │   1080x980      │      840x980                 │  │
│  │                 │                              │  │
│  │                 ├──────────────────────────────┤  │
│  │                 │  REGIÃO 3: Clima             │  │
│  │                 │  840x100                     │  │
│  └─────────────────┴──────────────────────────────┘  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Dimensões exatas:**
- Região 1 (Vídeo): 1080px × 1080px - Esquerda completa
- Região 2 (Imagem): 840px × 980px - Topo direito
- Região 3 (Clima): 840px × 100px - Embaixo direito
- Região 4 (Texto): DESABILITADA no layout atual

## 🔐 Segurança

- **Sem autenticação**: Sistema para uso em rede local controlada
- **Validação de tipos**: Backend valida tipos de arquivo
- **Sanitização**: Nomes de arquivo são sanitizados
- **CORS aberto**: Apenas para desenvolvimento local
- **Upload limitado**: Apenas formatos específicos aceitos

**Para produção:**
- Adicionar autenticação básica
- Configurar CORS restritivo
- Adicionar rate limiting
- HTTPS com certificado

## 📝 Configuração (.env)

```bash
# API de Clima (OpenWeatherMap)
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_CITY=Aparecida de Goiania
WEATHER_COUNTRY=BR
WEATHER_UPDATE_INTERVAL=600

# Configurações do servidor
HOST=0.0.0.0
PORT=8000

# Diretório de uploads
UPLOAD_DIR=uploads

# Banco de dados
DATABASE_URL=sqlite:///./mediaplayer.db
```

## 🎓 Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - Uso livre para projetos pessoais e comerciais.
