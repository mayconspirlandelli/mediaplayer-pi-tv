# Instalação em totem Windows (tela sensível ao toque)

Este guia coloca o Media Player em um **computador Windows tipo totem**: você descompacta uma pasta, roda um instalador e o player passa a abrir sozinho **em tela cheia** ao ligar o computador, funcionando **localmente** (sem depender do Railway).

```
 Seu PC/celular ──► http://IP_DO_TOTEM:8000/admin ──┐   (cadastro de mídias e agendamentos)
                                                    ▼
                          Totem Windows: servidor local (banco + mídias em disco)
                                                    │  http://127.0.0.1:8000
                                                    ▼
                          Microsoft Edge em tela cheia ──► tela de toque
```

- O conteúdo (banco e mídias) fica **no próprio totem**, separado do programa: atualizar o programa não apaga o conteúdo.
- O toque na tela é **só de exibição**: não dá zoom, rolagem, seleção, nem pausar ou abrir links dos vídeos incorporados.
- Manutenção por **SSH/WinSCP**.

> **Status:** os scripts foram revisados e o pacote foi testado extraído e rodando em outro sistema, mas **ainda não foram executados em um Windows real**. No primeiro uso, anote qualquer erro (a janela do instalador mostra a mensagem) para ajustarmos.

## Requisitos do totem

