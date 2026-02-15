import { useState, useEffect } from 'react';
import './PhotoRegion.css';

export default function PhotoRegion({ content }) {
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (content) {
      setError(false);
      setImageLoaded(false);
    }
  }, [content]);

  if (!content) {
    return (
      <div className="no-content">
        <div>
          <div className="icon">🖼️</div>
          <div>Nenhuma imagem agendada</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-content error">
        <div>
          <div className="icon">⚠️</div>
          <div>Erro ao carregar imagem</div>
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
      <img
        src={content.caminho_arquivo}
        alt={content.nome}
        className={`photo-image ${imageLoaded ? 'loaded' : ''}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
