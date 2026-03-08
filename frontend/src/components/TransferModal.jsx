import { useState, useEffect } from 'react';
import { getOccOfficials } from '../services/api';

function TransferModal({ show, onClose, onSave, suc }) {
  const [occCode, setOccCode] = useState('');
  const [officials, setOfficials] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getOccOfficials().then((res) => setOfficials(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (suc) {
      setOccCode(suc.occCode || '');
      setSelected(null);
    }
  }, [suc]);

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setOccCode(code);
    setSelected(officials.find((o) => o.code === code) || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(suc._id, { occCode });
  };

  if (!show || !suc) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">Transfer SUC</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="mb-3">
                Transferring: <strong>{suc.sucName}</strong>
              </p>
              <p className="text-muted small mb-3">
                Current: <strong>{suc.chedOfficial}</strong> ({suc.occCode || 'N/A'}) &mdash; {suc.section}
              </p>
              <div className="mb-3">
                <label className="form-label">Transfer to OCC Code *</label>
                <select
                  className="form-select"
                  value={occCode}
                  onChange={handleCodeChange}
                  required
                >
                  <option value="">Select OCC Code</option>
                  {officials.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.code} — {o.name}
                    </option>
                  ))}
                </select>
              </div>
              {selected && (
                <div className="alert alert-light border">
                  <strong>Will be assigned to:</strong><br />
                  {selected.name}<br />
                  <span className={`badge ${selected.section === 'Chairperson' ? 'bg-success' : 'bg-info'} mt-1`}>
                    {selected.section}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-info text-white" disabled={!occCode}>Transfer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransferModal;
