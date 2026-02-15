# 🪟 Guia de Desenvolvimento - Windows + VSCode

Este guia é específico para desenvolver o Media Player no **Windows** usando **VSCode**.

## 📋 Pré-requisitos

### 1. Instalar Python 3.9+
- Download: https://www.python.org/downloads/
- ⚠️ **IMPORTANTE**: Marque a opção **"Add Python to PATH"** durante a instalação
- Verificar: `python --version`

### 2. Instalar Node.js 18+
- Download: https://nodejs.org/
- Escolha a versão LTS (recomendada)
- Verificar: `node --version` e `npm --version`

### 3. Instalar VSCode
- Download: https://code.visualstudio.com/
- Extensões recomendadas:
  - Python (Microsoft)
  - Pylance (Microsoft)
  - ES7+ React/Redux/React-Native snippets
  - ESLint
  - Prettier

### 4. Git (Opcional)
- Download: https://git-scm.com/download/win
- Para controle de versão

## 🚀 Instalação Rápida

### Opção 1: Script Automático (Recomendado)

```cmd
# No terminal do VSCode (Ctrl + `)
# Navegue até a pasta do projeto
cd caminho\para\mediaplayer-pi

# Execute o instalador
install.bat
```

### Opção 2: Instalação Manual

#### Backend (Python)
```cmd
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env
copy .env.example .env

# Editar .env e adicionar sua API key
notepad .env

# Inicializar banco de dados
python -c "from app.database import init_db; init_db()"
```

#### Frontend (React)
```cmd
cd frontend

# Instalar dependências
npm install

# Build para produção
npm run build
```

## 🎮 Como Executar

### Modo Produção (Backend serve Frontend)

**Terminal 1 - Backend:**
```cmd
cd backend
run.bat
```

Acesse:
- Player: http://localhost:8000
- Admin: http://localhost:8000/admin
- API Docs: http://localhost:8000/docs

### Modo Desenvolvimento (Backend + Frontend separados)

**Terminal 1 - Backend:**
```cmd
cd backend
run.bat
```

**Terminal 2 - Frontend (hot reload):**
```cmd
cd frontend
run-dev.bat
```

Acesse:
- Frontend Dev: http://localhost:3000 (hot reload ativo)
- Backend API: http://localhost:8000
- Admin: http://localhost:3000/admin

## 📝 Estrutura do VSCode

### Abrir Projeto no VSCode

```cmd
# Na raiz do projeto
code .
```

### Configuração Recomendada

Crie `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/Scripts/python.exe",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "autopep8",
  "editor.formatOnSave": true,
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true
  }
}
```

### Tasks do VSCode

Crie `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Backend",
      "type": "shell",
      "command": "cd backend && run.bat",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Run Frontend Dev",
      "type": "shell",
      "command": "cd frontend && run-dev.bat",
      "problemMatcher": []
    }
  ]
}
```

## 🔧 Scripts Disponíveis

### Raiz do Projeto
- `install.bat` - Instalação completa
- `README_WINDOWS.md` - Este arquivo

### Backend (/backend)
- `run.bat` - Iniciar servidor backend
- `run.sh` - Versão Linux (para Raspberry Pi)

### Frontend (/frontend)
- `run-dev.bat` - Servidor de desenvolvimento
- `build.bat` - Build de produção
- `npm run dev` - Modo desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build

## 🐛 Debugging no VSCode

### Python (Backend)

Crie `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    }
  ]
}
```

Pressione F5 para iniciar o debugging.

### React (Frontend)

O frontend usa Vite com hot reload automático. Para debug:
1. Inicie com `npm run dev`
2. Use as ferramentas do navegador (F12)
3. Instale React Developer Tools (extensão Chrome/Edge)

## 📦 Fluxo de Desenvolvimento

### 1. Desenvolvendo Backend (API)

```cmd
# Ativar ambiente virtual
cd backend
venv\Scripts\activate

# Editar código em app/
# Os arquivos principais são:
# - app/main.py (FastAPI app)
# - app/models.py (modelos do banco)
# - app/routers/ (endpoints)
# - app/services/ (lógica de negócio)

# Servidor recarrega automaticamente com --reload
```

### 2. Desenvolvendo Frontend (React)

```cmd
# Terminal separado
cd frontend
npm run dev

