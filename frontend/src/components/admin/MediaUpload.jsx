import { useState } from 'react';
import { api } from '../../services/api';

export default function MediaUpload({ onUploaded }) {
  const [tipo, setTipo] = useState('video');
  const [nome, setNome] = useState('');
  const [texto, setTexto] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!nome) setNome(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (tipo === 'texto') {
        await api.createTextMedia(nome, texto);
      } else {
        if (!file) {
          alert('Selecione um arquivo');
          return;
        }
        await api.uploadMedia(file, tipo, nome);
      }
      
      alert('Mídia criada com sucesso!');
      setNome('');
      setTexto('');
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (error) {
      alert('Erro ao criar mídia: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tipo de Mídia</label>
          <select className="form-control" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="video">Vídeo</option>
            <option value="imagem">Imagem</option>
            <option value="texto">Texto</option>
          </select>
        </div>

        <div className="form-group">
          <label>Nome</label>
          <input
            type="text"
            className="form-control"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Nome descritivo da mídia"
          />
        </div>

        {tipo === 'texto' ? (
          <div className="form-group">
            <label>Texto do Aviso</label>
            <textarea
              className="form-control"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
              placeholder="Digite o texto do aviso aqui..."
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Arquivo</label>
            <div className="upload-area" onClick={() => document.getElementById('file-input').click()}>
              {file ? (
                <div>
                  <div style={{fontSize: '48px', marginBottom: '10px'}}>✓</div>
                  <div>{file.name}</div>
                  <div style={{fontSize: '14px', color: '#64748b', marginTop: '8px'}}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{fontSize: '48px', marginBottom: '10px'}}>📁</div>
                  <div>Clique para selecionar arquivo</div>
                  <div style={{fontSize: '14px', color: '#64748b', marginTop: '8px'}}>
                    {tipo === 'video' ? 'MP4, WebM, AVI' : 'JPG, PNG, WebP'}
                  </div>
                </div>
              )}
            </div>
            <input
              id="file-input"
              type="file"
              accept={tipo === 'video' ? 'video/*' : 'image/*'}
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Enviando...' : '✓ Criar Mídia'}
          </button>
        </div>
      </form>
    </div>
  );
}
