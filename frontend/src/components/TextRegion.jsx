import { useEffect, useRef, useState } from 'react';
import './TextRegion.css';

export default function TextRegion({ content, onTextComplete }) {
  const textRef = useRef(null);

  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = textRef.current.parentElement.clientWidth;
        setIsScrolling(textWidth > containerWidth);
      }
    };

    // Pequeno delay para garantir que o CSS e fontes foram aplicados
    const timer = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [content]);

  // Timer para rotação de texto
  useEffect(() => {
    if (!content || !onTextComplete) return;

    const duration = content.duracao || 10;
    console.log(`📝 Texto exibindo: "${content.nome}", duração: ${duration}s`);

    const timer = setTimeout(() => {
      console.log('📝 Tempo do texto acabou! Buscando próximo...');
      onTextComplete();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [content, onTextComplete]);

  if (!content) {
    return (
      <div className="text-container">
        <div className="text-label">📢 Avisos</div>
        <div className="text-content-wrapper">
          <div className="text-content no-text">
            Sem avisos no momento
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-container">
      <div className="text-label">📢 Avisos</div>
      <div className="text-content-wrapper">
        <div className={`text-content ${isScrolling ? 'scrolling' : ''}`} ref={textRef}>
          {content.texto}
        </div>
      </div>
    </div>
  );
}
