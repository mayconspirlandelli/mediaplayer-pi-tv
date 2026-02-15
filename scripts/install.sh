#!/bin/bash

# Media Player - Script de Instalação Automática
# Para Raspberry Pi 4 + Raspberry Pi OS

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

# Diretório de instalação
INSTALL_DIR="/home/pi/mediaplayer-pi"
USER="pi"

echo -e "${GREEN}[1/8] Atualizando sistema...${NC}"
apt-get update
apt-get upgrade -y

echo ""
echo -e "${GREEN}[2/8] Instalando dependências do sistema...${NC}"
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    chromium-browser \
    unclutter \
    xdotool \
    git \
    curl

echo ""
echo -e "${GREEN}[3/8] Instalando Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo ""
echo -e "${GREEN}[4/8] Configurando backend Python...${NC}"
cd "$INSTALL_DIR/backend"

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}Arquivo .env criado. Configure sua API key do OpenWeatherMap!${NC}"
fi

# Criar diretório de uploads
mkdir -p uploads

# Inicializar banco de dados
python3 -c "from app.database import init_db; init_db()"

deactivate

echo ""
echo -e "${GREEN}[5/8] Configurando frontend React...${NC}"
cd "$INSTALL_DIR/frontend"

# Instalar dependências
npm install

# Build para produção
npm run build

echo ""
echo -e "${GREEN}[6/8] Criando serviço systemd...${NC}"

cat > /etc/systemd/system/mediaplayer.service << EOF
[Unit]
Description=Media Player Backend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin"
ExecStart=$INSTALL_DIR/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Habilitar e iniciar serviço
systemctl daemon-reload
systemctl enable mediaplayer.service
systemctl start mediaplayer.service

echo ""
echo -e "${GREEN}[7/8] Configurando autostart (kiosk mode)...${NC}"

# Criar diretório autostart se não existir
mkdir -p /home/$USER/.config/lxsession/LXDE-pi

# Configurar autostart
cat > /home/$USER/.config/lxsession/LXDE-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Desabilitar screensaver e economia de energia
@xset s off
@xset -dpms
@xset s noblank

# Ocultar cursor do mouse
@unclutter -idle 0

# Aguardar serviço iniciar
@bash -c "sleep 10"

# Abrir player em kiosk mode
@chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state --autoplay-policy=no-user-gesture-required http://localhost:8000
EOF

# Ajustar permissões
chown -R $USER:$USER /home/$USER/.config

echo ""
echo -e "${GREEN}[8/8] Configuração de rede...${NC}"

# Obter IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=================================="
echo -e "${GREEN}Instalação Concluída!${NC}"
echo "=================================="
echo ""
echo "📋 Informações:"
echo "   • Player (fullscreen): http://localhost:8000"
echo "   • Admin Panel: http://localhost:8000/admin"
echo "   • Da rede local: http://$LOCAL_IP:8000"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Configure sua API key no arquivo:"
echo "      $INSTALL_DIR/backend/.env"
echo ""
echo "   2. Reinicie o serviço após configurar:"
echo "      sudo systemctl restart mediaplayer"
echo ""
echo "   3. Para abrir em fullscreen no boot:"
echo "      Reinicie o Raspberry Pi"
echo ""
echo "📚 Comandos úteis:"
echo "   • Ver status: sudo systemctl status mediaplayer"
echo "   • Ver logs: sudo journalctl -u mediaplayer -f"
echo "   • Reiniciar: sudo systemctl restart mediaplayer"
echo "   • Parar: sudo systemctl stop mediaplayer"
echo ""
echo "=================================="
