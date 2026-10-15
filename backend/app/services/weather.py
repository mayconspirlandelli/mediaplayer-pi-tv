import httpx
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
from ..models import WeatherCache

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY", "")
        self.city = os.getenv("WEATHER_CITY", "Aparecida de Goiania")
        self.country = os.getenv("WEATHER_COUNTRY", "BR")
        self.update_interval = int(os.getenv("WEATHER_UPDATE_INTERVAL", "600"))  # 10 minutos
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"
        
    async def get_weather(self, db: Session) -> Dict:
        """
        Obtém dados do clima da API ou do cache
        """
        # Verifica cache primeiro
        cached = self._get_from_cache(db)
        if cached:
            return cached
        
        # Se não tem cache válido, busca da API
        try:
            weather_data = await self._fetch_from_api()
            if weather_data:
                self._save_to_cache(db, weather_data)
                return weather_data
            elif cached:  # Se API falhar, retorna cache antigo
                return cached
        except Exception as e:
            print(f"Erro ao buscar clima: {e}")
            if cached:
                return cached
        
        return self._get_fallback_data()
    
    def _get_from_cache(self, db: Session) -> Optional[Dict]:
        """
        Busca dados do cache se ainda válidos
        """
        cache = db.query(WeatherCache).filter(
            WeatherCache.cidade == self.city
        ).order_by(WeatherCache.data_cache.desc()).first()
        
        if cache:
            # Verifica se cache ainda é válido
            age = datetime.utcnow() - cache.data_cache
            if age.total_seconds() < self.update_interval:
                return {
                    "temperatura": cache.temperatura,
                    "condicao": cache.condicao,
                    "icone": cache.icone,
                    "cidade": cache.cidade,
                    "cached": True,
                    "cache_age": int(age.total_seconds())
                }
        return None
    
    async def _fetch_from_api(self) -> Optional[Dict]:
        """
        Busca dados da API OpenWeatherMap (no Raspberry Pi, busca do servidor central)
        """
        sync_url = os.getenv("SYNC_URL", "").rstrip("/")
        if sync_url:
            return await self._fetch_from_server(sync_url)

        if not self.api_key or self.api_key == "your_api_key_here":
            return None
        
        params = {
            "q": f"{self.city},{self.country}",
            "appid": self.api_key,
            "units": "metric",
            "lang": "pt_br"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, params=params, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "temperatura": int(data["main"]["temp"]),
                    "condicao": data["weather"][0]["description"].capitalize(),
                    "icone": data["weather"][0]["icon"],
                    "cidade": data["name"],
                    "cached": False,
                    "dados_completos": data
                }
        
        return None
    
    async def _fetch_from_server(self, sync_url: str) -> Optional[Dict]:
        """
        Busca o clima já consultado pelo servidor central (modo Raspberry Pi)
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{sync_url}/api/player/weather", timeout=10.0)

        if response.status_code == 200:
            data = response.json()
            if not data.get("fallback"):
                return {
                    "temperatura": data["temperatura"],
                    "condicao": data["condicao"],
                    "icone": data["icone"],
                    "cidade": data["cidade"],
                    "cached": False,
                }

        return None

    def _save_to_cache(self, db: Session, weather_data: Dict):
        """
        Salva dados no cache do banco
        """
        cache = WeatherCache(
            cidade=weather_data.get("cidade", self.city),
            temperatura=weather_data["temperatura"],
            condicao=weather_data["condicao"],
            icone=weather_data["icone"],
            dados_completos=weather_data.get("dados_completos", {}),
            data_cache=datetime.utcnow()
        )
        db.add(cache)
        db.commit()
    
    def _get_fallback_data(self) -> Dict:
        """
        Retorna dados padrão quando não há cache nem API disponível
        """
        return {
            "temperatura": 25,
            "condicao": "Clima indisponível",
            "icone": "01d",
            "cidade": self.city,
            "cached": False,
            "fallback": True
        }
    
    def get_icon_emoji(self, icon_code: str) -> str:
        """
        Converte código de ícone em emoji
        """
        icon_map = {
            "01d": "☀️", "01n": "🌙",
            "02d": "⛅", "02n": "☁️",
            "03d": "☁️", "03n": "☁️",
            "04d": "☁️", "04n": "☁️",
            "09d": "🌧️", "09n": "🌧️",
            "10d": "🌦️", "10n": "🌧️",
            "11d": "⛈️", "11n": "⛈️",
            "13d": "❄️", "13n": "❄️",
            "50d": "🌫️", "50n": "🌫️",
        }
        return icon_map.get(icon_code, "🌡️")
