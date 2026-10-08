import { useEffect, useState } from 'react';
import MediaList from '../components/admin/MediaList';
import MediaUpload from '../components/admin/MediaUpload';
import ScheduleForm from '../components/admin/ScheduleForm';
import ScheduleList from '../components/admin/ScheduleList';
import Stats from '../components/admin/Stats';
import Login from '../components/Login';
import { api, auth } from '../services/api';
import './AdminPage.css';

export default function AdminPage() {
  const [logged, setLogged] = useState(!!auth.getToken());

  useEffect(() => {
    const onLogout = () => setLogged(false);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (!logged) return <Login onLogin={() => setLogged(true)} />;
  return <AdminPanel onLogout={auth.logout} />;
}

function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [media, setMedia] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mediaData, scheduleData, statsData] = await Promise.all([
        api.getMedia(),
        api.getSchedules(),
        api.getMediaStats()
      ]);
      setMedia(mediaData);
      setSchedules(scheduleData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploaded = () => {
    loadData();
    setActiveTab('media');
  };

  const handleScheduleCreated = () => {
    loadData();
    setActiveTab('schedule');
    setSelectedSchedule(null);
  };

  const handleMediaDeleted = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta mídia?')) {
      try {
        await api.deleteMedia(id);
        loadData();
      } catch (error) {
        alert('Erro ao excluir mídia');
      }
    }
  };

  const handleScheduleDeleted = async (id) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await api.deleteSchedule(id);
        loadData();
      } catch (error) {
        alert('Erro ao excluir agendamento');
      }
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>🎬 Media Player - Painel Administrativo</h1>
          <div className="header-actions">
            <a href="/" target="_blank" className="btn-preview">
              👁️ Ver Player
            </a>
            <button className="btn-logout" onClick={onLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'media' ? 'active' : ''}
          onClick={() => setActiveTab('media')}
        >
          🎞️ Mídias
        </button>
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          ⬆️ Upload
        </button>
        <button
          className={activeTab === 'schedule' ? 'active' : ''}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Agendamentos
        </button>
        <button
          className={activeTab === 'new-schedule' ? 'active' : ''}
          onClick={() => {
            setActiveTab('new-schedule');
            setSelectedSchedule(null);
          }}
        >
          ➕ Novo Agendamento
        </button>
      </nav>

      <main className="admin-content">
        {loading && <div className="loading">Carregando...</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Dashboard</h2>
            {stats && <Stats stats={stats} />}

            <div className="dashboard-grid">
              <div className="card">
                <h3>Mídias Recentes</h3>
                <div className="recent-items">
                  {media.slice(0, 5).map(m => (
                    <div key={m.id} className="recent-item">
                      <span className={`type-badge ${m.tipo}`}>{m.tipo}</span>
                      <span>{m.nome}</span>
                      <span className={`status ${m.ativo ? 'active' : 'inactive'}`}>
                        {m.ativo ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Próximos Agendamentos</h3>
                <div className="recent-items">
                  {schedules.slice(0, 5).map(s => (
                    <div key={s.id} className="recent-item">
                      <span className={`type-badge regiao-${s.regiao}`}>
                        {s.regiao === 1 ? 'Vertical' : s.regiao === 2 ? 'Horizontal' : 'Texto'}
                      </span>
                      <span>{s.media_nome}</span>
                      <span className="schedule-time">
                        {s.data_inicio} - {s.hora_inicio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="media-section">
            <h2>Gerenciar Mídias</h2>
            <MediaList
              media={media}
              onDelete={handleMediaDeleted}
              onEdit={setSelectedMedia}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <h2>Upload de Mídia</h2>
            <MediaUpload onUploaded={handleMediaUploaded} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-section">
            <h2>Agendamentos</h2>
            <ScheduleList
              schedules={schedules}
              onDelete={handleScheduleDeleted}
              onEdit={(schedule) => {
                setSelectedSchedule(schedule);
                setActiveTab('new-schedule');
              }}
            />
          </div>
        )}

        {activeTab === 'new-schedule' && (
          <div className="schedule-form-section">
            <h2>{selectedSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <ScheduleForm
              media={media}
              schedule={selectedSchedule}
              onSaved={handleScheduleCreated}
              onCancel={() => {
                setSelectedSchedule(null);
                setActiveTab('schedule');
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
