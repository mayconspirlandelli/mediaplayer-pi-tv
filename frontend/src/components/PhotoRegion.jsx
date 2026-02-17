import { useEffect, useState } from 'react';
import './PhotoRegion.css';

export default function PhotoRegion({ content, onImageComplete }) {
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (content) {
      setError(false);
      setImageLoaded(false);
    }
  }, [content]);

  // Quando a imagem carregar, iniciar timer baseado na duração
  useEffect(() => {
    if (!content || !imageLoaded || !onImageComplete) return;

    // Usar a duração definida no agendamento (em segundos)
    const duration = content.duracao || 10; // fallback de 10 segundos
    console.log(`🖼️ Imagem carregada: ${content.nome}, duração: ${duration}s`);
    
    const timer = setTimeout(() => {
      console.log('🖼️ Tempo da imagem acabou! Buscando próxima...');
      onImageComplete();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [content, imageLoaded, onImageComplete]);

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
        key={content.id}
        src={`/${content.caminho_arquivo}`}
        alt={content.nome}
        className={`photo-image ${imageLoaded ? 'loaded' : ''}`}
        onLoad={() => {
          console.log('🖼️ Imagem carregou:', content.nome);
          setImageLoaded(true);
        }}
        onError={() => {
          console.error('🖼️ Erro ao carregar imagem:', content.nome);
          setError(true);
        }}
      />
    </div>
  );
}
