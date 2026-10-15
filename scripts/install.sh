#!/bin/bash

# Media Player - Instalação no Raspberry Pi
# O Pi roda o backend localmente e sincroniza mídias, agendamentos e o frontend
# com o servidor central (Railway). O player abre de http://localhost:8000 e
# continua funcionando sem internet com o último conteúdo sincronizado.
# Compatível com Raspberry Pi OS Bullseye (LXDE/X11) e Bookworm/Trixie (Wayfire/labwc).
#
# Uso: sudo ./scripts/install.sh [URL_DO_SERVIDOR]
# O token de sincronização é pedido na primeira instalação (ou via SYNC_TOKEN=... no ambiente).

SERVER_URL="${1:-https://mediaplayer.up.railway.app}"
SERVER_URL="${SERVER_URL%/}"
LOCAL_URL="http://localhost:8000/"

echo "=================================="
echo "Media Player - Instalação"
echo "=================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor execute como root ou com sudo${NC}"
  exit 1
fi

# Usuário que faz login na interface gráfica (quem chamou o sudo)
USER="${SUDO_USER:-pi}"
HOME_DIR=$(getent passwd "$USER" | cut -d: -f6)
if [ -z "$HOME_DIR" ]; then
  echo -e "${RED}Usuário '$USER' não encontrado${NC}"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"

# Token de sincronização: ambiente > .env existente > pergunta
env_value() {
  grep -s "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-
}
SYNC_TOKEN="${SYNC_TOKEN:-$(env_value SYNC_TOKEN)}"
if [ -z "$SYNC_TOKEN" ]; then
  read -rsp "Token de sincronização (SYNC_TOKEN do Railway): " SYNC_TOKEN
  echo ""
fi
if [ -z "$SYNC_TOKEN" ]; then
  echo -e "${RED}Token de sincronização obrigatório${NC}"
  exit 1
fi
# O admin local não é usado (o conteúdo vem do servidor); senha aleatória
ADMIN_PASSWORD="$(env_value ADMIN_PASSWORD)"
if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "admin123" ]; then
  ADMIN_PASSWORD="$(head -c 18 /dev/urandom | base64 | tr -d '/+=')"
fi

echo -e "${GREEN}[1/7] Instalando dependências do sistema...${NC}"
apt-get update
apt-get install -y python3 python3-venv python3-pip curl unclutter
# O pacote do Chromium mudou de nome nas versões novas do Raspberry Pi OS
if apt-cache show chromium >/dev/null 2>&1; then
  apt-get install -y chromium
else
  apt-get install -y chromium-browser
fi

# Agendamentos usam o horário local do Pi
timedatectl set-timezone America/Sao_Paulo || true

echo ""
echo -e "${GREEN}[2/7] Configurando backend Python...${NC}"
sudo -u "$USER" python3 -m venv "$BACKEND_DIR/.venv"
sudo -u "$USER" "$BACKEND_DIR/.venv/bin/pip" install --upgrade pip
sudo -u "$USER" "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"

cat > "$ENV_FILE" << EOF
# Gerado por scripts/install.sh (Raspberry Pi sincronizado com o servidor)
SYNC_URL=$SERVER_URL
SYNC_TOKEN=$SYNC_TOKEN
SYNC_INTERVAL=60
UPLOAD_DIR=uploads
ADMIN_USER=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOF
chown "$USER:$USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo ""
echo -e "${GREEN}[3/7] Primeira sincronização com $SERVER_URL...${NC}"
if (cd "$BACKEND_DIR" && sudo -u "$USER" .venv/bin/python -m app.services.sync); then
  echo "   • Conteúdo e frontend baixados"
else
  echo -e "${YELLOW}   • Não foi possível sincronizar agora (sem internet ou token inválido).${NC}"
  echo -e "${YELLOW}     O serviço tenta de novo a cada 60s.${NC}"
fi

echo ""
echo -e "${GREEN}[4/7] Criando serviço systemd...${NC}"

cat > /etc/systemd/system/mediaplayer.service << EOF
[Unit]
Description=Media Player Backend (sincronizado com $SERVER_URL)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$BACKEND_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mediaplayer.service
systemctl restart mediaplayer.service

echo ""
echo -e "${GREEN}[5/7] Criando script do kiosk...${NC}"

# Remove linhas de instalações antigas no autostart do LXDE
LXDE_AUTOSTART="$HOME_DIR/.config/lxsession/LXDE-pi/autostart"
if [ -f "$LXDE_AUTOSTART" ]; then
  sed -i '/chromium-browser --kiosk/d; /bash -c "sleep 10"/d' "$LXDE_AUTOSTART"
