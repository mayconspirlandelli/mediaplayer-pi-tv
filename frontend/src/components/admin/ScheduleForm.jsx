import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function ScheduleForm({ media, schedule, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    media_id: '',
    regiao: 1,
    data_inicio: '',
    data_fim: '',
    hora_inicio: '08:00',
    hora_fim: '18:00',
    duracao: 10,
    dias_semana: '0,1,2,3,4,5,6',
    prioridade: 1,
    ativo: true
  });
  const [saving, setSaving] = useState(false);
  const [filteredMedia, setFilteredMedia] = useState([]);

  useEffect(() => {
    if (schedule) {
      setFormData({
        media_id: schedule.media_id,
        regiao: schedule.regiao,
        data_inicio: schedule.data_inicio,
        data_fim: schedule.data_fim,
        hora_inicio: schedule.hora_inicio,
        hora_fim: schedule.hora_fim,
        duracao: schedule.duracao,
        dias_semana: schedule.dias_semana,
        prioridade: schedule.prioridade,
        ativo: schedule.ativo
      });
    }
  }, [schedule]);

  useEffect(() => {
    const tipoRegiao = { 1: 'video', 2: 'imagem', 4: 'texto' };
    const filtered = media.filter(m => m.tipo === tipoRegiao[formData.regiao] && m.ativo);
    setFilteredMedia(filtered);
    
    if (filtered.length > 0 && !formData.media_id) {
      setFormData(prev => ({ ...prev, media_id: filtered[0].id }));
    }
  }, [formData.regiao, media]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (schedule) {
        await api.updateSchedule(schedule.id, formData);
      } else {
        await api.createSchedule(formData);
      }
      alert('Agendamento salvo com sucesso!');
      if (onSaved) onSaved();
    } catch (error) {
      alert('Erro ao salvar: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Região</label>
            <select name="regiao" className="form-control" value={formData.regiao} onChange={handleChange}>
              <option value={1}>Região 1 - Vídeo</option>
              <option value={2}>Região 2 - Foto</option>
              <option value={4}>Região 4 - Texto</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mídia</label>
            <select name="media_id" className="form-control" value={formData.media_id} onChange={handleChange} required>
              {filteredMedia.length === 0 && <option>Nenhuma mídia disponível</option>}
              {filteredMedia.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Data Início</label>
            <input type="date" name="data_inicio" className="form-control" value={formData.data_inicio} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Data Fim</label>
            <input type="date" name="data_fim" className="form-control" value={formData.data_fim} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Hora Início</label>
            <input type="time" name="hora_inicio" className="form-control" value={formData.hora_inicio} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Hora Fim</label>
            <input type="time" name="hora_fim" className="form-control" value={formData.hora_fim} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Duração (segundos) {formData.regiao !== 1 ? '' : '(não usado para vídeos)'}</label>
            <input type="number" name="duracao" className="form-control" value={formData.duracao} onChange={handleChange} min="1" />
          </div>

          <div className="form-group">
            <label>Prioridade (1-10)</label>
            <input type="number" name="prioridade" className="form-control" value={formData.prioridade} onChange={handleChange} min="1" max="10" />
          </div>
        </div>

        <div className="form-group">
          <label>Dias da Semana</label>
          <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, index) => {
              const dias = formData.dias_semana.split(',').map(Number);
              const isChecked = dias.includes(index);
              
              return (
                <label key={index} style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      let newDias = [...dias];
                      if (e.target.checked) {
                        newDias.push(index);
                      } else {
                        newDias = newDias.filter(d => d !== index);
                      }
                      setFormData(prev => ({ ...prev, dias_semana: newDias.sort().join(',') }));
                    }}
                  />
                  {dia}
                </label>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} />
            Agendamento Ativo
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || filteredMedia.length === 0}>
            {saving ? 'Salvando...' : '✓ Salvar'}
          </button>
          <button type="button" className="btn" onClick={onCancel} style={{background: '#e2e8f0'}}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
