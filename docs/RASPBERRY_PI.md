# Instalação no Raspberry Pi

O Raspberry Pi funciona apenas como **tela**: ligado à TV pelo HDMI, ele abre o player hospedado no Railway em tela cheia (Chromium em modo kiosk). Todo o conteúdo é cadastrado pelo painel admin, de qualquer computador ou celular:

- Player: https://mediaplayer.up.railway.app/
- Admin: https://mediaplayer.up.railway.app/admin

## Requisitos

- Raspberry Pi (recomendado Pi 4 ou superior) com cartão SD
- Cabo HDMI ligado à Smart TV
- Internet (Wi-Fi ou cabo)
- Teclado e mouse (só durante a instalação)

## Passo a passo

### 1. Preparar o cartão SD

Se o Pi ainda não tiver sistema, use o **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** e grave o **Raspberry Pi OS (64-bit) com Desktop**.

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

> Para apontar para outro endereço, passe a URL como parâmetro:
> `sudo ./scripts/install.sh https://outra-url/`

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

Ao ligar, o Pi espera a internet e o servidor responderem e abre o player em tela cheia automaticamente.

## O que o `install.sh` faz

- Instala o Chromium, `curl` e `unclutter` (esconde o cursor do mouse).
- Cria `/usr/local/bin/mediaplayer-kiosk`, que:
  - espera a rede e o endpoint `/api/health` responderem antes de abrir o navegador;
  - abre o player em kiosk com autoplay de vídeo liberado;
  - reabre o navegador em 5 segundos se ele fechar ou travar;
  - evita o aviso "Restaurar páginas?" depois de uma queda de energia.
- Registra o kiosk no autostart do LXDE (Bullseye), Wayfire e labwc (Bookworm/Trixie).
- Desliga o apagamento de tela (`raspi-config`).
- Remove o serviço local `mediaplayer` de instalações antigas (quando o backend rodava no próprio Pi).

## Uso no dia a dia

| Ação | Como fazer |
|------|------------|
| Trocar o conteúdo da TV | Pelo admin: https://mediaplayer.up.railway.app/admin |
| Atualizar os scripts do Pi | `./scripts/update.sh` na pasta do projeto (faz `git pull` e reinstala) |
| Sair da tela cheia | `Alt+F4` fecha o player, mas ele reabre em 5 s |
| Parar o player de vez | Abra um terminal (`Ctrl+Alt+T`) e rode `pkill -f mediaplayer-kiosk` |
| Abrir o player de novo | Reinicie o Pi (`sudo reboot`) |

Mudanças no player ou no admin **não** exigem atualizar o Pi: elas são publicadas no Railway (`railway up`) e o Pi carrega a versão nova ao recarregar a página.

## Dicas para a TV

- Desative o **desligamento automático** e a **economia de energia** da TV.
- Os vídeos tocam **sem som**: o navegador só permite autoplay de vídeo mudo.
- O layout é 2048×1080 e se ajusta a qualquer resolução; em TVs 16:9 aparecem faixas pretas finas em cima e embaixo.

## Problemas comuns

| Sintoma | Causa provável / solução |
|---------|--------------------------|
| O player não abre ao ligar | Login automático desativado (passo 4) ou sem internet — o kiosk fica esperando o servidor responder. |
| Tela preta/apagando depois de um tempo | Economia de energia da TV; rode `sudo raspi-config nonint do_blanking 1` no Pi. |
| Aparece página de erro do navegador | O servidor caiu depois que a página abriu; reinicie o Pi ou pressione `F5`. |
| Clima mostra "Clima indisponível" | Falta configurar `OPENWEATHER_API_KEY` no Railway: `railway variable set OPENWEATHER_API_KEY=SUA_CHAVE`. |
