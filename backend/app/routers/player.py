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
