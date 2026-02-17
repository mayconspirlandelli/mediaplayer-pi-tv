import { useEffect, useState } from 'react';
import './WeatherRegion.css';

export default function WeatherRegion({ weather }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="weather-container">
      {/* Data e Hora no topo */}
      <div className="weather-top">
        <div className="date">{formatDate(currentTime)}</div>
        <div className="time">{formatTime(currentTime)}</div>
      </div>
      
      {/* Clima embaixo em card azul */}
      <div className="weather-bottom">
        {weather ? (
          <>
            <div className="weather-icon">{weather.emoji || '🌡️'}</div>
            <div className="weather-info">
              <div className="temperature">{Math.round(weather.temperatura)}°C</div>
              <div className="condition">{weather.descricao || weather.condicao}</div>
            </div>
            <div className="weather-details">
              <div className="weather-detail">
                <div className="weather-detail-icon">💧</div>
                <div className="weather-detail-value">{weather.umidade}%</div>
              </div>
              <div className="weather-detail">
                <div className="weather-detail-icon">🌬️</div>
                <div className="weather-detail-value">{Math.round(weather.vento)} km/h</div>
              </div>
            </div>
          </>
        ) : (
          <div className="weather-loading">Carregando clima...</div>
        )}
      </div>
    </div>
  );
}
