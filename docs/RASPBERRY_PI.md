# Instalação no Raspberry Pi

O Raspberry Pi, ligado à TV pelo HDMI, roda o sistema **localmente** e abre o player em tela cheia a partir de `http://localhost:8000` (Chromium em modo kiosk).

O conteúdo continua sendo cadastrado no **servidor central (Railway)**, de qualquer computador ou celular:

- Admin: https://mediaplayer.up.railway.app/admin

O Pi **sincroniza** com o servidor a cada 60 segundos: baixa mídias, agendamentos e a versão mais recente do player. Como os vídeos e imagens ficam no cartão SD, a TV **continua funcionando sem internet**, exibindo o último conteúdo sincronizado.

```
 Admin (celular/PC) ──► Railway (servidor central)
                              │  a cada 60 s: mídias, agendamentos, frontend
                              ▼
                     Raspberry Pi (backend local + arquivos no SD)
                              │  http://localhost:8000
                              ▼
                     Chromium em tela cheia ──HDMI──► TV
```

## Requisitos

- Raspberry Pi 3 ou superior (Pi 4 recomendado para vídeos 1080p e embeds) com cartão SD
- Cabo HDMI ligado à Smart TV
- Internet (Wi-Fi ou cabo) para a instalação e para receber novos conteúdos
- Teclado e mouse (só durante a instalação)
- **Token de sincronização** (`SYNC_TOKEN`), configurado nas variáveis do serviço no Railway

> Se o Pi já usa outro sistema de sinalização (ex.: piSignage), use **outro cartão SD** para este projeto, para os dois players não disputarem a tela.

## Passo a passo

### 1. Preparar o cartão SD

Use o **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** e grave o **Raspberry Pi OS com Desktop** (64-bit para Pi 3, 4 e 5).

Nas opções do Imager (ícone de engrenagem), já configure **usuário, senha e Wi-Fi**.

### 2. Ligar o Pi na TV

Conecte o Pi à TV pelo HDMI, com teclado e mouse, e aguarde a área de trabalho abrir.

### 3. Baixar o projeto e instalar

Abra o **Terminal** no Pi e rode:

```bash
git clone https://github.com/mayconspirlandelli/mediaplayer-pi-tv.git
```

```bash
cd mediaplayer-pi-tv && sudo ./scripts/install.sh
```

O script pede o **token de sincronização** (a digitação não aparece na tela). Ele fica salvo em `backend/.env` e é reaproveitado nas próximas atualizações.

> Para usar outro servidor: `sudo ./scripts/install.sh https://outro-servidor`

> Se o repositório for privado, o `git clone` pedirá login. Nesse caso, é mais simples copiar a pasta do projeto para o Pi por pendrive.

### 4. Ativar o login automático na área de trabalho

Sem isso o player não abre sozinho ao ligar:

```bash
sudo raspi-config
```

Vá em **System Options → Boot / Auto Login → Desktop Autologin** e depois em **Finish**.

### 5. Reiniciar

```bash
sudo reboot
```

Ao ligar, o backend local sobe, o Chromium abre o player em tela cheia e a sincronização começa em segundo plano.

## O que o `install.sh` faz

- Instala Python, Chromium, `curl` e `unclutter` (esconde o cursor do mouse) e ajusta o fuso para `America/Sao_Paulo` (os agendamentos usam o horário do Pi).
- Cria o ambiente Python em `backend/.venv` e o `backend/.env` com `SYNC_URL`, `SYNC_TOKEN` e uma senha aleatória para o admin local (que não é usado).
- Faz a **primeira sincronização** (conteúdo + frontend). Sem internet nesse momento, o serviço tenta de novo a cada 60 s.
- Cria o serviço systemd `mediaplayer` (backend em `127.0.0.1:8000`, reinicia sozinho se cair).
- Cria `/usr/local/bin/mediaplayer-kiosk`, que espera o player local responder, abre o Chromium em kiosk com autoplay liberado, reabre se ele fechar e evita o aviso "Restaurar páginas?" após queda de energia.
- Registra o kiosk no autostart do LXDE (Bullseye), Wayfire e labwc (Bookworm/Trixie) e desliga o apagamento de tela.

## Como a sincronização funciona

- O backend do Pi consulta `SYNC_URL/api/sync/export` a cada `SYNC_INTERVAL` segundos (padrão 60), autenticado com `SYNC_TOKEN`.
- Arquivos novos são baixados para `backend/uploads/`; os que foram excluídos no servidor são apagados do Pi.
- Mídias e agendamentos locais são substituídos pelos do servidor — **cadastre sempre no admin do Railway**; alterações feitas no Pi são sobrescritas.
- O frontend (player) é atualizado quando muda no servidor. A TV passa a usar a versão nova após recarregar a página (reinício do Pi).
- O clima vem do servidor; sem internet, aparece "Clima indisponível".
- Sem internet, nada é apagado: o player segue com o último conteúdo baixado.

## Uso no dia a dia

| Ação | Como fazer |
|------|------------|
| Trocar o conteúdo da TV | Admin do Railway: https://mediaplayer.up.railway.app/admin (chega ao Pi em até 1 min) |
| Ver a sincronização | `journalctl -u mediaplayer -f` |
| Forçar uma sincronização agora | `sudo systemctl restart mediaplayer` |
| Atualizar o código do Pi | `./scripts/update.sh` na pasta do projeto (faz `git pull` e reinstala) |
| Sair da tela cheia | `Alt+F4` fecha o player, mas ele reabre em 5 s |
| Parar o player de vez | Abra um terminal (`Ctrl+Alt+T`) e rode `pkill -f mediaplayer-kiosk` |
| Abrir o player de novo | Reinicie o Pi (`sudo reboot`) |

## Dicas para a TV

- Desative o **desligamento automático** e a **economia de energia** da TV.
- Os vídeos tocam **sem som**: o navegador só permite autoplay de vídeo mudo.
- O layout é 2048×1080 e se ajusta a qualquer resolução; em TVs 16:9 aparecem faixas pretas finas em cima e embaixo.
- No **Pi 3**, prefira vídeos MP4 H.264 em 720p e evite links do YouTube/Instagram/TikTok (pesados e dependem de internet).

## Problemas comuns

| Sintoma | Causa provável / solução |
|---------|--------------------------|
| O player não abre ao ligar | Login automático desativado (passo 4) ou o frontend ainda não foi sincronizado — veja `journalctl -u mediaplayer -f`. |
| Log mostra "Sync falhou ... 401" | Token errado: corrija `SYNC_TOKEN` em `backend/.env` e rode `sudo systemctl restart mediaplayer`. |
| Conteúdo novo não aparece | Sem internet no Pi, ou o agendamento está fora do horário/dia. Confira o horário do Pi (`date`). |
| Tela preta/apagando depois de um tempo | Economia de energia da TV; rode `sudo raspi-config nonint do_blanking 1` no Pi. |
| Clima mostra "Clima indisponível" | Pi sem internet, ou falta `OPENWEATHER_API_KEY` no Railway: `railway variable set OPENWEATHER_API_KEY=SUA_CHAVE`. |
