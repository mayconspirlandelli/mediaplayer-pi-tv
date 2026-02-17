const API_BASE = '/api';

export const api = {
  // Player endpoints
  async getActiveContent() {
    const response = await fetch(`${API_BASE}/player/active-content`);
    return response.json();
  },

  async getWeather() {
    const response = await fetch(`${API_BASE}/player/weather`);
    return response.json();
  },

  // Media endpoints
  async getMedia() {
    const response = await fetch(`${API_BASE}/media/`);
    return response.json();
  },

  async getMediaById(id) {
    const response = await fetch(`${API_BASE}/media/${id}/`);
    return response.json();
  },

  async uploadMedia(file, tipo, nome) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    if (nome) formData.append('nome', nome);

    const response = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  async createTextMedia(nome, texto) {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('texto', texto);

    const response = await fetch(`${API_BASE}/media/text`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  async updateMedia(id, data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    const response = await fetch(`${API_BASE}/media/${id}`, {
      method: 'PUT',
      body: formData
    });
    return response.json();
  },

  async deleteMedia(id) {
    const response = await fetch(`${API_BASE}/media/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async getMediaStats() {
    const response = await fetch(`${API_BASE}/media/stats/summary`);
    return response.json();
  },

  // Schedule endpoints
  async getSchedules(regiao = null) {
    const url = regiao 
      ? `${API_BASE}/schedule/?regiao=${regiao}`
      : `${API_BASE}/schedule/`;
    const response = await fetch(url);
    return response.json();
  },

  async getScheduleById(id) {
    const response = await fetch(`${API_BASE}/schedule/${id}/`);
    return response.json();
  },

  async createSchedule(data) {
    console.log('🌐 API: Enviando POST para /api/schedule/');
    console.log('🌐 API: Dados enviados:', JSON.stringify(data, null, 2));
    
    const response = await fetch(`${API_BASE}/schedule/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('🌐 API: Status da resposta:', response.status);
    console.log('🌐 API: Dados recebidos:', result);
    
    if (!response.ok) {
      throw new Error(result.detail || 'Erro ao criar agendamento');
    }
    
    return result;
  },

  async updateSchedule(id, data) {
    const response = await fetch(`${API_BASE}/schedule/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteSchedule(id) {
    const response = await fetch(`${API_BASE}/schedule/${id}/`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async getNextSchedules(regiao, hours = 24) {
    const response = await fetch(`${API_BASE}/schedule/next/${regiao}/?hours=${hours}`);
    return response.json();
  }
};