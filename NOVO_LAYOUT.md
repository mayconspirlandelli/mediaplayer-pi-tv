# 🎨 Novo Layout - Atualização Completa

## 📋 O que mudou?

### Layout Antigo (3 regiões):
```
┌─────────────────────────┬──────────────┐
│                         │              │
│  VÍDEO                  │  FOTO        │
│  (1080x980)             │  (840x980)   │
│                         │              │
│                         ├──────────────┤
│                         │  CLIMA       │
└─────────────────────────┴──────────────┘
```

### Layout Novo (4 regiões com fundo UFG):
```
┌──────────┬──────────────┬──────────┐
│          │              │          │
│  VÍDEO   │  IMAGEM      │  CLIMA   │
│  (Card)  │  (Principal) │  (Widget)│
│ (440px)  │  (1040px)    │ (440px)  │
│          │              │          │
├──────────┴──────────────┴──────────┤
│  AVISOS (Faixa embaixo) - 200px    │
└─────────────────────────────────────┘
```

## ✨ Características do Novo Layout

1. **Fundo Azul UFG** com padrão institucional
2. **3 cards superiores** com bordas arredondadas
3. **Faixa de avisos** embaixo (agora visível!)
4. **Região de clima vertical** com relógio grande
5. **Sombras e espaçamento** modernos

---

## 🚀 Como Atualizar

### Opção 1: Usar arquivos já atualizados

Baixe o novo pacote `mediaplayer-pi.tar.gz` que já tem tudo atualizado!

```cmd
cd frontend
npm run build

cd ../backend
# Reinicie o backend (Ctrl+C e run.bat)
```

### Opção 2: Atualização manual (se já tem o projeto)

1. **Copie a imagem de fundo:**
```cmd
REM Copie o arquivo fundo_tv_inf.png para:
copy fundo_tv_inf.png frontend\public\
```

2. **Rebuild do frontend:**
```cmd
cd frontend
npm run build
```

3. **Reinicie o backend:**
```cmd
cd backend
REM Ctrl+C para parar
run.bat
```

4. **Acesse:**
```
http://localhost:8000
```

---

## 📐 Dimensões Exatas

### Grid Principal:
- **Total**: 1920x1080px
- **Padding**: 40px em todos os lados
- **Gap**: 20px entre elementos
- **Bordas**: 20px de border-radius

### Regiões:

**Região 1 - Vídeo/Cards (Esquerda)**
- Largura: 440px
- Altura: 880px
- Tipo aceito: `video`
- Background: branco

**Região 2 - Imagem Principal (Centro)**
- Largura: 1040px
- Altura: 880px
- Tipo aceito: `imagem`
- Background: branco

**Região 3 - Clima (Direita)**
- Largura: 440px
- Altura: 880px
- Conteúdo: Data, hora, temperatura
- Background: branco com card azul para clima

**Região 4 - Avisos (Embaixo)**
- Largura: 1920px (full width com padding)
- Altura: 200px
- Tipo aceito: `texto`
- Background: branco
- Label: "Avisos" em azul UFG

---

## 🎨 Cores do Tema UFG

```css
Azul Principal: #006BA6
Azul Claro: #0091D5
Branco: #FFFFFF
Texto: #333333
Texto Claro: #999999
```

---

## 📊 Compatibilidade com Banco

**IMPORTANTE:** O banco de dados continua o mesmo!

- Região 1 = `video`
- Região 2 = `imagem`
- Região 3 = Clima (automático)
- Região 4 = `texto`

Seus agendamentos existentes vão funcionar sem alteração!

---

## 🔄 Verificar se Funcionou

1. Acesse: http://localhost:8000
2. Deve aparecer:
   - ✅ Fundo azul com padrão UFG
   - ✅ 3 cards brancos arredondados no topo
   - ✅ Faixa branca de avisos embaixo
   - ✅ Clima e hora na lateral direita

3. Se não aparecer o fundo:
   - Verifique se `fundo_tv_inf.png` está em `frontend/public/`
   - Faça hard reload: **Ctrl+Shift+R**

---

## 🐛 Troubleshooting

### Fundo não aparece

**Solução 1:** Verificar arquivo
```cmd
dir frontend\public\fundo_tv_inf.png
```

Se não existir, copie novamente.

**Solução 2:** Limpar cache
- Pressione **Ctrl+Shift+R** (hard reload)
- Ou limpe cache do navegador

### Layout quebrado

**Causa:** Build do frontend desatualizado

**Solução:**
```cmd
cd frontend
rmdir /s /q dist
npm run build

cd ../backend
# Reinicie o backend
```

### Cards não aparecem

**Causa:** CSS não carregou

**Solução:**
- Abra DevTools (F12)
- Vá em Network
- Procure por arquivos CSS
- Se 404, refaça o build

---

## 📝 Testar Novo Layout

### 1. Testar Vídeo (Região 1)
```javascript
// Console (F12)
fetch('http://localhost:8000/api/player/active-content')
  .then(r => r.json())
  .then(d => console.log('Video:', d.video));
```

### 2. Testar Imagem (Região 2)
```javascript
fetch('http://localhost:8000/api/player/active-content')
  .then(r => r.json())
  .then(d => console.log('Foto:', d.foto));
```

### 3. Testar Avisos (Região 4)
```javascript
fetch('http://localhost:8000/api/player/active-content')
  .then(r => r.json())
  .then(d => console.log('Texto:', d.texto));
```

---

## 🎯 Resultado Final

O player agora tem:
- ✅ Visual institucional UFG
- ✅ Layout profissional com cards
- ✅ Faixa de avisos visível
- ✅ Clima em destaque
- ✅ Melhor legibilidade
- ✅ Sombras e profundidade
- ✅ Bordas arredondadas modernas

---

## 📷 Comparação

**Antes:**
- Fundo preto
- Regiões coladas
- Clima pequeno (100px)
- Sem texto visível

**Depois:**
- Fundo azul UFG com padrão
- Cards separados com sombra
- Clima grande (880px vertical)
- Texto em faixa dedicada (200px)

---

**Pronto para usar!** 🎉

Acesse: http://localhost:8000 e veja o novo layout!