- Windows 10 ou 11 (Home funciona), com **Microsoft Edge** (já vem no Windows).
- **Internet** durante a instalação (baixa o Python e as dependências) e depois para clima e embeds (YouTube/Instagram/TikTok).
- O instalador instala o **Python 3.12** sozinho (pelo `winget`). Se o `winget` não existir, ele avisa e você instala o Python manualmente em https://www.python.org/downloads/ (marcando *Add python.exe to PATH*).
- Conta de usuário do Windows que será usada no totem, de preferência **com senha** (veja [SSH e senha da conta](#ssh-e-senha-da-conta)).

## 1. Gerar o pacote (no seu computador de desenvolvimento)

Na raiz do projeto:

```bash
python3 scripts/empacotar_totem.py
```

Isso compila o frontend e cria `dist-totem/mediaplayer-totem-AAAAMMDD-HHMM.zip` (cerca de 1 MB). O ZIP **não** leva banco, mídias, senhas nem `node_modules`; o totem não precisa de Node.

Se o frontend já estiver compilado: `python3 scripts/empacotar_totem.py --sem-build`.

## 2. Levar o ZIP ao totem

Por pendrive, ou por WinSCP se o SSH já estiver ativo. Descompacte em um **local fixo** que não será movido, por exemplo `C:\mediaplayer-totem`. Não rode de dentro do ZIP.

## 3. Instalar (uma vez)

Dê duplo clique em **`instalar.bat`** e aceite o pedido de administrador. O instalador:

1. instala o Python 3.12, se faltar;
2. cria o ambiente Python e instala as dependências;
3. cria `backend\.env` com **senha de admin aleatória** (e pergunta a chave do clima e a cidade);
4. libera a porta 8000 no firewall, **só para redes privadas**;
5. cria a tarefa `MediaPlayerTotem`, que inicia tudo ao entrar no Windows;
6. desliga suspensão, hibernação, desligamento da tela e protetor de tela, e tenta desativar os gestos de borda da tela de toque;
7. opcionalmente habilita o servidor **SSH** do Windows.

No fim ele mostra o endereço do admin e a **senha gerada: anote**. Ela também fica em `backend\.env`.

Se a rede do totem estiver marcada como **Pública**, o admin não abre por outro computador: em *Configurações → Rede e Internet → (Wi-Fi ou Ethernet) → Propriedades*, mude o tipo de perfil para **Privada**.

## 4. Entrar no Windows direto, sem tela de login

O totem usa a tarefa de **"ao entrar no Windows"**, então o Windows precisa entrar sozinho na conta. Se o seu totem já vai direto para a área de trabalho, não há nada a fazer.

Se for configurar: `Win + R` → `netplwiz` → desmarque *"Os usuários devem digitar seu nome e senha para usar este computador"* → informe a senha da conta. No Windows 11, se essa caixa não aparecer, desative antes em *Configurações → Contas → Opções de entrada → "Para melhorar a segurança, permitir apenas entrada do Windows Hello..."*.

Depois de uma queda de energia ou atualização do Windows, o totem volta ao ar sozinho: o computador reinicia, entra na conta e a tarefa abre o player.

## 5. Cadastrar mídias e agendamentos

De **outro computador ou do celular na mesma rede**, abra:

```
http://IP_DO_TOTEM:8000/admin
```

Usuário `admin` e a senha anotada na instalação. O upload de vídeos e imagens, o agendamento (inclusive **tempo indeterminado**) e a reordenação funcionam como no resto do sistema. As mudanças aparecem no totem sozinhas (o player consulta o servidor a cada troca de conteúdo).

Para descobrir o IP do totem: `ipconfig` no totem, linha *Endereço IPv4*. Vale reservar esse IP fixo no roteador.

## SSH e senha da conta

O instalador pode habilitar o **OpenSSH Server** do Windows (porta 22, só redes privadas). Conecte com o usuário e a senha **do Windows**:

```bash
ssh usuario@IP_DO_TOTEM
```

No **WinSCP**: protocolo **SFTP**, porta 22, mesmo usuário e senha.

> **Importante:** o SSH do Windows **recusa contas sem senha**. Se a conta do totem não tem senha, defina uma (em *Configurações → Contas → Opções de entrada → Senha*) e depois configure o login automático com o `netplwiz` (passo 4) para o totem continuar entrando direto. Com SSH ativo, use uma senha forte: ela dá acesso total à conta.

Comandos úteis por SSH (o prompt é o `cmd`):

| Ação | Comando |
|------|---------|
| Reiniciar o player e o servidor | `schtasks /end /tn MediaPlayerTotem` e depois `schtasks /run /tn MediaPlayerTotem` |
| Parar tudo | `C:\mediaplayer-totem\parar.bat /sem-pausa` |
| Ver o log | `type C:\mediaplayer-totem\logs\totem.log` |
| Ver erros do servidor | `type C:\mediaplayer-totem\logs\backend-erro.log` |
| Reiniciar o Windows | `shutdown /r /t 0` |

## 6. Atualizar o programa

1. No seu computador, gere um pacote novo: `python3 scripts/empacotar_totem.py`.
2. Envie o novo ZIP para a pasta do totem (`C:\mediaplayer-totem`, ou a pasta acima) por WinSCP.
3. No totem, dê duplo clique em **`atualizar.bat`** (ou por SSH: `cd C:\mediaplayer-totem` e `atualizar.bat "" /sem-pausa`).

O `atualizar.bat` usa o ZIP mais recente, **faz backup do banco em `backups\`**, troca só o programa e reinicia o player. **Preserva** `backend\.env` (senha), `backend\mediaplayer.db`, `backend\uploads\`, os logs e o ambiente Python. Para usar um ZIP específico: `atualizar.bat C:\caminho\arquivo.zip`.

## Backup e restauração

O conteúdo do totem é:

- `backend\mediaplayer.db`: cadastro de mídias e agendamentos;
- `backend\uploads\`: vídeos e imagens;
- `backend\.env`: senha do admin e chaves.

Copie essas pastas/arquivos (por WinSCP) para guardar. Para restaurar, pare o totem (`parar.bat`), copie de volta e reinicie.

## Janela do player e saída da tela cheia

- Com **teclado**, `Alt+F4` fecha o player, que reabre em 5 segundos. Para parar de vez: `parar.bat`.
- Só pelo toque não há como sair da tela cheia (de propósito).
- O player usa um perfil próprio do Edge (`dados\edge-perfil`): não interfere no Edge normal do Windows e ele não pede "restaurar páginas" depois de queda de energia.

## Limitações do Windows Home

O Home não tem o *Acesso atribuído* (quiosque nativo do Windows) nem edição de política de grupo. Por isso o bloqueio vem do **modo quiosque do Edge** e das proteções do próprio player. Os **gestos de borda da tela de toque** (arrastar da borda para abrir widgets ou a central de ações) são desativados por uma política de registro que **pode não ter efeito no Home**. Se o totem permitir esses gestos, a alternativa é uma **moldura física** que cubra as bordas da tela ou, se possível, o Windows Pro.

## Problemas comuns

| Sintoma | Causa provável / solução |
|---------|--------------------------|
| `instalar.bat` fecha logo ou mostra erro | Rode de novo e leia a mensagem. Sem internet não instala o Python nem as dependências. |
| "winget não está disponível" | Instale o Python 3.12 manualmente (https://www.python.org/downloads/, *Add python.exe to PATH*) e rode o instalador de novo. |
| Player não abre ao ligar | O Windows não entrou na conta sozinho (passo 4), ou a pasta foi movida depois de instalar: rode `instalar.bat` de novo no local final. |
| Tela branca/erro ao abrir | O servidor ainda estava subindo: aguarde. Se persistir, veja `logs\backend-erro.log`. |
| Admin não abre por outro computador | Rede do totem como *Pública* (passo 3) ou IP errado (`ipconfig`). |
| Conteúdo novo não aparece | Confira o agendamento (região, período) e a hora do Windows do totem. |
| Clima "indisponível" | Sem internet no totem, ou sem `OPENWEATHER_API_KEY` em `backend\.env` (edite e reinicie). |
| Trocar a senha do admin | Edite `ADMIN_PASSWORD` em `backend\.env` e reinicie o player (`schtasks /end` e `/run`, ou reinicie o Windows). |
| SSH nega o acesso | A conta não tem senha (veja *SSH e senha da conta*) ou a rede está como *Pública*. |
| Edge pede para definir como padrão / mostra bem-vindo | Só na primeira vez; feche com `Alt+F4` e o player reabre limpo. |

## Estrutura da pasta instalada

```
C:\mediaplayer-totem\
├── instalar.bat  iniciar.bat  parar.bat  atualizar.bat   # lançadores
├── LEIA-ME.txt  VERSAO.txt
├── scripts\                 # instalar/iniciar/parar/atualizar (.ps1)
├── backend\
│   ├── app\                 # servidor (substituído nas atualizações)
│   ├── mediaplayer.db       # conteúdo (preservado)
│   ├── uploads\             # mídias (preservado)
│   ├── .env                 # senha e chaves (preservado)
│   └── .venv\               # ambiente Python (preservado)
├── frontend\dist\           # player e admin compilados (substituído)
├── dados\edge-perfil\       # perfil do Edge do totem
├── logs\  backups\
```
