import { useEffect, useRef, useState } from 'react';
import './VideoRegion.css';

export default function VideoRegion({ content, onVideoEnd }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!content || !video) return;

    setError(false);
    
    // Quando o vídeo terminar, notificar o Player para buscar próximo conteúdo
    const handleEnded = () => {
      console.log('🎬 Vídeo terminou! Buscando próximo...');
      if (onVideoEnd) {
        onVideoEnd();
      }
    };
    
    // Aguardar o vídeo estar pronto antes de tentar dar play
    const handleCanPlay = () => {
      console.log('🎬 Vídeo pronto para reproduzir');
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

    // Log adicional para debug
    video.addEventListener('loadedmetadata', () => {
      console.log('🎬 Metadados carregados. Duração:', video.duration, 'segundos');
    });

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.load();

    // Cleanup: remover listeners e pausar vídeo ao desmontar/trocar
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', () => {});
      video.pause();
    };
  }, [content, onVideoEnd]);

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
        key={content.id}
        ref={videoRef}
        className="video-player"
        autoPlay
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
