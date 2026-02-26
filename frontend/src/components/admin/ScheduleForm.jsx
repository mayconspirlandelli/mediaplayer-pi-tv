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


  // Efeito unificado para carregar dados e filtrar mídias
  useEffect(() => {
    // 1. Definir os tipos permitidos com base na região atual
    const tiposPermitidosPorRegiao = {
      1: ['video', 'imagem', 'youtube', 'link'],
      2: ['video', 'imagem', 'youtube', 'link'],
      4: ['texto']
    };

    // 2. Se temos um agendamento (MODO EDIÇÃO)
    if (schedule) {
      console.log('✏️ ScheduleForm: Carregando agendamento (ID:', schedule.id, ')');

      const currentRegiao = parseInt(schedule.regiao, 10);
      const currentMediaId = parseInt(schedule.media_id, 10);
      const tipos = tiposPermitidosPorRegiao[currentRegiao] || [];

      // Filtrar mídias compatíveis
      const filtered = media.filter(m => tipos.includes(m.tipo) && m.ativo);
      setFilteredMedia(filtered);

      // Atualizar formulário com dados do agendamento
      setFormData({
        media_id: currentMediaId,
        regiao: currentRegiao,
        data_inicio: schedule.data_inicio,
        data_fim: schedule.data_fim,
        hora_inicio: schedule.hora_inicio,
        hora_fim: schedule.hora_fim,
        duracao: schedule.duracao,
        dias_semana: schedule.dias_semana,
        prioridade: schedule.prioridade,
        ativo: schedule.ativo
      });

      // Carregar texto se for região 4
      if (currentRegiao === 4) {
        const mediaObj = media.find(m => m.id === currentMediaId);
        if (mediaObj) setTextoAviso(mediaObj.texto || '');
      }
    }
    // 3. Se NÃO temos agendamento (MODO NOVO)
    else {
      console.log('➕ ScheduleForm: Modo Novo Agendamento');

      const defaultRegiao = formData.regiao || 1;
      const tipos = tiposPermitidosPorRegiao[defaultRegiao] || [];
      const filtered = media.filter(m => tipos.includes(m.tipo) && m.ativo);
      setFilteredMedia(filtered);

      // Só resetar campos de data/hora se o form estiver vazio
      if (!formData.data_inicio) {
        setFormData(prev => ({
          ...prev,
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: new Date().toISOString().split('T')[0],
          media_id: filtered.length > 0 ? filtered[0].id : ''
        }));
      } else if (formData.regiao !== 4 && filtered.length > 0 && !filtered.some(m => m.id === formData.media_id)) {
        // Se mudou de região e a mídia atual não serve, pega a primeira
        setFormData(prev => ({ ...prev, media_id: filtered[0].id }));
      }
    }
  }, [schedule, media, formData.regiao]); // Re-executa se o agendamento mudar ou a região for trocada manualmente

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // Converter para número se for o campo 'regiao' ou 'media_id'
    if (name === 'regiao' || name === 'media_id') {
      newValue = parseInt(value, 10);
    }

    console.log(`🔄 ScheduleForm: Campo alterado: ${name} = ${newValue} (tipo: ${typeof newValue})`);

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
    console.log('📝 Ordem:', formData.prioridade);

    try {
      let mediaId = formData.media_id;

      // Se for região 4 (texto/aviso), gerenciar mídia de texto
      if (formData.regiao === 4) {
        if (!textoAviso.trim()) {
          alert('Por favor, digite o texto do aviso!');
          setSaving(false);
          return;
        }

        if (schedule && schedule.media_id) {
          console.log('📢 Atualizando mídia de texto existente ID:', schedule.media_id);
          await api.updateMedia(schedule.media_id, {
            texto: textoAviso,
            nome: `Aviso (Editado) ${new Date().toLocaleDateString('pt-BR')}`
          });
          mediaId = schedule.media_id;
        } else {
          console.log('📢 Criando nova mídia de texto para aviso:', textoAviso);
          const nomeAviso = `Aviso ${new Date().toLocaleString('pt-BR')}`;
          const mediaCriada = await api.createTextMedia(nomeAviso, textoAviso);
          console.log('✅ Mídia de texto criada:', mediaCriada);
          mediaId = mediaCriada.id;
        }
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
              <option value={2}>Região 2 - Horizontal</option>
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
                    const text = e.target.value;
                    if (text.length <= MAX_CARACTERES) {
                      setTextoAviso(text);
                    } else {
                      // Truncar para o limite máximo se ultrapassar (ex: no colar)
                      setTextoAviso(text.substring(0, MAX_CARACTERES));
                    }
                  }}
                  autoFocus={!!schedule}
                  placeholder="Digite o texto do aviso aqui..."
                  rows="4"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
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
                  <small style={{ color: '#f59e0b', display: 'block', marginTop: '5px' }}>
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
            <label>
              Duração (segundos)
              {formData.regiao === 1 && filteredMedia.find(m => m.id === formData.media_id)?.tipo === 'video'
                ? ' (usado apenas se houver mais de um vídeo)'
                : ''}
            </label>
            <input type="number" name="duracao" className="form-control" value={formData.duracao} onChange={handleChange} min="1" />
          </div>

          <div className="form-group">
            <label>Ordem (Execução)</label>
            <input type="number" name="prioridade" className="form-control" value={formData.prioridade} onChange={handleChange} min="1" />
            <small style={{ color: '#6b7280' }}>Ex: 1 executa primeiro, 2 depois, etc.</small>
          </div>
        </div>

        <div className="form-group">
          <label>Dias da Semana</label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, index) => {
              const dias = formData.dias_semana.split(',').map(Number);
              const isChecked = dias.includes(index);

              return (
                <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <button type="button" className="btn" onClick={onCancel} style={{ background: '#e2e8f0' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}