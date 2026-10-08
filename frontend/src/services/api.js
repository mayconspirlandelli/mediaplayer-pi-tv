const API_BASE = '/api';
const TOKEN_KEY = 'mediaplayer_token';

export const auth = {
  getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* sem storage */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* sem storage */ }
  },
  async login(username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Falha no login');
    auth.setToken(result.token);
    return result;
  },
  logout() {
    auth.clear();
    window.dispatchEvent(new Event('auth:logout'));
  }
};

// fetch com token Bearer; em 401 desloga e manda o usuário para a tela de login
async function authFetch(url, options = {}) {
  const token = auth.getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    auth.logout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  return response;
}

// Lê o JSON e lança erro com a mensagem do backend quando a resposta não é 2xx
async function parseResponse(response) {
  const result = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(result.detail)
      ? result.detail.map(d => d.msg).join('; ')
      : result.detail;
    throw new Error(detail || 'Erro na requisição');
  }
  return result;
}

export const api = {
  // Player endpoints
  async getActiveContent() {
    const response = await fetch(`${API_BASE}/player/active-content`);
    return response.json();
  },

  async getActiveContentByRegion(regiao) {
    const response = await fetch(`${API_BASE}/player/active-content/region/${regiao}`);
    return response.json();
  },

  async getWeather() {
    const response = await fetch(`${API_BASE}/player/weather`);
    return response.json();
  },

  // Media endpoints
  async getMedia() {
    const response = await authFetch(`${API_BASE}/media/`);
    return parseResponse(response);
  },

  async getMediaById(id) {
    const response = await authFetch(`${API_BASE}/media/${id}`);
    return parseResponse(response);
  },

  async uploadMedia(file, tipo, nome) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    if (nome) formData.append('nome', nome);

    const response = await authFetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData
    });
    return parseResponse(response);
  },

  async createTextMedia(nome, texto) {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('texto', texto);

    const response = await authFetch(`${API_BASE}/media/text`, {
      method: 'POST',
      body: formData
    });
    return parseResponse(response);
  },

  async createYoutubeMedia(nome, url) {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('url', url);

    const response = await authFetch(`${API_BASE}/media/youtube`, {
      method: 'POST',
      body: formData
    });
    return parseResponse(response);
  },

  async createLinkMedia(nome, url) {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('url', url);

    const response = await authFetch(`${API_BASE}/media/link`, {
      method: 'POST',
      body: formData
    });
    return parseResponse(response);
  },

  async updateMedia(id, data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    const response = await authFetch(`${API_BASE}/media/${id}`, {
      method: 'PUT',
      body: formData
    });
    return parseResponse(response);
  },

  async deleteMedia(id) {
    const response = await authFetch(`${API_BASE}/media/${id}`, {
      method: 'DELETE'
    });
    return parseResponse(response);
  },

  async getMediaStats() {
    const response = await authFetch(`${API_BASE}/media/stats/summary`);
    return parseResponse(response);
  },

  // Schedule endpoints
  async getSchedules(regiao = null) {
    const url = regiao
      ? `${API_BASE}/schedule/?regiao=${regiao}`
      : `${API_BASE}/schedule/`;
    const response = await authFetch(url);
    return parseResponse(response);
  },

  async getScheduleById(id) {
    const response = await authFetch(`${API_BASE}/schedule/${id}`);
    return parseResponse(response);
  },

  async createSchedule(data) {
    console.log('🌐 API: Enviando POST para /api/schedule/');
    console.log('🌐 API: Dados enviados:', JSON.stringify(data, null, 2));

    const response = await authFetch(`${API_BASE}/schedule/`, {
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
    const response = await authFetch(`${API_BASE}/schedule/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return parseResponse(response);
  },

  async deleteSchedule(id) {
    const response = await authFetch(`${API_BASE}/schedule/${id}`, {
      method: 'DELETE'
    });
    return parseResponse(response);
  },

  async reorderSchedules(updates) {
    const response = await authFetch(`${API_BASE}/schedule/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    return parseResponse(response);
  },

  async getNextSchedules(regiao, hours = 24) {
    const response = await authFetch(`${API_BASE}/schedule/next/${regiao}?hours=${hours}`);
    return parseResponse(response);
  }
};