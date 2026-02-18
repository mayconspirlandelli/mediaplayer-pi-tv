import { useEffect, useState } from 'react';
import { api } from '../services/api';
import PhotoRegion from './PhotoRegion';
import './Player.css';
import TextRegion from './TextRegion';
import VideoRegion from './VideoRegion';
import WeatherRegion from './WeatherRegion';

export default function Player() {
  const [videoContent, setVideoContent] = useState(null);
  const [photoContent, setPhotoContent] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [weather, setWeather] = useState(null);

  // Estados para gatilhos de atualização independentes
  const [refreshVideoKey, setRefreshVideoKey] = useState(0);
  const [refreshPhotoKey, setRefreshPhotoKey] = useState(0);
  const [refreshTextKey, setRefreshTextKey] = useState(0);

  const refreshVideo = () => {
    console.log('🔄 Player: Solicitando atualização de VÍDEO');
    setRefreshVideoKey(prev => prev + 1);
  };
  
  const refreshPhoto = () => {
    console.log('🔄 Player: Solicitando atualização de IMAGEM');
    setRefreshPhotoKey(prev => prev + 1);
  };
  
  const refreshText = () => {
    console.log('🔄 Player: Solicitando atualização de TEXTO');
    setRefreshTextKey(prev => prev + 1);
  };

  // Buscar conteúdo de vídeo (Região 1)
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const data = await api.getActiveContentByRegion(1);
        console.log('🎬 Player: Conteúdo de VÍDEO recebido:', data);
        setVideoContent(data);
      } catch (error) {
        console.error('❌ Player: Erro ao buscar vídeo:', error);
      }
    };
    fetchVideo();
  }, [refreshVideoKey]);

  // Buscar conteúdo de imagem (Região 2)
  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const data = await api.getActiveContentByRegion(2);
        console.log('🖼️ Player: Conteúdo de IMAGEM recebido:', data);
        setPhotoContent(data);
      } catch (error) {
        console.error('❌ Player: Erro ao buscar imagem:', error);
      }
    };
    fetchPhoto();
  }, [refreshPhotoKey]);

  // Buscar conteúdo de texto (Região 4)
  useEffect(() => {
    const fetchText = async () => {
      try {
        const data = await api.getActiveContentByRegion(4);
        console.log('📝 Player: Conteúdo de TEXTO recebido:', data);
        setTextContent(data);
      } catch (error) {
        console.error('❌ Player: Erro ao buscar texto:', error);
      }
    };
    fetchText();

    // Removido o setInterval pois agora o TextRegion gerencia sua própria rotação via refreshText
  }, [refreshTextKey]);

  // Buscar clima
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await api.getWeather();
        setWeather(data);
      } catch (error) {
        console.error('❌ Player: Erro ao buscar clima:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 minutos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="player-container">
      <div className="player-grid">
        {/* REGIÃO 1: Vídeos Verticais */}
        <div className="region region-video">
          <VideoRegion key={`video-${refreshVideoKey}`} content={videoContent} onVideoEnd={refreshVideo} />
        </div>

        {/* REGIÃO 2: Imagens */}
        <div className="region region-photo">
          <PhotoRegion key={`photo-${refreshPhotoKey}`} content={photoContent} onImageComplete={refreshPhoto} />
        </div>

        {/* REGIÃO 3: Clima */}
        <div className="region region-weather">
          <WeatherRegion weather={weather} />
        </div>

        {/* REGIÃO 4: Avisos em Texto */}
        <div className="region region-text">
          <TextRegion key={`text-${refreshTextKey}`} content={textContent} onTextComplete={refreshText} />
        </div>
      </div>
    </div>
  );
}
