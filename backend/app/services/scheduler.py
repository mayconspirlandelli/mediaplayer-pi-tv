from datetime import datetime, date, time
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models import Media, Schedule

class SchedulerService:
    @staticmethod
    def get_active_content(db: Session) -> Dict:
        """
        Retorna o conteúdo ativo para cada região no momento atual
        """
        now = datetime.now()
        current_date = now.date()
        current_time = now.time()
        current_weekday = now.weekday()  # 0=segunda, 6=domingo
        
        # Ajustar para formato 0=domingo
        current_weekday = (current_weekday + 1) % 7
        
        result = {
            "video": None,      # Região 1
            "imagem": None,       # Região 2
            "texto": None,      # Região 4
            "timestamp": now.isoformat()
        }
        
        # Buscar conteúdo para cada região
        for regiao, tipo_media in [(1, "video"), (2, "imagem"), (4, "texto")]:
            content = SchedulerService._get_content_for_region(
                db, regiao, current_date, current_time, current_weekday
            )
            
            if regiao == 1:
                result["video"] = content
            elif regiao == 2:
                result["imagem"] = content
            elif regiao == 4:
                result["texto"] = content
        
        return result
    
    @staticmethod
    def _get_content_for_region(
        db: Session, 
        regiao: int, 
        current_date: date, 
        current_time: time,
        current_weekday: int
    ) -> Optional[Dict]:
        """
        Busca conteúdo ativo para uma região específica
        """
        # Query para buscar schedules ativos
        schedules = db.query(Schedule).join(Media).filter(
            and_(
                Schedule.regiao == regiao,
                Schedule.ativo == True,
                Media.ativo == True,
                Schedule.data_inicio <= current_date,
                Schedule.data_fim >= current_date,
                Schedule.hora_inicio <= current_time,
                Schedule.hora_fim >= current_time
            )
        ).order_by(Schedule.prioridade.desc()).all()
        
        # Filtrar por dia da semana
        valid_schedules = []
        for schedule in schedules:
            dias = [int(d) for d in schedule.dias_semana.split(",")]
            if current_weekday in dias:
                valid_schedules.append(schedule)
        
        if not valid_schedules:
            return None
        
        # Retornar o de maior prioridade
        schedule = valid_schedules[0]
        media = schedule.media
        
        return {
            "id": media.id,
            "tipo": media.tipo,
            "nome": media.nome,
            "caminho_arquivo": media.caminho_arquivo if media.tipo != "texto" else None,
            "texto": media.texto if media.tipo == "texto" else None,
            "duracao": schedule.duracao,
            "schedule_id": schedule.id
        }
    
    @staticmethod
    def validate_schedule(
        db: Session,
        media_id: int,
        regiao: int,
        data_inicio: date,
        data_fim: date,
        hora_inicio: time,
        hora_fim: time,
        exclude_schedule_id: Optional[int] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Valida se um agendamento pode ser criado (verifica conflitos)
        Retorna (is_valid, error_message)
        """
        # Buscar media para validar tipo vs região
        media = db.query(Media).filter(Media.id == media_id).first()
        if not media:
            return False, "Mídia não encontrada"
        
        # Validar tipo de mídia vs região
        tipo_regiao = {
            1: "video",
            2: "imagem",
            4: "texto"
        }
        
        if tipo_regiao.get(regiao) != media.tipo:
            return False, f"Tipo de mídia '{media.tipo}' não compatível com região {regiao}"
        
        # Validar datas
        if data_fim < data_inicio:
            return False, "Data fim deve ser maior ou igual à data início"
        
        if hora_fim <= hora_inicio:
            return False, "Hora fim deve ser maior que hora início"
        
        return True, None
    
    @staticmethod
    def get_next_content(db: Session, regiao: int, hours_ahead: int = 24) -> List[Dict]:
        """
        Retorna lista de conteúdos agendados para as próximas X horas
        """
        from datetime import timedelta
        
        now = datetime.now()
        future = now + timedelta(hours=hours_ahead)
        
        schedules = db.query(Schedule).join(Media).filter(
            and_(
                Schedule.regiao == regiao,
                Schedule.ativo == True,
                Media.ativo == True,
                Schedule.data_inicio <= future.date(),
                Schedule.data_fim >= now.date()
            )
        ).order_by(Schedule.data_inicio, Schedule.hora_inicio).all()
        
        result = []
        for schedule in schedules:
            result.append({
                "schedule_id": schedule.id,
                "media_id": schedule.media.id,
                "nome": schedule.media.nome,
                "tipo": schedule.media.tipo,
                "data_inicio": schedule.data_inicio.isoformat(),
                "data_fim": schedule.data_fim.isoformat(),
                "hora_inicio": schedule.hora_inicio.isoformat(),
                "hora_fim": schedule.hora_fim.isoformat(),
                "dias_semana": schedule.dias_semana,
                "prioridade": schedule.prioridade
            })
        
        return result