fi

cat > /usr/local/bin/mediaplayer-kiosk << EOF
#!/bin/bash
# Abre o player local em tela cheia. Gerado por scripts/install.sh

PLAYER_URL="$LOCAL_URL"

# Evita duas instâncias (alguns desktops leem mais de um autostart)
exec 9>/tmp/mediaplayer-kiosk.lock
flock -n 9 || exit 0

# Desabilitar screensaver e economia de energia (X11)
if [ -n "\$DISPLAY" ] && [ -z "\$WAYLAND_DISPLAY" ] && command -v xset >/dev/null; then
  xset s off
  xset -dpms
  xset s noblank
  unclutter -idle 0.5 -root &
fi

# Aguardar o backend local subir com o frontend (não depende de internet)
until curl -fsS -m 5 "\$PLAYER_URL" >/dev/null 2>&1; do
  sleep 3
done

BROWSER=\$(command -v chromium || command -v chromium-browser)
PREFS="\$HOME/.config/chromium/Default/Preferences"

# Reabre o navegador se ele fechar ou travar
while true; do
  # Evita o aviso "Restaurar páginas?" após desligar o Pi da tomada
  if [ -f "\$PREFS" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "\$PREFS"
  fi
  "\$BROWSER" --kiosk --noerrdialogs --disable-infobars \\
    --disable-session-crashed-bubble --disable-restore-session-state \\
    --autoplay-policy=no-user-gesture-required \\
    --check-for-update-interval=31536000 --password-store=basic \\
    "\$PLAYER_URL"
  sleep 5
done
EOF
chmod +x /usr/local/bin/mediaplayer-kiosk

echo ""
echo -e "${GREEN}[6/7] Configurando autostart (kiosk mode)...${NC}"

# XDG autostart: lido pelo LXDE (Bullseye) e pelo labwc (Bookworm/Trixie)
mkdir -p "$HOME_DIR/.config/autostart"
cat > "$HOME_DIR/.config/autostart/mediaplayer-kiosk.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Media Player Kiosk
Exec=/usr/local/bin/mediaplayer-kiosk
X-GNOME-Autostart-enabled=true
EOF

# labwc (Raspberry Pi OS Bookworm recente e Trixie)
mkdir -p "$HOME_DIR/.config/labwc"
LABWC_AUTOSTART="$HOME_DIR/.config/labwc/autostart"
if ! grep -q mediaplayer-kiosk "$LABWC_AUTOSTART" 2>/dev/null; then
  echo "/usr/local/bin/mediaplayer-kiosk &" >> "$LABWC_AUTOSTART"
fi

# Wayfire (Raspberry Pi OS Bookworm inicial)
WAYFIRE_INI="$HOME_DIR/.config/wayfire.ini"
if ! grep -q mediaplayer-kiosk "$WAYFIRE_INI" 2>/dev/null; then
  if grep -q '^\[autostart\]' "$WAYFIRE_INI" 2>/dev/null; then
    sed -i '/^\[autostart\]/a mediaplayer = /usr/local/bin/mediaplayer-kiosk' "$WAYFIRE_INI"
  else
    printf '\n[autostart]\nmediaplayer = /usr/local/bin/mediaplayer-kiosk\n' >> "$WAYFIRE_INI"
  fi
fi

# Ajustar permissões
chown -R "$USER:$USER" "$HOME_DIR/.config"

echo ""
echo -e "${GREEN}[7/7] Desligando o apagamento de tela...${NC}"
if command -v raspi-config >/dev/null; then
  raspi-config nonint do_blanking 1 || true
fi

echo ""
echo "=================================="
echo -e "${GREEN}Instalação Concluída!${NC}"
echo "=================================="
echo ""
echo "📋 Informações:"
echo "   • Player local (tela cheia): $LOCAL_URL"
echo "   • Conteúdo cadastrado em: $SERVER_URL/admin"
echo "   • Sincroniza a cada 60s; sem internet, exibe o último conteúdo baixado"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   1. O Pi precisa iniciar na área de trabalho com login automático:"
echo "      sudo raspi-config → System Options → Boot / Auto Login → Desktop Autologin"
echo ""
echo "   2. Reinicie o Raspberry Pi para abrir o player:"
echo "      sudo reboot"
echo ""
echo "📚 Comandos úteis:"
echo "   • Status: sudo systemctl status mediaplayer"
echo "   • Logs da sincronização: journalctl -u mediaplayer -f"
echo "   • Sair do player: Alt+F4 (ele reabre em 5s; para parar: pkill -f mediaplayer-kiosk)"
echo ""
echo "=================================="
