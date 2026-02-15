import { useState, useEffect } from 'react';
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
    
    return `${dayName}, ${day} ${month}`;
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="weather-container">
      <div className="weather-left">
        <div className="date">{formatDate(currentTime)}</div>
        <div className="time">{formatTime(currentTime)}</div>
      </div>
      
      <div className="weather-right">
        {weather ? (
          <>
            <div className="weather-icon">{weather.emoji || '🌡️'}</div>
            <div className="weather-info">
              <div className="temperature">{weather.temperatura}°C</div>
              <div className="condition">{weather.condicao}</div>
            </div>
          </>
        ) : (
          <div className="weather-loading">Carregando clima...</div>
        )}
      </div>
    </div>
  );
}
