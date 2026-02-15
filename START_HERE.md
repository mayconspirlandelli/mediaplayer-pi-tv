# 🚀 COMECE AQUI - Desenvolvimento Windows + VSCode

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Pré-requisitos (instale se não tiver)

- ✅ **Python 3.9+**: https://www.python.org/downloads/ 
  - ⚠️ Marque "Add Python to PATH"
- ✅ **Node.js 18+**: https://nodejs.org/
- ✅ **VSCode**: https://code.visualstudio.com/

### 2️⃣ Abrir projeto no VSCode

```cmd
# No terminal (cmd ou PowerShell)
cd caminho\para\mediaplayer-pi
code .
```

### 3️⃣ Instalar extensões recomendadas

Quando o VSCode abrir, ele vai sugerir instalar as extensões recomendadas.
**Clique em "Install All"** ou pressione `Ctrl+Shift+X` e instale:

- Python
- Pylance  
- ES7+ React snippets
- Prettier

### 4️⃣ Executar instalação automática

**No terminal do VSCode** (Ctrl + ` para abrir):

```cmd
install.bat
```

⏳ Aguarde 2-3 minutos...

### 5️⃣ Configurar API do clima

Abra o arquivo `backend/.env` e adicione sua chave:

```
OPENWEATHER_API_KEY=sua_chave_aqui
```

🔑 Obtenha chave gratuita em: https://openweathermap.org/api

### 6️⃣ Iniciar o sistema

**Opção A - Modo Produção (recomendado para teste):**

```cmd
cd backend
run.bat
```

Acesse: http://localhost:8000

**Opção B - Modo Desenvolvimento (para programar):**

Terminal 1:
```cmd
cd backend
run.bat
```

Terminal 2:
```cmd
cd frontend  
npm run dev
```

Acesse: http://localhost:3000

---

## 🎮 Usando o VSCode

### Executar Backend (F5)

1. Pressione `F5` no VSCode
2. Selecione "Python: FastAPI Backend"
3. O servidor inicia com debugging ativo

### Executar via Tasks

1. Pressione `Ctrl+Shift+B`
2. Selecione "Backend: Run"

### Abrir Terminal Integrado

- `Ctrl + `` - Abre terminal
- Clique no `+` para abrir múltiplos terminais

---

## 📁 Estrutura Rápida

```
mediaplayer-pi/
├── backend/          → API Python
│   ├── app/          → Código principal
│   ├── run.bat       → Executar backend
│   └── .env          → Configurações (API key aqui!)
│
├── frontend/         → Interface React
│   ├── src/          → Código React
│   ├── run-dev.bat   → Servidor dev
│   └── build.bat     → Build produção
│
├── install.bat       → Instalador Windows
└── README_WINDOWS.md → Guia completo Windows
```

---

## 🧪 Testar se Funciona

### 1. Backend rodando?

Abra: http://localhost:8000/docs

Você deve ver a documentação da API (Swagger).

### 2. Frontend rodando?

Abra: http://localhost:8000 ou http://localhost:3000

Você deve ver as 3 regiões do player.

### 3. Criar primeira mídia

1. Acesse: http://localhost:8000/admin
2. Clique em "Upload"
3. Selecione "Texto"
4. Digite um nome e texto
5. Clique em "Criar Mídia"

### 4. Criar agendamento

1. Clique em "Novo Agendamento"
2. Selecione a mídia criada
3. Configure data/hora (hoje, agora)
4. Salve

### 5. Ver no player

Acesse: http://localhost:8000

O texto deve aparecer na região 4!

---

## 🐛 Problemas?

### "Python não encontrado"

```cmd
python --version
```

Se não funcionar, reinstale o Python e marque "Add to PATH".

### "Node não encontrado"

```cmd
node --version
```

Se não funcionar, reinstale o Node.js.

### "Porta 8000 em uso"

```cmd
# Ver o que está usando
netstat -ano | findstr :8000

# Matar processo (substitua 1234 pelo PID)
taskkill /PID 1234 /F
```

### Backend não inicia

1. Verificar se venv foi criado: `backend/venv/`
2. Se não, executar: `python -m venv backend/venv`
3. Ativar: `backend\venv\Scripts\activate`
4. Instalar: `pip install -r backend/requirements.txt`

### Frontend não compila

```cmd
cd frontend
rmdir /s /q node_modules
npm install
npm run dev
```

---

## 📚 Documentação

- **README_WINDOWS.md** ← Guia completo para Windows
- **README.md** - Documentação geral do projeto
- **API.md** - Documentação da API REST
- **ESTRUTURA.md** - Arquitetura do código

---

## 💡 Próximos Passos

1. ✅ Sistema funcionando
2. 📖 Ler README_WINDOWS.md (guia completo)
3. 🎨 Começar a desenvolver
4. 🧪 Testar suas mudanças
5. 📦 Fazer deploy no Raspberry Pi

---

## 🆘 Ajuda

**Leia primeiro:** README_WINDOWS.md (tem tudo explicado!)

**Problemas comuns:** Seção Troubleshooting no README_WINDOWS.md

**API não responde:** Verificar se backend está rodando em http://localhost:8000/docs

---

## ✨ Dica Rápida

### Atalhos VSCode:

- `Ctrl + `` - Terminal
- `F5` - Debug backend
- `Ctrl+P` - Buscar arquivo
- `Ctrl+Shift+F` - Buscar no projeto
- `Ctrl+Shift+B` - Run tasks

### Desenvolvimento:

1. Backend: `cd backend && run.bat`
2. Frontend: `cd frontend && npm run dev`
3. Edite os arquivos, eles recarregam automaticamente!

---

**Pronto para começar! 🚀**

Qualquer dúvida, veja o README_WINDOWS.md