# Editar código em src/
# Os arquivos principais são:
# - src/App.jsx (roteamento)
# - src/components/ (componentes do player)
# - src/pages/ (páginas admin)
# - src/services/api.js (chamadas API)

# Hot reload automático - mudanças aparecem instantaneamente
```

### 3. Testando Integração

```cmd
# Build do frontend
cd frontend
npm run build

# Backend serve os arquivos do build
cd backend
run.bat

# Testar em http://localhost:8000
```

## 🧪 Testando a API

### Usando o navegador
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Usando PowerShell
```powershell
# Testar health check
Invoke-WebRequest -Uri http://localhost:8000/api/player/health

# Listar mídias
Invoke-WebRequest -Uri http://localhost:8000/api/media

# Conteúdo ativo
Invoke-WebRequest -Uri http://localhost:8000/api/player/active-content
```

### Usando curl (se instalado)
```cmd
curl http://localhost:8000/api/player/health
curl http://localhost:8000/api/media
```

## 🔍 Troubleshooting Windows

### Python não encontrado
```cmd
# Verificar instalação
python --version

# Se não funcionar, tente:
py --version

# Adicionar ao PATH manualmente:
# Painel de Controle > Sistema > Variáveis de Ambiente
# Adicionar: C:\Users\SeuUsuario\AppData\Local\Programs\Python\Python39\
```

### Porta 8000 já em uso
```cmd
# Encontrar processo usando a porta
netstat -ano | findstr :8000

# Matar processo (substitua PID)
taskkill /PID <numero_do_pid> /F
```

### Erro de permissão ao instalar pacotes
```cmd
# Executar como Administrador
# Ou usar:
pip install --user -r requirements.txt
```

### Erro ao criar venv
```cmd
# Instalar virtualenv
pip install virtualenv

# Criar venv com virtualenv
virtualenv venv
```

### Node_modules muito grande
```cmd
# Deletar node_modules
cd frontend
rmdir /s /q node_modules

# Reinstalar
npm install
```

## 📊 Monitoramento

### Ver logs do backend
- Os logs aparecem no terminal onde o backend está rodando
- Erros são exibidos em vermelho
- Requisições HTTP aparecem em tempo real

### Ver logs do frontend
- Console do navegador (F12)
- Terminal onde `npm run dev` está rodando

## 🚀 Deploy para Raspberry Pi

Quando terminar o desenvolvimento no Windows:

1. **Build do frontend:**
```cmd
cd frontend
npm run build
```

2. **Copie o projeto para o Raspberry Pi:**
   - Use WinSCP, FileZilla ou scp
   - Copie toda a pasta para `/home/pi/mediaplayer-pi`

3. **No Raspberry Pi:**
```bash
cd /home/pi/mediaplayer-pi
sudo ./scripts/install.sh
```

## 💡 Dicas Produtividade

### Atalhos VSCode
- `Ctrl + `` - Abrir terminal
- `Ctrl + P` - Buscar arquivo
- `Ctrl + Shift + F` - Buscar em todo projeto
- `F5` - Iniciar debugging
- `Ctrl + F5` - Executar sem debugging

### Extensões Úteis
- **GitLens** - Histórico do Git inline
- **Auto Rename Tag** - Renomeia tags HTML automaticamente
- **Path Intellisense** - Autocomplete de caminhos
- **Thunder Client** - Testar API (alternativa ao Postman)

### Multi-cursor
- `Alt + Click` - Adicionar cursor
- `Ctrl + Alt + Seta` - Adicionar cursor acima/abaixo
- `Ctrl + D` - Selecionar próxima ocorrência

## 📚 Documentação Adicional

- **README.md** - Documentação completa do projeto
- **API.md** - Documentação da API REST
- **ESTRUTURA.md** - Arquitetura do código
- **QUICKSTART.md** - Guia rápido

## 🆘 Suporte

### Problemas Comuns

**Backend não inicia:**
1. Verificar se Python está instalado
2. Verificar se venv está ativado
3. Verificar se requirements.txt foi instalado
4. Ver logs no terminal

**Frontend não compila:**
1. Deletar node_modules e package-lock.json
2. Executar `npm install` novamente
3. Verificar versão do Node (18+)

**API não responde:**
1. Verificar se backend está rodando
2. Verificar URL (http://localhost:8000)
3. Verificar firewall do Windows
4. Testar com http://localhost:8000/docs

---

**Desenvolvimento no Windows facilitado!** 🎉
