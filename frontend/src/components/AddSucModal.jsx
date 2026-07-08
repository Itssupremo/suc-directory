import { useState, useEffect } from 'react';
import { getOccOfficials } from '../services/api';

const REGIONS = ['NCR','1','2','3','4','MIMAROPA','5','6','NIR','7','8','9','10','11','12','CAR','CARAGA','BARMM'];

function AddSucModal({ show, onClose, onSave, allowedSections }) {
  const [officials, setOfficials] = useState([]);
  const [form, setForm] = useState({
    sucName: '', abbreviation: '', region: '', address: '', president: '', email: '', contact: '',
    boardSecretaryName: '', boardSecretaryEmail: '', boardSecretaryContact: '',
    occCode: '', chedOfficial: '', section: ''
  });
  const [contactsList, setContactsList] = useState(['']);
  const [boardSecContactsList, setBoardSecContactsList] = useState(['']);

  useEffect(() => {
    getOccOfficials().then((res) => setOfficials(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'occCode') {
      const off = officials.find((o) => o.code === e.target.value);
      if (off) {
        updated.chedOfficial = off.name;
        updated.section = off.section;
      }
    }
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      contact: contactsList.map(s => s.trim()).filter(Boolean).join(', '),
      boardSecretaryContact: boardSecContactsList.map(s => s.trim()).filter(Boolean).join(', ')
    });
    setForm({ 
      sucName: '', abbreviation: '', region: '', address: '', president: '', email: '', contact: '',
      boardSecretaryName: '', boardSecretaryEmail: '', boardSecretaryContact: '',
      occCode: '', chedOfficial: '', section: '' 
    });
    setContactsList(['']);
    setBoardSecContactsList(['']);
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content shadow border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', borderBottom: '3px solid var(--ched-gold)' }}>
            <h5 className="modal-title font-weight-bold d-flex align-items-center">
              <i className="bi bi-plus-circle me-2"></i>Add SUC
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
              {/* SECTION 1: General Info */}
              <div className="mb-4">
                <h6 className="text-uppercase tracking-wider font-weight-bold text-primary border-bottom pb-2 mb-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  <i className="bi bi-info-circle me-2"></i>General Information
                </h6>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label fw-semibold">SUC Name *</label>
                    <input name="sucName" className="form-control" value={form.sucName} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Abbreviation</label>
                    <input name="abbreviation" className="form-control" value={form.abbreviation} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Region *</label>
                    <select name="region" className="form-select" value={form.region} onChange={handleChange} required>
                      <option value="">Select Region</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-semibold">Address</label>
                    <input name="address" className="form-control" value={form.address} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* SECTION 2: President Info */}
              <div className="mb-4">
                <h6 className="text-uppercase tracking-wider font-weight-bold text-primary border-bottom pb-2 mb-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  <i className="bi bi-person me-2"></i>President's Office
                </h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">President Name</label>
                    <input name="president" className="form-control" value={form.president} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">President Email</label>
                    <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-semibold mb-0">President Contact</label>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-primary py-0 px-2 fw-semibold"
                        style={{ fontSize: '0.72rem', borderRadius: '4px' }}
                        onClick={() => setContactsList([...contactsList, ''])}
                      >
                        <i className="bi bi-plus-lg me-1"></i>Add
                      </button>
                    </div>
                    {contactsList.map((c, idx) => (
                      <div key={idx} className="input-group mb-2">
                        <span className="input-group-text bg-light text-muted" style={{ fontSize: '0.8rem' }}>#{idx+1}</span>
                        <input
                          type="text"
                          className="form-control text-sm"
                          value={c}
                          placeholder="Contact Number"
                          onChange={(e) => {
                            const newList = [...contactsList];
                            newList[idx] = e.target.value;
                            setContactsList(newList);
                          }}
                        />
                        {contactsList.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                            onClick={() => {
                              const newList = contactsList.filter((_, i) => i !== idx);
                              setContactsList(newList.length > 0 ? newList : ['']);
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Board Sec Info */}
              <div className="mb-4">
                <h6 className="text-uppercase tracking-wider font-weight-bold text-primary border-bottom pb-2 mb-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  <i className="bi bi-person-badge me-2"></i>Board Secretary's Office
                </h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Board Secretary</label>
                    <input name="boardSecretaryName" className="form-control" value={form.boardSecretaryName} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Board Sec. Email</label>
                    <input name="boardSecretaryEmail" type="email" className="form-control" value={form.boardSecretaryEmail} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-semibold mb-0">Board Sec. Contact</label>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-primary py-0 px-2 fw-semibold"
                        style={{ fontSize: '0.72rem', borderRadius: '4px' }}
                        onClick={() => setBoardSecContactsList([...boardSecContactsList, ''])}
                      >
                        <i className="bi bi-plus-lg me-1"></i>Add
                      </button>
                    </div>
                    {boardSecContactsList.map((c, idx) => (
                      <div key={idx} className="input-group mb-2">
                        <span className="input-group-text bg-light text-muted" style={{ fontSize: '0.8rem' }}>#{idx+1}</span>
                        <input
                          type="text"
                          className="form-control text-sm"
                          value={c}
                          placeholder="Contact Number"
                          onChange={(e) => {
                            const newList = [...boardSecContactsList];
                            newList[idx] = e.target.value;
                            setBoardSecContactsList(newList);
                          }}
                        />
                        {boardSecContactsList.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                            onClick={() => {
                              const newList = boardSecContactsList.filter((_, i) => i !== idx);
                              setBoardSecContactsList(newList.length > 0 ? newList : ['']);
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 4: CHED Assignment */}
              <div>
                <h6 className="text-uppercase tracking-wider font-weight-bold text-primary border-bottom pb-2 mb-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  <i className="bi bi-shield-check me-2"></i>CHED Assignment
                </h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">OCC Code *</label>
                    <select name="occCode" className="form-select" value={form.occCode} onChange={handleChange} required>
                      <option value="">Select OCC</option>
                      {officials
                        .filter((o) => !allowedSections || allowedSections.includes(o.section))
                        .map((o) => (
                        <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">CHED Official</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted"><i className="bi bi-lock-fill"></i></span>
                      <input name="chedOfficial" className="form-control bg-light" value={form.chedOfficial} readOnly />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Section</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted"><i className="bi bi-lock-fill"></i></span>
                      <input name="section" className="form-control bg-light" value={form.section} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light border-top">
              <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn text-white px-4 fw-semibold" style={{ background: 'var(--ched-blue)' }}>Add SUC</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddSucModal;
