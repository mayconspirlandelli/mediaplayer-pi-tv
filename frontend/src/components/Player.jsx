import { useState, useEffect } from 'react';
import { api } from '../services/api';
import VideoRegion from './VideoRegion';
import PhotoRegion from './PhotoRegion';
import WeatherRegion from './WeatherRegion';
import TextRegion from './TextRegion';
import './Player.css';

export default function Player() {
  const [content, setContent] = useState(null);
  const [weather, setWeather] = useState(null);

  // Buscar conteúdo ativo
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await api.getActiveContent();
        setContent(data);
      } catch (error) {
        console.error('Erro ao buscar conteúdo:', error);
      }
    };

    fetchContent();
    const interval = setInterval(fetchContent, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Buscar clima
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await api.getWeather();
        setWeather(data);
      } catch (error) {
        console.error('Erro ao buscar clima:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Atualizar a cada 10 minutos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="player-container">
      <div className="player-grid">
        {/* REGIÃO 1: Vídeos Verticais */}
        <div className="region region-video">
          <VideoRegion content={content?.video} />
        </div>

        {/* REGIÃO 2: Fotos */}
        <div className="region region-photo">
          <PhotoRegion content={content?.foto} />
        </div>

        {/* REGIÃO 3: Clima */}
        <div className="region region-weather">
          <WeatherRegion weather={weather} />
        </div>

        {/* REGIÃO 4: Avisos em Texto */}
        <div className="region region-text">
          <TextRegion content={content?.texto} />
        </div>
      </div>
    </div>
  );
}
