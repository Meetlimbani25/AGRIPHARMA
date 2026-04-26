import React, { useState, useEffect, useRef } from 'react';
import { detectDisease, getDiseaseHistory } from '../services/api';
import './Disease.css';

export default function Disease() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError]       = useState('');
  const fileRef = useRef();

  useEffect(() => {
    getDiseaseHistory()
      .then(r => setHistory(r.data.history || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  const handleFile = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null); setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await detectDisease(fd);
      setResult(res.data);
      getDiseaseHistory().then(r => setHistory(r.data.history || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (c) => {
    if (!c) return 'var(--text-light)';
    if (c > 0.7) return '#e53e3e';
    if (c > 0.4) return '#d97706';
    return '#059669';
  };

  return (
    <div className="disease-page page-enter">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="section-title">🔬 AI Disease Detection</h1>
            <p className="section-subtitle">Upload a photo of your crop to get instant disease diagnosis</p>
          </div>
        </div>

        <div className="disease-layout">
          {/* Upload Panel */}
          <div className="disease-upload-panel">
            <div
              className={`upload-zone ${preview ? 'has-preview' : ''}`}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => !preview && fileRef.current.click()}
            >
              {preview ? (
                <div className="preview-wrap">
                  <img src={preview} alt="Crop preview" className="preview-img" />
                  <button className="remove-btn" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); }}>✕ Remove</button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <h3>Drop or click to upload</h3>
                  <p>Support: JPG, PNG, WebP · Max 10MB</p>
                  <button className="btn btn-outline" onClick={() => fileRef.current.click()}>Browse Files</button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

            {file && !loading && !result && (
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleSubmit}>
                🔬 Detect Disease
              </button>
            )}

            {loading && (
              <div className="detecting-anim">
                <div className="spinner" />
                <p>Analyzing your crop with AI...</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="disease-result">
                <div className="result-header">
                  <h3>Detection Result</h3>
                  <span className="badge badge-green">✓ Analyzed</span>
                </div>
                {result.disease_name && (
                  <div className="result-disease">
                    <span className="result-label">Detected Disease</span>
                    <strong style={{ color: confidenceColor(result.confidence) }}>{result.disease_name}</strong>
                  </div>
                )}
                {result.confidence !== undefined && (
                  <div className="result-confidence">
                    <div className="conf-bar">
                      <div className="conf-fill" style={{ width: `${result.confidence * 100}%`, background: confidenceColor(result.confidence) }} />
                    </div>
                    <span>{(result.confidence * 100).toFixed(1)}% confidence</span>
                  </div>
                )}
                {result.treatment && (
                  <div className="result-section">
                    <span className="result-label">💊 Recommended Treatment</span>
                    <p>{result.treatment}</p>
                  </div>
                )}
                {result.prevention && (
                  <div className="result-section">
                    <span className="result-label">🛡️ Prevention Tips</span>
                    <p>{result.prevention}</p>
                  </div>
                )}
                {result.medicines && result.medicines.length > 0 && (
                  <div className="result-section">
                    <span className="result-label">🧪 Suggested Medicines</span>
                    <div className="medicine-tags">
                      {result.medicines.map((m, i) => <span key={i} className="badge badge-gold">{m}</span>)}
                    </div>
                  </div>
                )}
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  Scan Another →
                </button>
              </div>
            )}
          </div>

          {/* History Panel */}
          <div className="disease-history-panel">
            <h2 className="dash-section-title" style={{ marginBottom: 20 }}>Scan History</h2>
            {histLoading ? (
              <div className="loading-center" style={{ minHeight: 120 }}><div className="spinner" /></div>
            ) : history.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-emoji" style={{ fontSize: '2.5rem' }}>🌿</div>
                <p>No scans yet. Upload a crop photo to start.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map(h => (
                  <div key={h.id} className="history-item">
                    {h.image_url && (
                      <img src={`http://localhost:5001${h.image_url}`} alt="scan" className="history-thumb" />
                    )}
                    <div className="history-info">
                      <strong>{h.disease_name || 'Unknown'}</strong>
                      {h.confidence && (
                        <span style={{ fontSize: '0.78rem', color: confidenceColor(h.confidence) }}>
                          {(h.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      <small>{new Date(h.scanned_at || h.created_at).toLocaleDateString('en-IN')}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
