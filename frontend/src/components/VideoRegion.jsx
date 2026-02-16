import { useEffect, useRef, useState } from 'react';
import './VideoRegion.css';

export default function VideoRegion({ content }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!content || !video) return;

    setError(false);
    
    // Aguardar o vídeo estar pronto antes de tentar dar play
    const handleCanPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Ignorar erros de AbortError (interrupção normal)
          if (err.name !== 'AbortError') {
            console.error('Erro ao reproduzir vídeo:', err);
            setError(true);
          }
        });
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.load();

    // Cleanup: remover listener e pausar vídeo ao desmontar/trocar
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.pause();
    };
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
        <source src={`/${content.caminho_arquivo}`} type="video/mp4" />
        Seu navegador não suporta vídeo.
      </video>
    </div>
  );
}
