from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, time
from typing import Optional, List
from ..database import get_db
from ..models import Schedule, Media
from ..services.scheduler import SchedulerService

router = APIRouter(prefix="/api/schedule", tags=["schedule"])

class ScheduleCreate(BaseModel):
    media_id: int
    regiao: int  # 1=video, 2=imagem, 4=texto
    data_inicio: date
    data_fim: date
    hora_inicio: time
    hora_fim: time
    duracao: int = 10  # segundos
    dias_semana: str = "0,1,2,3,4,5,6"  # 0=domingo, 6=sábado
    prioridade: int = 1
    ativo: bool = True

class ScheduleUpdate(BaseModel):
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fim: Optional[time] = None
    duracao: Optional[int] = None
    dias_semana: Optional[str] = None
    prioridade: Optional[int] = None
    ativo: Optional[bool] = None

@router.get("/")
async def list_schedules(
    regiao: Optional[int] = None,
    ativo: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Lista todos os agendamentos com filtros opcionais"""
    query = db.query(Schedule).join(Media)
    
    if regiao:
        query = query.filter(Schedule.regiao == regiao)
    if ativo is not None:
        query = query.filter(Schedule.ativo == ativo)
    
    schedules = query.order_by(
        Schedule.data_inicio.desc(),
        Schedule.hora_inicio.desc()
    ).all()
    
    return [
        {
            "id": s.id,
            "media_id": s.media_id,
            "media_nome": s.media.nome,
            "media_tipo": s.media.tipo,
            "regiao": s.regiao,
            "data_inicio": s.data_inicio.isoformat(),
            "data_fim": s.data_fim.isoformat(),
            "hora_inicio": s.hora_inicio.isoformat(),
            "hora_fim": s.hora_fim.isoformat(),
            "duracao": s.duracao,
            "dias_semana": s.dias_semana,
            "prioridade": s.prioridade,
            "ativo": s.ativo,
            "criado_em": s.criado_em.isoformat()
        }
        for s in schedules
    ]

@router.get("/{schedule_id}")
async def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um agendamento específico"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    return {
        "id": schedule.id,
        "media_id": schedule.media_id,
        "media_nome": schedule.media.nome,
        "media_tipo": schedule.media.tipo,
        "regiao": schedule.regiao,
        "data_inicio": schedule.data_inicio.isoformat(),
        "data_fim": schedule.data_fim.isoformat(),
        "hora_inicio": schedule.hora_inicio.isoformat(),
        "hora_fim": schedule.hora_fim.isoformat(),
        "duracao": schedule.duracao,
        "dias_semana": schedule.dias_semana,
        "prioridade": schedule.prioridade,
        "ativo": schedule.ativo,
        "criado_em": schedule.criado_em.isoformat()
    }

@router.post("/")
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo agendamento"""
    
    # Validar agendamento
    is_valid, error_msg = SchedulerService.validate_schedule(
        db=db,
        media_id=schedule_data.media_id,
        regiao=schedule_data.regiao,
        data_inicio=schedule_data.data_inicio,
        data_fim=schedule_data.data_fim,
        hora_inicio=schedule_data.hora_inicio,
        hora_fim=schedule_data.hora_fim
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Validar dias da semana
    try:
        dias = [int(d) for d in schedule_data.dias_semana.split(",")]
        if not all(0 <= d <= 6 for d in dias):
            raise ValueError()
    except:
        raise HTTPException(
            status_code=400,
            detail="dias_semana deve ser uma string separada por vírgulas (ex: '0,1,2,3,4,5,6')"
        )
    
    # Criar agendamento
    schedule = Schedule(
        media_id=schedule_data.media_id,
        regiao=schedule_data.regiao,
        data_inicio=schedule_data.data_inicio,
        data_fim=schedule_data.data_fim,
        hora_inicio=schedule_data.hora_inicio,
        hora_fim=schedule_data.hora_fim,
        duracao=schedule_data.duracao,
        dias_semana=schedule_data.dias_semana,
        prioridade=schedule_data.prioridade,
        ativo=schedule_data.ativo
    )
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return {
        "id": schedule.id,
        "message": "Agendamento criado com sucesso"
    }

@router.put("/{schedule_id}")
async def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um agendamento existente"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    # Atualizar campos fornecidos
    update_data = schedule_data.dict(exclude_unset=True)
    
    # Se estiver atualizando datas/horas, validar
    if any(k in update_data for k in ['data_inicio', 'data_fim', 'hora_inicio', 'hora_fim']):
        is_valid, error_msg = SchedulerService.validate_schedule(
            db=db,
            media_id=schedule.media_id,
            regiao=schedule.regiao,
            data_inicio=update_data.get('data_inicio', schedule.data_inicio),
            data_fim=update_data.get('data_fim', schedule.data_fim),
            hora_inicio=update_data.get('hora_inicio', schedule.hora_inicio),
            hora_fim=update_data.get('hora_fim', schedule.hora_fim),
            exclude_schedule_id=schedule_id
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
    
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    
    return {
        "id": schedule.id,
        "message": "Agendamento atualizado com sucesso"
    }

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Remove um agendamento"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Agendamento removido com sucesso"}

@router.get("/next/{regiao}")
async def get_next_schedules(
    regiao: int,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Retorna próximos agendamentos para uma região"""
    if regiao not in [1, 2, 4]:
        raise HTTPException(status_code=400, detail="Região deve ser 1, 2 ou 4")
    
    schedules = SchedulerService.get_next_content(db, regiao, hours)
    
    return {
        "regiao": regiao,
        "hours_ahead": hours,
        "schedules": schedules
    }

@router.get("/conflicts/{media_id}")
async def check_conflicts(
    media_id: int,
    regiao: int,
    data_inicio: date,
    data_fim: date,
    hora_inicio: time,
    hora_fim: time,
    db: Session = Depends(get_db)
):
    """Verifica se há conflitos de agendamento"""
    is_valid, error_msg = SchedulerService.validate_schedule(
        db=db,
        media_id=media_id,
        regiao=regiao,
        data_inicio=data_inicio,
        data_fim=data_fim,
        hora_inicio=hora_inicio,
        hora_fim=hora_fim
    )
    
    return {
        "valid": is_valid,
        "message": error_msg if not is_valid else "Sem conflitos"
    }

@router.put("/reorder")
async def reorder_schedules(
    updates: List[dict],
    db: Session = Depends(get_db)
):
    """Atualiza a ordem (prioridade) de múltiplos agendamentos"""
    try:
        for update in updates:
            schedule_id = update.get('id')
            new_prioridade = update.get('prioridade')
            
            if schedule_id and new_prioridade is not None:
                schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
                if schedule:
                    schedule.prioridade = new_prioridade
        
        db.commit()
        return {"message": f"{len(updates)} agendamentos reordenados com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
