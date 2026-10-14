import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import './Player.css';
import TextRegion from './TextRegion';
import UniversalRegion from './UniversalRegion';
import WeatherRegion from './WeatherRegion';

// Tamanho de projeto do layout; a tela é escalada para caber em qualquer TV
const STAGE_WIDTH = 2048;
const STAGE_HEIGHT = 1080;

function getStageTransform() {
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  const offsetX = (window.innerWidth - STAGE_WIDTH * scale) / 2;
  const offsetY = (window.innerHeight - STAGE_HEIGHT * scale) / 2;
  return `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

export default function Player() {
  const [verticalContent, setVerticalContent] = useState(null);
  const [horizontalContent, setHorizontalContent] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [weather, setWeather] = useState(null);
  const [stageTransform, setStageTransform] = useState(getStageTransform);

  useEffect(() => {
    const onResize = () => setStageTransform(getStageTransform());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Estados para gatilhos de atualização independentes
  const [refreshVerticalKey, setRefreshVerticalKey] = useState(0);
  const [refreshHorizontalKey, setRefreshHorizontalKey] = useState(0);
  const [refreshTextKey, setRefreshTextKey] = useState(0);

  const refreshVertical = useCallback(() => {
    console.log('🔄 Player: Solicitando atualização REGIONAL VERTICAL (Região 1)');
    setRefreshVerticalKey(prev => prev + 1);
  }, []);

  const refreshHorizontal = useCallback(() => {
    console.log('🔄 Player: Solicitando atualização REGIONAL HORIZONTAL (Região 2)');
    setRefreshHorizontalKey(prev => prev + 1);
  }, []);

  const refreshText = useCallback(() => {
    console.log('🔄 Player: Solicitando atualização de TEXTO (Região 4)');
    setRefreshTextKey(prev => prev + 1);
  }, []);

  // Buscar conteúdo VERTICAL (Região 1)
  useEffect(() => {
    const fetchVertical = async () => {
      try {
        const data = await api.getActiveContentByRegion(1);
        console.log('🎬 Player: Conteúdo VERTICAL recebido:', data);
        setVerticalContent(data);
      } catch (error) {
        console.error('❌ Player: Erro ao buscar vertical:', error);
      }
    };
    fetchVertical();
  }, [refreshVerticalKey]);

  // Buscar conteúdo HORIZONTAL (Região 2)
  useEffect(() => {
    const fetchHorizontal = async () => {
      try {
        const data = await api.getActiveContentByRegion(2);
        console.log('🖼️ Player: Conteúdo HORIZONTAL recebido:', data);
        setHorizontalContent(data);
      } catch (error) {
        console.error('❌ Player: Erro ao buscar horizontal:', error);
      }
    };
    fetchHorizontal();
  }, [refreshHorizontalKey]);

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
  }, [refreshTextKey]);

  // Efeito de polling para regiões vazias ou verificação periódica
  useEffect(() => {
    const checkStatus = () => {
      if (!verticalContent) refreshVertical();
      if (!horizontalContent) refreshHorizontal();
      if (!textContent) refreshText();
    };

    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [verticalContent, horizontalContent, textContent, refreshVertical, refreshHorizontal, refreshText]);

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
    <div className="player-stage">
      <div className="player-container" style={{ transform: stageTransform }}>
        <div className="player-grid">
          {/* REGIÃO 1: Formato Vertical */}
          <div className="region region-vertical">
            <UniversalRegion
              key={`vertical-${refreshVerticalKey}-${verticalContent?.id || 'none'}`}
              content={verticalContent}
              onComplete={refreshVertical}
              regionName="Vertical"
            />
          </div>

          {/* REGIÃO 2: Formato Horizontal */}
          <div className="region region-horizontal">
            <UniversalRegion
              key={`horizontal-${refreshHorizontalKey}-${horizontalContent?.id || 'none'}`}
              content={horizontalContent}
              onComplete={refreshHorizontal}
              regionName="Horizontal"
            />
          </div>

          {/* REGIÃO 3: Clima */}
          <div className="region region-weather">
            <WeatherRegion weather={weather} />
          </div>

          {/* REGIÃO 4: Avisos em Texto */}
          <div className="region region-text">
            <TextRegion
              key={`text-${refreshTextKey}-${textContent?.id || 'none'}`}
              content={textContent}
              onTextComplete={refreshText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
