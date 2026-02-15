import { useState, useEffect, useRef } from 'react';
import './VideoRegion.css';

export default function VideoRegion({ content }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (content && videoRef.current) {
      setError(false);
      videoRef.current.load();
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Erro ao reproduzir vídeo:', err);
          setError(true);
        });
      }
    }
  }, [content]);

  if (!content) {
    return (
      <div className="no-content">
        <div>
          <div className="icon">🎬</div>
          <div>Nenhum vídeo agendado</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-content error">
        <div>
          <div className="icon">⚠️</div>
          <div>Erro ao carregar vídeo</div>
          <div className="small">{content.nome}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-player"
        autoPlay
        loop
        muted
        playsInline
        onError={() => setError(true)}
      >
        <source src={content.caminho_arquivo} type="video/mp4" />
        Seu navegador não suporta vídeo.
      </video>
    </div>
  );
}
