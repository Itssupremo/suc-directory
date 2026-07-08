import { useState, useEffect } from 'react';
import { getSucs, createSuc, updateSuc, deleteSuc, transferSuc, getOccOfficials } from '../services/api';
import SucTable from '../components/SucTable';
import AddSucModal from '../components/AddSucModal';
import EditSucModal from '../components/EditSucModal';
import TransferModal from '../components/TransferModal';
import QuickViewModal from '../components/QuickViewModal';

function SuperadminDashboard({ user }) {
  const [sucs, setSucs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedSuc, setSelectedSuc] = useState(null);
  const [selectedSucDetail, setSelectedSucDetail] = useState(null);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [officialFilter, setOfficialFilter] = useState('');
  const [officials, setOfficials] = useState([]);

  // Layout states
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' | 'analytics'
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'incomplete'
  const [toastMsg, setToastMsg] = useState(null);

  const fetchSucs = async () => {
    try {
      const res = await getSucs();
      setSucs(res.data);
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to load SUCs' });
    }
  };

  useEffect(() => {
    fetchSucs();
    getOccOfficials().then((res) => setOfficials(res.data)).catch(() => {});
  }, []);

  const calculateCompleteness = (suc) => {
    if (!suc) return 0;
    const fields = [
      suc.president,
      suc.email,
      suc.contact,
      suc.boardSecretaryName,
      suc.boardSecretaryEmail,
      suc.boardSecretaryContact,
      suc.address
    ];
    const filled = fields.filter(f => f && String(f).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const filtered = sucs.filter((suc) => {
    // 1. Search text filter
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      suc.sucName.toLowerCase().includes(q) || 
      (suc.president && suc.president.toLowerCase().includes(q)) || 
      (suc.region && suc.region.toLowerCase().includes(q)) || 
      (suc.abbreviation && suc.abbreviation.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // 2. Official filter
    const matchesOfficial = !officialFilter || suc.occCode === officialFilter;
    if (!matchesOfficial) return false;

    // 3. Completeness filter
    if (selectedFilter === 'incomplete') {
      return calculateCompleteness(suc) < 100;
    }
    return true; // 'all'
  });

  const showMessage = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAdd = async (data) => {
    try {
      await createSuc(data);
      showMessage('success', 'SUC added successfully');
      setShowAdd(false);
      fetchSucs();
    } catch (err) {
      showMessage('danger', err.response?.data?.message || 'Failed to add SUC');
    }
  };

  const handleEdit = (suc) => {
    setSelectedSuc(suc);
    setShowEdit(true);
  };

  const handleEditSave = async (id, data) => {
    try {
      await updateSuc(id, data);
      showMessage('success', 'SUC updated successfully');
      setShowEdit(false);
      setSelectedSuc(null);
      fetchSucs();
    } catch (err) {
      showMessage('danger', err.response?.data?.message || 'Failed to update SUC');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SUC?')) return;
    try {
      await deleteSuc(id);
      showMessage('success', 'SUC deleted successfully');
      if (selectedSucDetail?._id === id) {
        setShowQuickView(false);
      }
      fetchSucs();
    } catch (err) {
      showMessage('danger', err.response?.data?.message || 'Failed to delete SUC');
    }
  };

  const handleTransfer = (suc) => {
    setSelectedSuc(suc);
    setShowTransfer(true);
  };

  const handleTransferSave = async (id, data) => {
    try {
      await transferSuc(id, data);
      showMessage('success', 'SUC transferred successfully');
      setShowTransfer(false);
      setSelectedSuc(null);
      fetchSucs();
    } catch (err) {
      showMessage('danger', err.response?.data?.message || 'Failed to transfer SUC');
    }
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMsg(`Copied ${label} to clipboard!`);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // Analytics helper calculations
  const totalSucs = sucs.length;
  const averageCompleteness = totalSucs > 0
    ? Math.round(sucs.reduce((acc, s) => acc + calculateCompleteness(s), 0) / totalSucs)
    : 0;

  const pieGradient = `conic-gradient(var(--ched-accent) ${averageCompleteness}%, #e9ecef 0%)`;

  // Region breakdown
  const regionCounts = {};
  sucs.forEach(s => {
    if (s.region) regionCounts[s.region] = (regionCounts[s.region] || 0) + 1;
  });
  const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const maxRegionCount = Math.max(...Object.values(regionCounts), 1);

  // Section counts
  const sectionCounts = { Chairperson: 0, Commissioner: 0, Other: 0 };
  sucs.forEach(s => {
    if (sectionCounts[s.section] !== undefined) sectionCounts[s.section]++;
  });
  const maxSectionCount = Math.max(...Object.values(sectionCounts), 1);

  return (
    <div className="container-fluid px-0 fade-in">
      {/* Header Banner */}
      <div className="p-4 mb-4 text-white rounded-3 shadow" style={{ background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', borderBottom: '4px solid var(--ched-gold)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="display-6 fw-bold mb-1" style={{ fontSize: '1.8rem' }}>
              <i className="bi bi-shield-lock me-2"></i>Superadmin Control Center
            </h1>
            <p className="lead mb-0 text-white-50" style={{ fontSize: '0.95rem' }}>
              System-wide directory management. Full control to add, edit, transfer, or remove State Universities and Colleges.
            </p>
          </div>
          <div>
            <button className="btn btn-light fw-bold px-4 py-2 shadow-sm d-flex align-items-center text-primary" onClick={() => setShowAdd(true)} style={{ borderRadius: '8px' }}>
              <i className="bi bi-plus-circle-fill me-2 fs-5 text-warning"></i> Add SUC
            </button>
          </div>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} d-flex align-items-center shadow-sm border-0 mb-4`} role="alert" style={{ borderRadius: '8px' }}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} me-2 fs-5`}></i>
          <div>{alert.msg}</div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="row g-3 mb-4">
        
        {/* Card 1: Total SUCs */}
        <div className="col-md-4">
          <div 
            className={`card shadow-sm border-0 h-100 stat-card-interactive ${selectedFilter === 'all' ? 'stat-card-active' : ''}`}
            onClick={() => setSelectedFilter('all')}
            style={{ borderLeft: '4px solid var(--ched-navy)', borderRadius: '10px' }}
          >
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-building fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Total SUCs</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{totalSucs}</h2>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Click to view all SUCs</small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Directory Profile Completeness */}
        <div className="col-md-4">
          <div 
            className={`card shadow-sm border-0 h-100 stat-card-interactive ${selectedFilter === 'incomplete' ? 'stat-card-active' : ''}`}
            onClick={() => setSelectedFilter('incomplete')}
            style={{ borderLeft: '4px solid var(--ched-accent)', borderRadius: '10px' }}
          >
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-info bg-opacity-10 text-info me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-heart-pulse-fill fs-3 text-danger"></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Completeness Index</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{averageCompleteness}%</h2>
                <div className="w-100 bg-secondary bg-opacity-10 rounded-pill mt-1" style={{ height: '4px' }}>
                  <div className="bg-success rounded-pill" style={{ height: '100%', width: `${averageCompleteness}%` }}></div>
                </div>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>Click to show incomplete profiles</small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Active Office Codes */}
        <div className="col-md-4">
          <div 
            className="card shadow-sm border-0 h-100" 
            style={{ borderLeft: '4px solid var(--ched-gold)', borderRadius: '10px' }}
          >
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-person-badge fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Office Codes</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">
                  {new Set(sucs.map(s => s.occCode).filter(Boolean)).size}
                </h2>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Active commission assignments</small>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* View Selector & Search Sync Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 bg-white p-3 rounded-3 shadow-sm">
        
        <div>
          <span className="small text-muted fw-bold text-uppercase">Active Filter: </span>
          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-capitalize px-3 py-2 ms-1" style={{ borderRadius: '6px' }}>
            {selectedFilter === 'incomplete' ? 'Action Required (Incomplete)' : 'All Directory SUCs'}
          </span>
          <span className="text-muted small ms-2">({filtered.length} items found)</span>
        </div>

        {/* Tabs switcher */}
        <div className="btn-group shadow-sm" role="group" style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <button 
            type="button" 
            className={`btn view-toggle-btn d-flex align-items-center gap-1 ${viewMode === 'list' ? 'btn-primary' : 'btn-light text-dark'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="bi bi-list-task"></i> List
          </button>
          <button 
            type="button" 
            className={`btn view-toggle-btn d-flex align-items-center gap-1 ${viewMode === 'grid' ? 'btn-primary' : 'btn-light text-dark'}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="bi bi-grid-3x3-gap-fill"></i> Grid
          </button>
          <button 
            type="button" 
            className={`btn view-toggle-btn d-flex align-items-center gap-1 ${viewMode === 'analytics' ? 'btn-primary' : 'btn-light text-dark'}`}
            onClick={() => setViewMode('analytics')}
          >
            <i className="bi bi-bar-chart-line-fill"></i> Analytics
          </button>
        </div>

      </div>

      {/* Conditional Rendering of Views */}
      {viewMode === 'list' && (
        <div className="card shadow-sm border-0" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <div className="card-body p-0">
            <SucTable
              sucs={filtered}
              showActions
              isAdmin
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTransfer={handleTransfer}
              onView={(suc) => { setSelectedSucDetail(suc); setShowQuickView(true); }}
              search={search}
              onSearchChange={setSearch}
              officialFilter={officialFilter}
              onOfficialFilterChange={setOfficialFilter}
              officials={officials}
            />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="fade-in">
          {/* Search bar */}
          <div className="d-flex flex-wrap gap-3 mb-3 bg-white p-3 rounded-3 shadow-sm align-items-center">
            <div className="input-group shadow-sm" style={{ maxWidth: '320px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder="Search SUC, president..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="input-group shadow-sm" style={{ maxWidth: '280px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-funnel"></i>
              </span>
              <select
                className="form-select border-start-0 ps-1"
                value={officialFilter}
                onChange={(e) => setOfficialFilter(e.target.value)}
              >
                <option value="">All CHED Officials</option>
                {officials.map((o) => (
                  <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="suc-grid">
            {filtered.length === 0 ? (
              <div className="text-center py-5 w-100 bg-white rounded shadow-sm">
                <i className="bi bi-inbox fs-3 d-block text-muted mb-2"></i>
                <span className="text-muted">No SUC records match the criteria</span>
              </div>
            ) : (
              filtered.map(suc => {
                const pct = calculateCompleteness(suc);
                return (
                  <div key={suc._id} className="suc-card">
                    <div className="suc-card-header">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                          Region {suc.region}
                        </span>
                        <span className={`completeness-badge ${pct === 100 ? 'complete' : 'incomplete'}`}>
                          {pct}%
                        </span>
                      </div>
                      <h5 className="fw-bold mt-2 mb-0 text-dark text-truncate" title={suc.sucName}>
                        {suc.sucName}
                      </h5>
                      {suc.abbreviation && <span className="badge bg-primary bg-opacity-10 text-primary mt-1">{suc.abbreviation}</span>}
                    </div>
                    
                    <div className="suc-card-body">
                      <p className="small mb-2 text-muted text-truncate" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-geo-alt me-1"></i>{suc.address || 'No address registered'}
                      </p>
                      
                      <div className="border-top pt-2 mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small fw-semibold">President:</span>
                          <span className="small fw-bold text-dark text-truncate" style={{ maxWidth: '160px' }}>{suc.president || '—'}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small fw-semibold">Email:</span>
                          {suc.email ? (
                            <div className="d-flex align-items-center gap-1">
                              <a href={`mailto:${suc.email}`} className="small text-truncate" style={{ maxWidth: '140px' }} title={suc.email}>{suc.email}</a>
                              <button className="copy-btn" onClick={() => handleCopyText(suc.email, 'Email')} title="Copy Email">
                                <i className="bi bi-clipboard"></i>
                              </button>
                            </div>
                          ) : <span className="small text-muted">—</span>}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small fw-semibold">Contact:</span>
                          {suc.contact ? (
                            <div className="d-flex align-items-center gap-1">
                              <span className="small text-dark fw-medium">{suc.contact}</span>
                              <button className="copy-btn" onClick={() => handleCopyText(suc.contact, 'Contact Number')} title="Copy Contact">
                                <i className="bi bi-clipboard"></i>
                              </button>
                            </div>
                          ) : <span className="small text-muted">—</span>}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top">
                          <span className="text-muted small fw-semibold">OCC Assigned:</span>
                          <span className="badge bg-light text-primary fw-bold">{suc.occCode || '—'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="suc-card-footer">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedSucDetail(suc); setShowQuickView(true); }}>
                        <i className="bi bi-eye"></i> View
                      </button>
                      <button className="btn btn-sm btn-warning text-dark fw-semibold" onClick={() => handleEdit(suc)}>
                        <i className="bi bi-pencil-square"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-info" onClick={() => handleTransfer(suc)}>
                        <i className="bi bi-arrow-left-right"></i> Transfer
                      </button>
                      <button className="btn btn-sm btn-danger text-white" onClick={() => handleDelete(suc._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="row g-4 fade-in">
          {/* Completeness donut */}
          <div className="col-lg-4 col-md-6">
            <div className="chart-card h-100 text-center">
              <h5 className="fw-bold mb-3 text-dark">Directory Data Completeness</h5>
              <div className="pie-simulation py-3">
                <div className="completion-donut" style={{ background: pieGradient }}>
                  <div className="completion-donut-inner">
                    <h2 className="mb-0 fw-bold text-primary">{averageCompleteness}%</h2>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Average Score</small>
                  </div>
                </div>
              </div>
              <div className="text-muted small mt-3 border-top pt-2">
                <div><strong className="text-success">{sucs.filter(s => calculateCompleteness(s) === 100).length}</strong> / {totalSucs} SUC Profiles are 100% complete</div>
              </div>
            </div>
          </div>

          {/* Regional distribution */}
          <div className="col-lg-4 col-md-6">
            <div className="chart-card h-100">
              <h5 className="fw-bold mb-3 text-dark">Regional Distribution</h5>
              <div className="bar-chart-container" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {sortedRegions.map(([reg, count]) => (
                  <div key={reg} className="chart-bar-row">
                    <div className="chart-bar-label">Region {reg}</div>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill" style={{ width: `${(count / maxRegionCount) * 100}%`, backgroundColor: 'var(--ched-accent)' }}></div>
                      <div className="chart-bar-val">{count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section classification */}
          <div className="col-lg-4 col-md-6">
            <div className="chart-card h-100">
              <h5 className="fw-bold mb-3 text-dark">Section Classification</h5>
              <div className="bar-chart-container mt-4">
                {Object.entries(sectionCounts).map(([section, count]) => (
                  <div key={section} className="chart-bar-row mb-3">
                    <div className="chart-bar-label">{section}</div>
                    <div className="chart-bar-wrapper">
                      <div 
                        className="chart-bar-fill" 
                        style={{ 
                          width: `${(count / maxSectionCount) * 100}%`, 
                          backgroundColor: section === 'Chairperson' ? 'var(--ched-navy)' : section === 'Commissioner' ? 'var(--ched-gold)' : '#6c757d'
                        }}
                      ></div>
                      <div className="chart-bar-val">{count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Clipboard Copy Toast Notification */}
      {toastMsg && (
        <div className="clipboard-toast shadow-lg">
          <i className="bi bi-clipboard-check-fill text-success fs-5"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modals */}
      <AddSucModal show={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} />
      
      <EditSucModal 
        show={showEdit} 
        onClose={() => { setShowEdit(false); setSelectedSuc(null); }} 
        onSave={handleEditSave} 
        suc={selectedSuc} 
      />
      
      <TransferModal 
        show={showTransfer} 
        onClose={() => { setShowTransfer(false); setSelectedSuc(null); }} 
        onSave={handleTransferSave} 
        suc={selectedSuc} 
      />

      <QuickViewModal
        show={showQuickView}
        onClose={() => { setShowQuickView(false); setSelectedSucDetail(null); }}
        suc={selectedSucDetail}
        onEdit={handleEdit}
        onTransfer={handleTransfer}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default SuperadminDashboard;
