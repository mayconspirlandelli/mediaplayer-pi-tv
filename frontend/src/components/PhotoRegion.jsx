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
      console.warn('⚠️ PhotoRegion: Media com erro. Pulando para o próximo...');
      onImageComplete();
    }, 5000);

    return () => clearTimeout(errorTimer);
  }, [error, onImageComplete]);

  const isVideo = content?.tipo === 'video';

  // Quando for imagem, usar temporizador
  useEffect(() => {
    if (!content || isVideo || !imageLoaded || !onImageComplete) return;

    const duration = content.duracao || 10;
    console.log(`🖼️ PhotoRegion (Imagem): ${content.nome}, duração: ${duration}s`);
    
    const timer = setTimeout(() => {
      onImageComplete();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [content, imageLoaded, onImageComplete, isVideo]);

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
      
      {/* Background Blur */}
      {isVideo ? (
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
