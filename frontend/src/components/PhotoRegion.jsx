import { useEffect, useState } from 'react';
import './PhotoRegion.css';

export default function PhotoRegion({ content, onImageComplete }) {
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    console.log('🖼️ PhotoRegion: Conteúdo recebido:', content);
    if (content) {
      setError(false);
      setImageLoaded(false);
    }
  }, [content]);

  // Fallback para Erros
  useEffect(() => {
    if (!error || !onImageComplete) return;
    
    const errorTimer = setTimeout(() => {
      console.warn('⚠️ PhotoRegion: Media com error. Pulando para o próximo...');
      onImageComplete();
    }, 5000);

    return () => clearTimeout(errorTimer);
  }, [error, onImageComplete]);

  const isVideo = content?.tipo === 'video';
  const isYoutube = content?.tipo === 'youtube';

  // Quando for imagem ou YouTube, usar temporizador (YouTube não avisa o fim no iframe simples)
  useEffect(() => {
    if (!content || isVideo || !imageLoaded || !onImageComplete) return;

    const duration = content.duracao || 10;
    console.log(`🖼️ PhotoRegion (${isYoutube ? 'YouTube' : 'Imagem'}): ${content.nome}, duração: ${duration}s`);
    
    const timer = setTimeout(() => {
      onImageComplete();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [content, imageLoaded, onImageComplete, isVideo, isYoutube]);

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`;
  };

  if (!content) {
    return (
      <div className="no-content">
        <div>
          <div className="icon">🖼️</div>
          <div>Nenhuma mídia agendada</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-content error">
        <div>
          <div className="icon">⚠️</div>
          <div>Erro ao carregar mídia</div>
          <div className="small">{content.nome}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-container">
      {!imageLoaded && (
        <div className="photo-loading">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Background Blur (apenas para vídeo local ou imagem) */}
      {!isYoutube && (
        isVideo ? (
          <video
            key={`bg-vid-${content.id}`}
            src={`/${content.caminho_arquivo}`}
            className={`photo-background ${imageLoaded ? 'loaded' : ''}`}
            muted
            loop
            autoPlay
          />
        ) : (
          <img
            key={`bg-img-${content.id}`}
            src={`/${content.caminho_arquivo}`}
            alt=""
            className={`photo-background ${imageLoaded ? 'loaded' : ''}`}
          />
        )
      )}

      {/* Main Content */}
      <div className="photo-foreground">
        {isVideo ? (
          <video
            key={`fg-vid-${content.id}`}
            src={`/${content.caminho_arquivo}`}
            className={`photo-image ${imageLoaded ? 'loaded' : ''}`}
            autoPlay
            muted
            playsInline
            onLoadedData={() => setImageLoaded(true)}
            onEnded={() => onImageComplete()}
            onError={() => setError(true)}
          />
        ) : isYoutube ? (
          <iframe
            key={`fg-yt-${content.id}`}
            src={getYoutubeEmbedUrl(content.caminho_arquivo)}
            className={`photo-image ${imageLoaded ? 'loaded' : ''}`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => setImageLoaded(true)}
            allow="autoplay; encrypted-media"
            title={content.nome}
          />
        ) : (
          <img
            key={`fg-img-${content.id}`}
            src={`/${content.caminho_arquivo}`}
            alt={content.nome}
            className={`photo-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>
    </div>
  );
}
