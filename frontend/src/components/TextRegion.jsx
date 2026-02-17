import { useEffect, useRef } from 'react';
import './TextRegion.css';

export default function TextRegion({ content }) {
  const textRef = useRef(null);

  useEffect(() => {
    if (content && textRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = textRef.current.parentElement.clientWidth;
      
      if (textWidth > containerWidth) {
        textRef.current.classList.add('scrolling');
      } else {
        textRef.current.classList.remove('scrolling');
      }
    }
  }, [content]);

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
        <div className="text-content" ref={textRef}>
          {content.texto}
        </div>
      </div>
    </div>
  );
}
