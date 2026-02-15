#!/usr/bin/env python3
"""
Script de teste para criar agendamento de imagem via API
"""

import requests
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"

def test_image_schedule():
    print("=" * 60)
    print("TESTE: Criar agendamento de imagem")
    print("=" * 60)
    print()
    
    # 1. Verificar se API está rodando
    try:
        response = requests.get(f"{API_URL}/api/player/health", timeout=3)
        print("✓ API está rodando")
    except:
        print("✗ API não está rodando!")
        print("  Execute: cd backend && run.bat")
        return
    
    print()
    
    # 2. Listar mídias do tipo imagem
    print("Buscando mídias do tipo 'imagem'...")
    response = requests.get(f"{API_URL}/api/media?tipo=imagem")
    imagens = response.json()
    
    if not imagens:
        print("✗ Nenhuma imagem encontrada no banco!")
        print("  Faça upload de uma imagem primeiro em /admin")
        return
    
    print(f"✓ Encontradas {len(imagens)} imagem(ns)")
    
    # Usar a primeira imagem
    imagem = imagens[0]
    print(f"  ID: {imagem['id']}")
    print(f"  Nome: {imagem['nome']}")
    print(f"  Tipo: {imagem['tipo']}")
    print()
    
    # 3. Criar agendamento
    hoje = datetime.now()
    amanha = hoje + timedelta(days=1)
    
    schedule_data = {
        "media_id": imagem['id'],
        "regiao": 2,  # Região 2 = Imagem
        "data_inicio": hoje.strftime("%Y-%m-%d"),
        "data_fim": amanha.strftime("%Y-%m-%d"),
        "hora_inicio": "08:00:00",
        "hora_fim": "18:00:00",
        "duracao": 10,
        "dias_semana": "0,1,2,3,4,5,6",
        "prioridade": 5,
        "ativo": True
    }
    
    print("Criando agendamento de TESTE...")
    print(f"  Mídia: {imagem['nome']}")
    print(f"  Região: 2 (Imagem)")
    print(f"  Período: {schedule_data['data_inicio']} a {schedule_data['data_fim']}")
    print(f"  Horário: {schedule_data['hora_inicio']} a {schedule_data['hora_fim']}")
    print()
    
    response = requests.post(
        f"{API_URL}/api/schedule",
        json=schedule_data
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✓ Agendamento criado com sucesso!")
        print(f"  ID: {result['id']}")
        print()
        
        # 4. Verificar se foi criado
        print("Verificando agendamentos da região 2...")
        response = requests.get(f"{API_URL}/api/schedule?regiao=2")
        schedules = response.json()
        
        print(f"✓ Total de agendamentos na região 2: {len(schedules)}")
        
        for s in schedules:
            print(f"  - ID {s['id']}: {s['media_nome']} (prioridade {s['prioridade']})")
        
        print()
        print("=" * 60)
        print("TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        print()
        print("Próximo passo:")
        print("  1. Acesse: http://localhost:8000/admin")
        print("  2. Clique em 'Agendamentos'")
        print("  3. Você deve ver o agendamento criado")
        
    else:
        print("✗ Erro ao criar agendamento!")
        print(f"  Status: {response.status_code}")
        print(f"  Resposta: {response.text}")
        print()
        print("POSSÍVEIS CAUSAS:")
        print("  1. Tipo de mídia incompatível com região")
        print("  2. Datas/horas inválidas")
        print("  3. Mídia não encontrada")

if __name__ == "__main__":
    try:
        test_image_schedule()
    except Exception as e:
        print(f"✗ Erro: {e}")
        import traceback
        traceback.print_exc()
