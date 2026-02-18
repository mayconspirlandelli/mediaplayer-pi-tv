from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.weather import WeatherService
from ..services.scheduler import SchedulerService

router = APIRouter(prefix="/api/player", tags=["player"])

weather_service = WeatherService()

@router.get("/active-content")
async def get_active_content(db: Session = Depends(get_db)):
    """
    Retorna o conteúdo ativo para exibição no player
    """
    content = SchedulerService.get_active_content(db)
    return content

@router.get("/active-content/region/{regiao}")
async def get_active_content_by_region(regiao: int, db: Session = Depends(get_db)):
    """
    Retorna o conteúdo ativo para uma região específica
    """
    from datetime import datetime
    now = datetime.now()
    current_date = now.date()
    current_time = now.time()
    current_weekday = (now.weekday() + 1) % 7
    
    content = SchedulerService._get_content_for_region(
        db, regiao, current_date, current_time, current_weekday
    )
    return content

@router.get("/weather")
async def get_weather(db: Session = Depends(get_db)):
    """
    Retorna dados do clima atual
    """
    weather_data = await weather_service.get_weather(db)
    
    # Adicionar emoji do ícone
    if weather_data.get("icone"):
        weather_data["emoji"] = weather_service.get_icon_emoji(weather_data["icone"])
    
    return weather_data

@router.get("/health")
async def health_check():
    """
    Verifica se o serviço está funcionando
    """
    return {
        "status": "ok",
        "service": "mediaplayer-api"
    }
