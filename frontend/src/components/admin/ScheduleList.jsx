export default function ScheduleList({ schedules, onDelete, onEdit }) {
  const getRegiaoNome = (regiao) => {
    return regiao === 1 ? 'Vídeo' : regiao === 2 ? 'Foto' : 'Texto';
  };

  return (
    <div className="schedule-table">
      <table>
        <thead>
          <tr>
            <th>Mídia</th>
            <th>Tipo</th>
            <th>Região</th>
            <th>Período</th>
            <th>Horário</th>
            <th>Prioridade</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(s => (
            <tr key={s.id}>
              <td>{s.media_nome}</td>
              <td>
                <span className={`type-badge ${s.media_tipo}`}>{s.media_tipo}</span>
              </td>
              <td>
                <span className={`type-badge regiao-${s.regiao}`}>{getRegiaoNome(s.regiao)}</span>
              </td>
              <td>{s.data_inicio} a {s.data_fim}</td>
              <td>{s.hora_inicio} - {s.hora_fim}</td>
              <td>{s.prioridade}</td>
              <td>
                <span className={`status ${s.ativo ? 'active' : 'inactive'}`}>
                  {s.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                <button className="btn btn-danger" onClick={() => onDelete(s.id)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
