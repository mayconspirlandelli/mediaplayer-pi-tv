# 🚀 Guia Rápido - Media Player

## Instalação Rápida (5 minutos)

### 1. Preparar Raspberry Pi
```bash
# Atualizar sistema (opcional mas recomendado)
sudo apt update && sudo apt upgrade -y
```

### 2. Clonar/Copiar Projeto
```bash
cd /home/pi
# Se usar git:
git clone [url-do-repositorio] mediaplayer-pi

# Ou copie os arquivos para /home/pi/mediaplayer-pi
```

### 3. Instalar Automaticamente
```bash
cd mediaplayer-pi
sudo ./scripts/install.sh
```

⏱️ A instalação leva cerca de 5-10 minutos.

### 4. Configurar API de Clima
```bash
nano backend/.env
```

Edite a linha:
```
OPENWEATHER_API_KEY=sua_chave_aqui
```

Obtenha chave gratuita em: https://openweathermap.org/api

### 5. Reiniciar Serviço
```bash
sudo systemctl restart mediaplayer
```

### 6. Pronto! 🎉
Abra no navegador:
- **Player**: http://localhost:8000
- **Admin**: http://localhost:8000/admin

---

## Uso Diário

### Adicionar Conteúdo

1. Acesse http://IP-DO-RASPBERRY:8000/admin
2. Clique em "Upload"
3. Selecione tipo (vídeo/imagem/texto)
4. Faça upload
5. Clique em "Novo Agendamento"
6. Configure data, hora, região
7. Salve

### Regiões do Layout

- **Região 1 (Vídeo)**: Lado esquerdo, vídeos verticais 1080x1080
- **Região 2 (Imagem)**: Topo direito, imagens 840x980
- **Região 3 (Clima)**: Automático (não precisa upload)
- **Região 4 (Texto)**: Embaixo, avisos em texto (DESABILITADA no layout atual)

### Formatos Suportados

**Vídeos**: MP4 (recomendado), WebM, AVI
**Imagens**: JPG, PNG, WebP
**Textos**: Qualquer texto

---

## Comandos Úteis

```bash
# Ver status do sistema
sudo systemctl status mediaplayer

# Ver logs em tempo real
sudo journalctl -u mediaplayer -f

# Reiniciar sistema
sudo systemctl restart mediaplayer

# Parar sistema
sudo systemctl stop mediaplayer

# Iniciar sistema
sudo systemctl start mediaplayer

# Atualizar após mudanças
./scripts/update.sh

# Verificar IP local
hostname -I
```

---

## Troubleshooting

### Player não abre no boot
```bash
# Verifique se autostart está configurado
cat ~/.config/lxsession/LXDE-pi/autostart

# Deve conter linhas sobre chromium-browser --kiosk
```

### Vídeos não reproduzem
```bash
# Converta para H.264 (codec compatível)
ffmpeg -i input.mp4 -c:v h264 -c:a aac output.mp4
```

### Clima não atualiza
```bash
# Verifique API key
cat backend/.env | grep OPENWEATHER_API_KEY

# Teste API
curl "http://localhost:8000/api/player/weather"
```

### Serviço não inicia
```bash
# Ver erros
sudo journalctl -u mediaplayer -n 50

# Testar manualmente
cd backend
source venv/bin/activate
python app/main.py
```

---

## Arquitetura Simplificada

```
┌─────────────────────────────────────┐
│  Raspberry Pi Boot                  │
└──────────────┬──────────────────────┘
               │
               ├──> Inicia serviço systemd (mediaplayer.service)
               │    │
               │    └──> Backend Python (porta 8000)
               │         ├──> Serve frontend (React build)
               │         ├──> API REST
               │         └──> Banco SQLite
               │
               └──> Abre Chromium em kiosk mode
                    └──> http://localhost:8000 (Player fullscreen)
```

---

## Próximos Passos

1. ✅ Instalar sistema
2. ✅ Configurar API de clima
3. 📤 Fazer upload de primeira mídia
4. 📅 Criar primeiro agendamento
5. 🎬 Ver no player
6. 🔁 Reiniciar Raspberry Pi para testar autostart

---

## Suporte

Problemas? Verifique:
1. Logs: `sudo journalctl -u mediaplayer -f`
2. Status: `sudo systemctl status mediaplayer`
3. Porta: `sudo netstat -tulpn | grep 8000`
4. README completo: `cat README.md`
