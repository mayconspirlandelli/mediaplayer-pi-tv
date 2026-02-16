#!/usr/bin/env python3
"""
Script de debug para verificar o funcionamento do scheduler
"""
from datetime import datetime
from app.database import SessionLocal, init_db
from app.models import Media, Schedule
from app.services.scheduler import SchedulerService
import json

def debug_scheduler():
    print("=" * 80)
    print("DEBUG DO SCHEDULER - ACTIVE CONTENT")
    print("=" * 80)
    print()
    
    # Inicializar banco
    init_db()
    db = SessionLocal()
    
    try:
        # Informações atuais
        now = datetime.now()
        current_date = now.date()
        current_time = now.time()
        current_weekday = (now.weekday() + 1) % 7
        
        print(f"📅 Data/Hora atual: {now}")
        print(f"   Data: {current_date}")
        print(f"   Hora: {current_time}")
        print(f"   Dia da semana: {current_weekday} (0=domingo, 1=segunda, ..., 6=sábado)")
        print()
        
        # Buscar todas as mídias
        print("=" * 80)
        print("MÍDIAS CADASTRADAS")
        print("=" * 80)
        medias = db.query(Media).all()
        for media in medias:
            status = "✓ Ativo" if media.ativo else "✗ Inativo"
            print(f"ID {media.id}: {media.tipo.upper():8} | {media.nome:30} | {status}")
        print(f"\nTotal: {len(medias)} mídias")
        print()
        
        # Buscar todos os agendamentos
        print("=" * 80)
        print("AGENDAMENTOS CADASTRADOS")
        print("=" * 80)
        schedules = db.query(Schedule).join(Media).all()
        
        for schedule in schedules:
            media = schedule.media
            status = "✓" if schedule.ativo else "✗"
            regiao_nome = {1: "VÍDEO", 2: "IMAGEM", 4: "TEXTO"}.get(schedule.regiao, "?")
            
            print(f"\n{status} Agendamento ID {schedule.id} - Região {schedule.regiao} ({regiao_nome})")
            print(f"   Mídia: [{media.tipo}] {media.nome} (ID: {media.id})")
            print(f"   Período: {schedule.data_inicio} a {schedule.data_fim}")
            print(f"   Horário: {schedule.hora_inicio} a {schedule.hora_fim}")
            print(f"   Dias da semana: {schedule.dias_semana}")
            print(f"   Prioridade: {schedule.prioridade}")
            
            # Verificar se está ativo agora
            dias = [int(d) for d in schedule.dias_semana.split(",")]
            
            checks = []
            checks.append(("Agendamento ativo", schedule.ativo))
            checks.append(("Mídia ativa", media.ativo))
            checks.append(("Data dentro do período", schedule.data_inicio <= current_date <= schedule.data_fim))
            checks.append(("Hora dentro do período", schedule.hora_inicio <= current_time <= schedule.hora_fim))
            checks.append(("Dia da semana correto", current_weekday in dias))
            
            print(f"   Verificações:")
            for check_name, check_result in checks:
                icon = "✓" if check_result else "✗"
                print(f"      {icon} {check_name}")
            
            all_ok = all(c[1] for c in checks)
            if all_ok:
                print(f"   >>> ESTE AGENDAMENTO ESTÁ ATIVO AGORA! <<<")
        
        print()
        print("=" * 80)
        print("RESULTADO DO get_active_content()")
        print("=" * 80)
        
        # Executar o método
        result = SchedulerService.get_active_content(db)
        
        # Exibir resultado formatado
        print()
        print("🎬 VÍDEO (Região 1):")
        if result["video"]:
            v = result["video"]
            print(f"   ✓ ID: {v['id']}")
            print(f"   ✓ Nome: {v['nome']}")
            print(f"   ✓ Arquivo: {v['caminho_arquivo']}")
            print(f"   ✓ Duração: {v['duracao']}s")
        else:
            print("   ✗ Nenhum vídeo ativo no momento")
            print()
            print("   💡 DICA: Verifique se há agendamentos de vídeo (região 1) que:")
            print("      - Estejam com status 'Ativo'")
            print("      - Incluam a data de hoje")
            print(f"      - Incluam o horário atual ({current_time.strftime('%H:%M:%S')})")
            print(f"      - Incluam o dia da semana atual ({current_weekday})")
        
        print()
        print("🖼️  IMAGEM (Região 2):")
        if result["imagem"]:
            i = result["imagem"]
            print(f"   ✓ ID: {i['id']}")
            print(f"   ✓ Nome: {i['nome']}")
            print(f"   ✓ Arquivo: {i['caminho_arquivo']}")
            print(f"   ✓ Duração: {i['duracao']}s")
        else:
            print("   ✗ Nenhuma imagem ativa no momento")
            print()
            print("   💡 DICA: Verifique se há agendamentos de imagem (região 2) que:")
            print("      - Estejam com status 'Ativo'")
            print("      - Incluam a data de hoje")
            print(f"      - Incluam o horário atual ({current_time.strftime('%H:%M:%S')})")
            print(f"      - Incluam o dia da semana atual ({current_weekday})")
        
        print()
        print("📝 TEXTO (Região 4):")
        if result["texto"]:
            t = result["texto"]
            print(f"   ✓ ID: {t['id']}")
            print(f"   ✓ Nome: {t['nome']}")
            print(f"   ✓ Texto: {t['texto']}")
            print(f"   ✓ Duração: {t['duracao']}s")
        else:
            print("   ✗ Nenhum texto ativo no momento")
        
        print()
        print(f"⏰ Timestamp: {result['timestamp']}")
        print()
        
        print("=" * 80)
        print("JSON COMPLETO")
        print("=" * 80)
        print(json.dumps(result, indent=2, default=str, ensure_ascii=False))
        print()
        
    finally:
        db.close()

if __name__ == "__main__":
    debug_scheduler()
