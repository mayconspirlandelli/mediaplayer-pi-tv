#!/bin/bash

# Media Player - Instalação do Raspberry Pi como tela (kiosk)
# O backend roda no Railway; o Pi só abre o player em tela cheia na TV.
# Compatível com Raspberry Pi OS Bullseye (LXDE/X11) e Bookworm/Trixie (Wayfire/labwc).
#
# Uso: sudo ./scripts/install.sh [URL_DO_PLAYER]

PLAYER_URL="${1:-https://mediaplayer.up.railway.app/}"
HEALTH_URL="${PLAYER_URL%/}/api/health"

echo "=================================="
echo "Media Player - Instalação (kiosk)"
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

echo -e "${GREEN}[1/5] Instalando dependências do sistema...${NC}"
apt-get update
apt-get install -y curl unclutter
# O pacote do Chromium mudou de nome nas versões novas do Raspberry Pi OS
if apt-cache show chromium >/dev/null 2>&1; then
  apt-get install -y chromium
else
  apt-get install -y chromium-browser
fi

echo ""
echo -e "${GREEN}[2/5] Removendo instalação local antiga (se houver)...${NC}"
# Versões anteriores rodavam o backend no Pi e abriam http://localhost:8000
if [ -f /etc/systemd/system/mediaplayer.service ]; then
  systemctl stop mediaplayer.service
  systemctl disable mediaplayer.service
  rm -f /etc/systemd/system/mediaplayer.service
  systemctl daemon-reload
  echo "   • Serviço local mediaplayer removido"
fi
LXDE_AUTOSTART="$HOME_DIR/.config/lxsession/LXDE-pi/autostart"
if [ -f "$LXDE_AUTOSTART" ]; then
  sed -i '/chromium-browser --kiosk/d; /bash -c "sleep 10"/d' "$LXDE_AUTOSTART"
fi

echo ""
echo -e "${GREEN}[3/5] Criando script do kiosk...${NC}"

cat > /usr/local/bin/mediaplayer-kiosk << EOF
#!/bin/bash
# Abre o player em tela cheia. Gerado por scripts/install.sh

PLAYER_URL="$PLAYER_URL"
HEALTH_URL="$HEALTH_URL"

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

# Aguardar internet e o servidor responderem (Wi-Fi pode demorar no boot)
until curl -fsS -m 5 "\$HEALTH_URL" >/dev/null 2>&1; do
  sleep 5
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
echo -e "${GREEN}[4/5] Configurando autostart (kiosk mode)...${NC}"

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
echo -e "${GREEN}[5/5] Desligando o apagamento de tela...${NC}"
if command -v raspi-config >/dev/null; then
  raspi-config nonint do_blanking 1 || true
fi

echo ""
echo "=================================="
echo -e "${GREEN}Instalação Concluída!${NC}"
echo "=================================="
echo ""
echo "📋 Informações:"
echo "   • Player (fullscreen): $PLAYER_URL"
echo "   • Admin Panel: ${PLAYER_URL%/}/admin"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   1. O Pi precisa iniciar na área de trabalho com login automático:"
echo "      sudo raspi-config → System Options → Boot / Auto Login → Desktop Autologin"
echo ""
echo "   2. Reinicie o Raspberry Pi para abrir o player:"
echo "      sudo reboot"
echo ""
echo "📚 Comandos úteis:"
echo "   • Sair do player: Alt+F4 (ele reabre em 5s; para parar: pkill -f mediaplayer-kiosk)"
echo "   • Trocar a URL: sudo ./scripts/install.sh https://outra-url/"
echo ""
echo "=================================="
