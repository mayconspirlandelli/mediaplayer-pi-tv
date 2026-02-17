import { useEffect, useState } from 'react';
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
    const tipoEsperado = tipoRegiao[formData.regiao];
    
    console.log('🔍 Filtrando mídias para região:', formData.regiao);
    console.log('🔍 Tipo esperado:', tipoEsperado);
    
    const filtered = media.filter(m => {
      const isCompativel = m.tipo === tipoEsperado && m.ativo;
      console.log(`  - Mídia "${m.nome}" (tipo: ${m.tipo}): ${isCompativel ? '✅ compatível' : '❌ incompatível'}`);
      return isCompativel;
    });
    
    console.log('🔍 Total de mídias compatíveis:', filtered.length);
    setFilteredMedia(filtered);
    
    // Se mudou a região ou não tem mídia selecionada, selecionar a primeira disponível
    if (filtered.length > 0) {
      const mediaSelecionadaValida = filtered.find(m => m.id === formData.media_id);
      if (!mediaSelecionadaValida) {
        console.log('🔄 Selecionando automaticamente primeira mídia compatível:', filtered[0].nome);
        setFormData(prev => ({ ...prev, media_id: filtered[0].id }));
      }
    } else {
      console.warn('⚠️ Nenhuma mídia compatível encontrada!');
      setFormData(prev => ({ ...prev, media_id: '' }));
    }
  }, [formData.regiao, media]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    console.log(`🔄 Campo alterado: ${name} = ${newValue}`);
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    console.log('📝 Dados do formulário antes de enviar:', formData);
    console.log('📝 Região selecionada:', formData.regiao);
    console.log('📝 Mídia selecionada:', formData.media_id);
    console.log('📝 Duração:', formData.duracao, 'segundos');
    console.log('📝 Ordem (prioridade):', formData.prioridade);

    try {
      if (schedule) {
        console.log('✏️ Atualizando agendamento ID:', schedule.id);
        const response = await api.updateSchedule(schedule.id, formData);
        console.log('✅ Resposta do backend (update):', response);
      } else {
        console.log('➕ Criando novo agendamento');
        const response = await api.createSchedule(formData);
        console.log('✅ Resposta do backend (create):', response);
      }
      alert('Agendamento salvo com sucesso!');
      if (onSaved) onSaved();
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
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
              <option value={2}>Região 2 - Imagem</option>
              <option value={4}>Região 4 - Texto</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Mídia</label>
            <select name="media_id" className="form-control" value={formData.media_id} onChange={handleChange} required>
              {filteredMedia.length === 0 && <option value="">Nenhuma mídia disponível para esta região</option>}
              {filteredMedia.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.tipo})
                </option>
              ))}
            </select>
            {filteredMedia.length === 0 && (
              <small style={{color: '#f59e0b', display: 'block', marginTop: '5px'}}>
                ⚠️ Faça upload de uma mídia do tipo correto primeiro
              </small>
            )}
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