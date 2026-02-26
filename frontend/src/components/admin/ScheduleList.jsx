import { useState } from 'react';
import { api } from '../../services/api';

export default function ScheduleList({ schedules, onDelete, onEdit }) {
  const [sortColumn, setSortColumn] = useState('prioridade');
  const [sortDirection, setSortDirection] = useState('asc');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const getRegiaoNome = (regiao) => {
    if (regiao === 1) return 'Vertical';
    if (regiao === 2) return 'Horizontal';
    return 'Texto';
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Se clicar na mesma coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se clicar em coluna diferente, ordena ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedSchedules = () => {
    if (!sortColumn) return schedules;

    const sorted = [...schedules].sort((a, b) => {
      let valueA, valueB;

      switch (sortColumn) {
        case 'media':
          valueA = a.media_nome.toLowerCase();
          valueB = b.media_nome.toLowerCase();
          break;
        case 'tipo':
          valueA = a.media_tipo.toLowerCase();
          valueB = b.media_tipo.toLowerCase();
          break;
        case 'regiao':
          valueA = a.regiao;
          valueB = b.regiao;
          break;
        case 'data_inicio':
          valueA = new Date(a.data_inicio);
          valueB = new Date(b.data_inicio);
          break;
        case 'hora_inicio':
          valueA = a.hora_inicio;
          valueB = b.hora_inicio;
          break;
        case 'prioridade':
          valueA = a.prioridade;
          valueB = b.prioridade;
          break;
        case 'status':
          valueA = a.ativo ? 1 : 0;
          valueB = b.ativo ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleDragStart = (e, schedule) => {
    console.log('🎯 Drag Start:', schedule.media_nome);
    setDraggedItem(schedule);

    // Essencial para o Firefox e para definir o que está sendo movido
    e.dataTransfer.setData('text/plain', schedule.id.toString());
    e.dataTransfer.effectAllowed = 'move';

    // Adicionar classe visual à linha arrastada (opcional, via pointer-events ou opacity)
  };

  const handleDragEnter = (e, schedule) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== schedule.id) {
      // Opcional: só marcar como over se for da mesma região
      if (draggedItem.regiao === schedule.regiao) {
        setDragOverItem(schedule);
      }
    }
  };

  const handleDragOver = (e, schedule) => {
    e.preventDefault(); // Necessário para permitir o drop

    if (draggedItem && draggedItem.id !== schedule.id) {
      if (draggedItem.regiao === schedule.regiao) {
        e.dataTransfer.dropEffect = 'move';
        // Garantir que o estado de over está sincronizado
        if (!dragOverItem || dragOverItem.id !== schedule.id) {
          setDragOverItem(schedule);
        }
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    }
  };

  const handleDragLeave = (e) => {
    // Só limpar se estivermos realmente saindo da linha
    // setDragOverItem(null);
  };

  const handleDrop = async (e, targetSchedule) => {
    e.preventDefault();
    setDragOverItem(null);

    console.log('📍 Drop em:', targetSchedule.media_nome);

    if (!draggedItem || draggedItem.id === targetSchedule.id) {
      setDraggedItem(null);
      return;
    }

    // Verifica se são da mesma região
    if (draggedItem.regiao !== targetSchedule.regiao) {
      console.log('⚠️ Regiões diferentes, ignorando drop');
      setDraggedItem(null);
      return;
    }

    // Filtrar e ordenar agendamentos da mesma região para calcular novas prioridades
    const sameRegionSchedules = schedules
      .filter(s => s.regiao === draggedItem.regiao)
      .sort((a, b) => a.prioridade - b.prioridade);

    const draggedIndex = sameRegionSchedules.findIndex(s => s.id === draggedItem.id);
    const targetIndex = sameRegionSchedules.findIndex(s => s.id === targetSchedule.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // Gerar novo array com a ordem alterada
    const reordered = [...sameRegionSchedules];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Mapear para o formato esperado pela API (id e nova prioridade)
    const updates = reordered.map((schedule, index) => ({
      id: schedule.id,
      prioridade: index + 1
    }));

    console.log('💾 Enviando reordenação para API:', updates);

    try {
      await api.reorderSchedules(updates);
      console.log('✅ Reordenação concluída com sucesso');
      // Em vez de reload total, o componente pai deveria recarregar os dados
      // Mas como não temos essa prop, vamos manter o reload ou emitir evento
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erro ao reordenar:', error);
      alert('Erro ao reordenar: ' + error.message);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const sortedSchedules = getSortedSchedules();

  return (
    <div className="schedule-table">
      <div style={{
        padding: '10px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        marginBottom: '10px',
        fontSize: '14px',
        color: '#1565c0'
      }}>
        💡 <strong>Dica:</strong> Arraste as linhas (⋮⋮) para reordenar os agendamentos da mesma região
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th onClick={() => handleSort('media')} style={{ cursor: 'pointer' }}>
              Mídia{getSortIcon('media')}
            </th>
            <th onClick={() => handleSort('tipo')} style={{ cursor: 'pointer' }}>
              Tipo{getSortIcon('tipo')}
            </th>
            <th onClick={() => handleSort('regiao')} style={{ cursor: 'pointer' }}>
              Região{getSortIcon('regiao')}
            </th>
            <th onClick={() => handleSort('data_inicio')} style={{ cursor: 'pointer' }}>
              Período{getSortIcon('data_inicio')}
            </th>
            <th onClick={() => handleSort('hora_inicio')} style={{ cursor: 'pointer' }}>
              Horário{getSortIcon('hora_inicio')}
            </th>
            <th onClick={() => handleSort('prioridade')} style={{ cursor: 'pointer' }}>
              Ordem{getSortIcon('prioridade')}
            </th>
            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
              Status{getSortIcon('status')}
            </th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedSchedules.map((s, index) => (
            <tr
              key={`${s.id}-${index}`}
              onDragEnter={(e) => handleDragEnter(e, s)}
              onDragOver={(e) => handleDragOver(e, s)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, s)}
              style={{
                opacity: draggedItem?.id === s.id ? 0.5 : 1,
                backgroundColor: dragOverItem?.id === s.id ? '#e3f2fd' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <td
                draggable
                onDragStart={(e) => handleDragStart(e, s)}
                onDragEnd={handleDragEnd}
                style={{
                  cursor: 'grab',
                  textAlign: 'center',
                  fontSize: '18px',
                  color: '#666',
                  userSelect: 'none'
                }}
              >
                ⋮⋮
              </td>
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
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn btn-primary" onClick={() => onEdit(s)} style={{ padding: '5px 10px', fontSize: '14px' }}>
                    ✏️
                  </button>
                  <button className="btn btn-danger" onClick={() => onDelete(s.id)} style={{ padding: '5px 10px', fontSize: '14px' }}>
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
