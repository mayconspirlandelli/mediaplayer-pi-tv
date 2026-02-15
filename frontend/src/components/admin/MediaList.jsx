export default function MediaList({ media, onDelete }) {
  const getPreview = (m) => {
    if (m.tipo === 'video' || m.tipo === 'imagem') {
      return <img src={m.caminho_arquivo} alt={m.nome} className="media-preview" />;
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
