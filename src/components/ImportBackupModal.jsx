import React, { useState, useRef } from 'react';
import Modal from './Modal';

export default function ImportBackupModal({ isOpen, onClose, onImportarBackup }) {
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFileContent(null);
    setFileName('');
    setPreview(null);
    setErro('');
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setErro('Por favor, selecione um arquivo no formato JSON (.json).');
      return;
    }

    setFileName(file.name);
    setErro('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const data = json.data || json;

        if (!data || !Array.isArray(data.programadores) || !Array.isArray(data.projetos)) {
          throw new Error('O arquivo selecionado não contém a estrutura válida de backup (programadores e projetos ausentes).');
        }

        setFileContent(json);
        setPreview({
          timestamp: json.timestamp ? new Date(json.timestamp).toLocaleString('pt-BR') : 'Data não informada',
          versao: json.versao || '1.0',
          programadoresCount: data.programadores.length,
          projetosCount: data.projetos.length,
          linksCount: data.projeto_links ? data.projeto_links.length : 0,
          alocacoesCount: data.alocacoes ? data.alocacoes.length : 0
        });
      } catch (err) {
        setErro('Erro ao ler arquivo: ' + (err.message || 'JSON inválido'));
        setFileContent(null);
        setPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleConfirmar = async () => {
    if (!fileContent) return;
    try {
      setLoading(true);
      await onImportarBackup(fileContent);
      handleClose();
    } catch (err) {
      setErro(err.message || 'Erro ao restaurar backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Restaurar / Importar Backup JSON"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button
            id="btn-confirmar-import-backup"
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmar}
            disabled={!preview || loading}
          >
            {loading ? 'Restaurando...' : 'Confirmar Restauração'}
          </button>
        </>
      }
    >
      <div>
        {erro && <div className="form-error-alert">{erro}</div>}

        <div
          className="import-dropzone"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '30px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-input)',
            transition: 'border-color var(--transition-fast)'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📥</span>
          <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
            {fileName ? fileName : 'Clique para selecionar ou arraste o arquivo .json aqui'}
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Suporta backups gerados pelo botão "Exportar Backup"
          </span>
        </div>

        {preview && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Resumo do Arquivo de Backup:
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                background: 'var(--bg-card)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}
            >
              <div>👨‍💻 <strong>Programadores:</strong> {preview.programadoresCount}</div>
              <div>📁 <strong>Projetos:</strong> {preview.projetosCount}</div>
              <div>🔗 <strong>Links:</strong> {preview.linksCount}</div>
              <div>📅 <strong>Alocações:</strong> {preview.alocacoesCount}</div>
              <div style={{ gridColumn: 'span 2', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                🕒 Gerado em: <strong>{preview.timestamp}</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '0.82rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <span>⚠️</span>
              <span>
                <strong>Atenção:</strong> A restauração substituirá os registros atuais do sistema pelos contidos neste arquivo de backup.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
