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
  const [textoAviso, setTextoAviso] = useState('');
  const MAX_CARACTERES = 200;

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
    
    // Se for região 4, não precisa filtrar mídias (será criada automaticamente)
    if (formData.regiao === 4) {
      setFilteredMedia([]);
      setFormData(prev => ({ ...prev, media_id: '' }));
      return;
    }
    
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
    let newValue = type === 'checkbox' ? checked : value;
    
    // Converter para número se for o campo 'regiao'
    if (name === 'regiao') {
      newValue = parseInt(value, 10);
    }
    
    console.log(`🔄 Campo alterado: ${name} = ${newValue} (tipo: ${typeof newValue})`);
    
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
      let mediaId = formData.media_id;

      // Se for região 4 (texto/aviso), criar mídia de texto automaticamente
      if (formData.regiao === 4) {
        if (!textoAviso.trim()) {
          alert('Por favor, digite o texto do aviso!');
          setSaving(false);
          return;
        }

        console.log('📢 Criando mídia de texto para aviso:', textoAviso);
        const nomeAviso = `Aviso ${new Date().toLocaleString('pt-BR')}`;
        const mediaCriada = await api.createTextMedia(nomeAviso, textoAviso);
        console.log('✅ Mídia de texto criada:', mediaCriada);
        mediaId = mediaCriada.id;
      }

      const dadosAgendamento = { ...formData, media_id: mediaId };

      if (schedule) {
        console.log('✏️ Atualizando agendamento ID:', schedule.id);
        const response = await api.updateSchedule(schedule.id, dadosAgendamento);
        console.log('✅ Resposta do backend (update):', response);
      } else {
        console.log('➕ Criando novo agendamento');
        const response = await api.createSchedule(dadosAgendamento);
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
              <option value={1}>Região 1 - Vertical</option>
              <option value={2}>Região 2 - Quadrado</option>
              <option value={4}>Região 4 - Avisos</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Mídia</label>
            {formData.regiao === 4 ? (
              <div>
                <textarea
                  className="form-control"
                  value={textoAviso}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CARACTERES) {
                      setTextoAviso(e.target.value);
                    }
                  }}
                  placeholder="Digite o texto do aviso aqui..."
                  rows="4"
                  style={{resize: 'vertical', fontFamily: 'inherit'}}
                  required
                />
                <small style={{
                  display: 'block',
                  marginTop: '5px',
                  color: textoAviso.length >= MAX_CARACTERES ? '#ef4444' : '#6b7280'
                }}>
                  {textoAviso.length}/{MAX_CARACTERES} caracteres
                  {textoAviso.length >= MAX_CARACTERES && ' (limite atingido)'}
                </small>
              </div>
            ) : (
              <>
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
              </>
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
            <label>Ordem (Execução)</label>
            <input type="number" name="prioridade" className="form-control" value={formData.prioridade} onChange={handleChange} min="1" />
            <small style={{color: '#6b7280'}}>Ex: 1 executa primeiro, 2 depois, etc.</small>
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
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving || (formData.regiao === 4 ? !textoAviso.trim() : filteredMedia.length === 0)}
          >
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