// Stats.jsx
export default function Stats({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Total</div>
        <div className="stat-number">{stats.total}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Vídeos</div>
        <div className="stat-number">{stats.videos}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Imagens</div>
        <div className="stat-number">{stats.imagens}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Textos</div>
        <div className="stat-number">{stats.textos}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Ativos</div>
        <div className="stat-number" style={{color: '#10b981'}}>{stats.ativos}</div>
      </div>
    </div>
  );
}
