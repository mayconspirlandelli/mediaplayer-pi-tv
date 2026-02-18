export default function MediaList({ media, onDelete }) {
  const getPreview = (m) => {
    if (m.tipo === 'video' || m.tipo === 'imagem') {
      return <img src={m.caminho_arquivo} alt={m.nome} className="media-preview" />;
    }
    if (m.tipo === 'youtube') {
      let videoId = '';
      const url = m.caminho_arquivo;
      if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      
      return (
        <div style={{position: 'relative'}}>
          <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt={m.nome} className="media-preview" />
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>▶️</div>
        </div>
      );
    }
    return <div className="media-preview" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px'}}>📝</div>;
  };

  return (
    <div className="media-grid">
      {media.map(m => (
        <div key={m.id} className="media-card">
          {getPreview(m)}
          <div className="media-info">
            <div className="media-name">{m.nome}</div>
            <span className={`type-badge ${m.tipo}`}>{m.tipo}</span>
            <span className={`status ${m.ativo ? 'active' : 'inactive'}`} style={{marginLeft: '10px'}}>
              {m.ativo ? 'Ativo' : 'Inativo'}
            </span>
            <div className="media-actions">
              <button className="btn btn-danger" onClick={() => onDelete(m.id)}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
