import { useState, useEffect } from 'react';
import { getSucs, updateSuc } from '../services/api';
import SucTable from '../components/SucTable';
import EditSucModal from '../components/EditSucModal';
import QuickViewModal from '../components/QuickViewModal';

function SucDashboard({ user, initialTab }) {
  const [sucs, setSucs] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedSuc, setSelectedSuc] = useState(null);
  const [selectedSucDetail, setSelectedSucDetail] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  
  // Tab: 'my-institution' | 'directory'
  const [activeTab, setActiveTab] = useState(initialTab || 'my-institution');
  // View mode: 'list' | 'grid' | 'analytics'
  const [viewMode, setViewMode] = useState('list');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // Helper check: does SUC belong to user's SUC identity?
  const isMySuc = (suc) => {
    if (!user) return false;
    return (suc.abbreviation && suc.abbreviation.toLowerCase() === user.occCode?.toLowerCase()) ||
           (suc.occCode && suc.occCode.toLowerCase() === user.occCode?.toLowerCase()) ||
           (suc.sucName && suc.sucName.toLowerCase() === user.occCode?.toLowerCase());
  };

  // Filter logic
  const filtered = sucs.filter((suc) => {
    // 1. Search text filter
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      suc.sucName.toLowerCase().includes(q) || 
      (suc.president && suc.president.toLowerCase().includes(q)) || 
      (suc.region && suc.region.toLowerCase().includes(q)) || 
      (suc.abbreviation && suc.abbreviation.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // 2. Tab filter
    if (activeTab === 'my-institution') {
      return isMySuc(suc);
    }
    return true; // Directory shows all
  });

  const showMessage = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = (suc) => {
    if (!isMySuc(suc)) {
      showMessage('warning', 'Access Denied: You do not have permissions to edit SUCs other than your own.');
      return;
    }
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

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMsg(`Copied ${label} to clipboard!`);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // Profile completeness calculations
  const mySucObject = sucs.find(isMySuc);
  const myCompleteness = mySucObject ? calculateCompleteness(mySucObject) : 0;
  const pieGradient = `conic-gradient(var(--ched-accent) ${myCompleteness}%, #e9ecef 0%)`;

  // Region breakdown
  const regionCounts = {};
  const currentSet = activeTab === 'my-institution' && mySucObject ? [mySucObject] : sucs;
  currentSet.forEach(s => {
    if (s.region) regionCounts[s.region] = (regionCounts[s.region] || 0) + 1;
  });
  const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const maxRegionCount = Math.max(...Object.values(regionCounts), 1);

  // Section Counts
  const sectionCounts = { Chairperson: 0, Commissioner: 0, Other: 0 };
  currentSet.forEach(s => {
    if (sectionCounts[s.section] !== undefined) sectionCounts[s.section]++;
  });
  const maxSectionCount = Math.max(...Object.values(sectionCounts), 1);

  return (
    <div className="container-fluid px-0 fade-in">
      {/* Header Banner */}
      <div className="p-4 mb-4 text-white rounded-3 shadow animate-header" style={{ background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', borderBottom: '4px solid var(--ched-gold)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="display-6 fw-bold mb-1" style={{ fontSize: '1.8rem' }}>
              <i className="bi bi-mortarboard me-2"></i>SUC Portal
            </h1>
            <p className="lead mb-0 text-white-50" style={{ fontSize: '0.95rem' }}>
              {mySucObject ? `Welcome, ${mySucObject.sucName}! Manage your institution profile or explore the SUC directory.` : 'Welcome! View and edit your institution details below.'}
            </p>
          </div>
          {user?.occCode && (
            <div>
              <span className="badge bg-light text-primary fs-6 fw-semibold px-3 py-2 shadow-sm d-flex align-items-center">
                <i className="bi bi-person-workspace me-2 fs-5 text-warning"></i>
                SUC Code: {user.occCode}
              </span>
            </div>
          )}
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
        
        {/* Card 1: My Profile Health */}
        <div className="col-md-4">
          <div 
            className={`card shadow-sm border-0 h-100 stat-card-interactive ${activeTab === 'my-institution' ? 'stat-card-active' : ''}`}
            onClick={() => setActiveTab('my-institution')}
            style={{ borderLeft: '4px solid var(--ched-navy)', borderRadius: '10px' }}
          >
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-person-fill-check fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>My Profile Status</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{myCompleteness}% Complete</h2>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Click to view your profile</small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contact status */}
        <div className="col-md-4">
          <div 
            className="card shadow-sm border-0 h-100" 
            style={{ borderLeft: '4px solid var(--ched-accent)', borderRadius: '10px' }}
          >
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-info bg-opacity-10 text-info me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-shield-check fs-3"></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Assigned Commission</h6>
                <h2 className="card-title mb-0 fw-bold text-dark" style={{ fontSize: '1.25rem' }}>
                  {mySucObject?.chedOfficial || 'None Assigned'}
                </h2>
                <small className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 mt-1">
                  {mySucObject?.section || 'Section —'}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Total SUC Directory */}
        <div className="col-md-4">
          <div 
            className={`card shadow-sm border-0 h-100 stat-card-interactive ${activeTab === 'directory' ? 'stat-card-active' : ''}`}
            onClick={() => setActiveTab('directory')}
            style={{ borderLeft: '4px solid var(--ched-gold)', borderRadius: '10px' }}
          >
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-globe fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Total SUC Directory</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{sucs.length}</h2>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Click to view other SUCs</small>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Tab Controller & View Selector */}
      <div className="bg-white p-3 rounded-3 shadow-sm mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          {/* Navigation tabs */}
          <ul className="nav nav-pills" style={{ gap: '8px' }}>
            <li className="nav-item">
              <button 
                className={`btn fw-bold px-4 py-2 ${activeTab === 'my-institution' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('my-institution')}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-house-door-fill me-2"></i>My SUC Profile (Editable)
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`btn fw-bold px-4 py-2 ${activeTab === 'directory' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('directory')}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-globe me-2"></i>SUC Directory (Read-only)
              </button>
            </li>
          </ul>

          {/* List/Grid switcher */}
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

        {/* Tab Context indicator */}
        <div className="mt-3 border-top pt-2">
          <span className="small text-muted fw-bold text-uppercase">Viewing: </span>
          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 ms-1" style={{ borderRadius: '6px' }}>
            {activeTab === 'my-institution' ? 'My SUC Profile' : 'SUC Directory (Read-Only)'}
          </span>
          <span className="text-muted small ms-2">({filtered.length} records found)</span>
        </div>
      </div>

      {/* Render table, grid, or analytics */}
      {viewMode === 'list' && (
        <div className="card shadow-sm border-0" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <div className="card-body p-0">
            <SucTable
              sucs={filtered}
              showActions
              isAdmin={false}
              onEdit={activeTab === 'my-institution' ? handleEdit : null} // Read-only on SUC Directory tab!
              onView={(suc) => { setSelectedSucDetail(suc); setShowQuickView(true); }}
              search={search}
              onSearchChange={setSearch}
            />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="fade-in">
          {/* Synchronized search bar for grid mode */}
          <div className="input-group shadow-sm mb-3 bg-white p-2 rounded-3" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-white border-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 ps-1"
              placeholder="Search SUCs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="suc-grid">
            {filtered.length === 0 ? (
              <div className="text-center py-5 w-100 bg-white rounded shadow-sm">
                <i className="bi bi-inbox fs-3 d-block text-muted mb-2"></i>
                <span className="text-muted">No SUC records found matching criteria</span>
              </div>
            ) : (
              filtered.map(suc => {
                const pct = calculateCompleteness(suc);
                const canModify = activeTab === 'my-institution' && isMySuc(suc);
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
                      </div>
                    </div>
                    
                    <div className="suc-card-footer">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedSucDetail(suc); setShowQuickView(true); }}>
                        <i className="bi bi-eye"></i> Quick View
                      </button>
                      {canModify && (
                        <button className="btn btn-sm btn-warning text-dark fw-semibold" onClick={() => handleEdit(suc)}>
                          <i className="bi bi-pencil-square"></i> Edit Profile
                        </button>
                      )}
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
          
          {/* Completeness score donut */}
          <div className="col-lg-4 col-md-6">
            <div className="chart-card h-100 text-center">
              <h5 className="fw-bold mb-3 text-dark">{activeTab === 'my-institution' ? 'My Profile Completeness' : 'Directory Data Completeness'}</h5>
              <div className="pie-simulation py-3">
                <div className="completion-donut" style={{ background: pieGradient }}>
                  <div className="completion-donut-inner">
                    <h2 className="mb-0 fw-bold text-primary">
                      {activeTab === 'my-institution' 
                        ? myCompleteness 
                        : sucs.length > 0 ? Math.round(sucs.reduce((acc, s) => acc + calculateCompleteness(s), 0) / sucs.length) : 0}%
                    </h2>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Completeness</small>
                  </div>
                </div>
              </div>
              <div className="text-muted small mt-3 border-top pt-2">
                <div><strong className="text-success">{currentSet.filter(s => calculateCompleteness(s) === 100).length}</strong> / {currentSet.length} SUC Profiles are 100% complete</div>
              </div>
            </div>
          </div>

          {/* Regional distribution */}
          <div className="col-lg-4 col-md-6">
            <div className="chart-card h-100">
              <h5 className="fw-bold mb-3 text-dark">Regional Distribution</h5>
              <div className="bar-chart-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
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

          {/* Section Distribution */}
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

      {/* Toast Notification */}
      {toastMsg && (
        <div className="clipboard-toast shadow-lg">
          <i className="bi bi-clipboard-check-fill text-success fs-5"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Edit Modal */}
      <EditSucModal
        show={showEdit}
        onClose={() => { setShowEdit(false); setSelectedSuc(null); }}
        onSave={handleEditSave}
        suc={selectedSuc}
        allowedSections={['Chairperson', 'Commissioner', 'Other']}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        show={showQuickView}
        onClose={() => { setShowQuickView(false); setSelectedSucDetail(null); }}
        suc={selectedSucDetail}
        onEdit={activeTab === 'my-institution' && isMySuc(selectedSucDetail) ? handleEdit : null}
      />
    </div>
  );
}

export default SucDashboard;
