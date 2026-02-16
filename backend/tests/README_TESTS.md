# Testes do SchedulerService

Este arquivo contém testes unitários para o serviço `SchedulerService`, que é responsável por gerenciar o agendamento e retorno de conteúdos ativos (vídeos, imagens e textos) no Media Player.

## Arquivo de Teste

**Localização:** `backend/tests/test_scheduler_service.py`

## Casos de Teste

### 1. `test_get_active_content_with_video_and_image`
**Objetivo:** Verificar se o método `get_active_content()` retorna corretamente o conteúdo ativo de vídeo e imagem.

**Cenário:**
- Cria uma mídia do tipo "video" e outra do tipo "imagem"
- Agenda ambas as mídias para o momento atual
- Verifica se o método retorna os dados corretos de ambas as mídias

**Validações:**
- ✓ Retorna objeto com as chaves: video, imagem, texto, timestamp
- ✓ Vídeo contém: id, tipo, nome, caminho_arquivo, duracao, schedule_id
- ✓ Imagem contém: id, tipo, nome, caminho_arquivo, duracao, schedule_id
- ✓ Texto é None (não foi agendado)

### 2. `test_get_active_content_no_schedules`
**Objetivo:** Verificar o comportamento quando não há agendamentos ativos.

**Cenário:**
- Não cria nenhum agendamento
- Verifica se o método retorna None para todas as regiões

**Validações:**
- ✓ video = None
- ✓ imagem = None
- ✓ texto = None
- ✓ timestamp está presente

### 3. `test_get_active_content_inactive_schedule`
**Objetivo:** Verificar se agendamentos inativos são ignorados.

**Cenário:**
- Cria um agendamento com `ativo=False`
- Verifica se o método ignora esse agendamento

**Validações:**
- ✓ Conteúdo não é retornado mesmo estando no horário correto

### 4. `test_get_active_content_inactive_media`
**Objetivo:** Verificar se mídias inativas são ignoradas.

**Cenário:**
- Cria uma mídia com `ativo=False`
- Cria um agendamento ativo para essa mídia
- Verifica se o método ignora a mídia inativa

**Validações:**
- ✓ Conteúdo não é retornado mesmo com agendamento ativo

### 5. `test_get_active_content_wrong_weekday`
**Objetivo:** Verificar se o método respeita os dias da semana configurados.

**Cenário:**
- Cria um agendamento apenas para um dia específico (não hoje)
- Verifica se o método ignora esse agendamento no dia atual

**Validações:**
- ✓ Conteúdo não é retornado em dias não configurados

### 6. `test_get_active_content_priority`
**Objetivo:** Verificar se o método retorna o conteúdo de maior prioridade quando há múltiplos agendamentos ativos.

**Cenário:**
- Cria dois agendamentos ativos para a mesma região
- Um com prioridade 1 (baixa) e outro com prioridade 10 (alta)
- Verifica se o de maior prioridade é retornado

**Validações:**
- ✓ Retorna o conteúdo com maior prioridade

### 7. `test_get_active_content_outside_time_range`
**Objetivo:** Verificar se agendamentos fora do horário são ignorados.

**Cenário:**
- Cria um agendamento para um horário diferente do atual
- Verifica se o método não retorna esse agendamento

**Validações:**
- ✓ Conteúdo não é retornado fora do horário agendado

## Como Executar os Testes

### Opção 1: Usando o script Windows
```batch
cd backend
run_tests.bat
```

### Opção 2: Usando pytest diretamente
```bash
cd backend
python -m pytest tests/test_scheduler_service.py -v
```

### Opção 3: Executar apenas um teste específico
```bash
cd backend
python -m pytest tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_with_video_and_image -v
```

## Resultado Esperado

Todos os 7 testes devem passar:

```
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_with_video_and_image PASSED [ 14%]
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_no_schedules PASSED [ 28%]
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_inactive_schedule PASSED [ 42%]
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_inactive_media PASSED [ 57%]
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_wrong_weekday PASSED [ 71%]
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_priority PASSED [ 85%]
tests/test_scheduler_service.py::TestGetActiveContent::test_get_active_content_outside_time_range PASSED [100%]

======================== 7 passed in 1.87s =========================
```

## Estrutura dos Testes

Os testes utilizam:
- **pytest**: Framework de testes
- **SQLite em memória**: Banco de dados temporário para cada teste
- **Fixtures**: Para criar dados de teste reutilizáveis
  - `test_db`: Cria banco de dados em memória
  - `sample_video_media`: Cria mídia de vídeo
  - `sample_image_media`: Cria mídia de imagem
  - `sample_text_media`: Cria mídia de texto

## Dependências

Certifique-se de ter as seguintes dependências instaladas:

```
pytest==7.4.3
pytest-asyncio==0.21.1
sqlalchemy==2.0.25
```

Essas dependências já estão listadas no arquivo `requirements.txt`.

## Cobertura de Teste

Os testes cobrem:
- ✓ Retorno correto de conteúdo ativo
- ✓ Filtragem por tipo de região (vídeo, imagem, texto)
- ✓ Validação de datas e horários
- ✓ Validação de dias da semana
- ✓ Sistema de prioridades
- ✓ Filtragem de conteúdo inativo
- ✓ Cenários sem agendamentos
