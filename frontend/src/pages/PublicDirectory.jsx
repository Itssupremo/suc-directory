import { useState, useEffect, useRef } from 'react';
import { getPublicSucs } from '../services/api';
import * as XLSX from 'xlsx';
import QuickViewModal from '../components/QuickViewModal';

const REGIONS = ['','NCR','1','2','3','4','MIMAROPA','5','6','NIR','7','8','9','10','11','12','CAR','CARAGA','BARMM'];

const OFFICIALS = [
  { code: 'OCSCA', name: 'Chairperson Shirley C. Agrupis' },
  { code: 'OCDRA', name: 'Commissioner Desiderio R. Apag III' },
  { code: 'OCRPA', name: 'Commissioner Ricmar P. Aquino' },
  { code: 'OCMQM', name: 'Commissioner Myrna Q. Mallari' },
  { code: 'OCMAO', name: 'Commissioner Michelle Aguilar-Ong' },
];

const OFFICIALS_MAP = {
  'OCSCA': 'Chairperson Shirley C. Agrupis',
  'OCDRA': 'Commissioner Desiderio R. Apag III',
  'OCRPA': 'Commissioner Ricmar P. Aquino',
  'OCMQM': 'Commissioner Myrna Q. Mallari',
  'OCMAO': 'Commissioner Michelle Aguilar-Ong',
};

function PublicDirectory() {
  const [sucs, setSucs] = useState([]);
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const [official, setOfficial] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPrintOpts, setShowPrintOpts] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  
  // Quick View details
  const [selectedSucDetail, setSelectedSucDetail] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);

  const PRINT_COLUMNS = [
    { key: 'region', label: 'Region' },
    { key: 'sucName', label: 'SUC Name' },
    { key: 'president', label: 'President' },
  ];
  const [printCols, setPrintCols] = useState(() => PRINT_COLUMNS.map((c) => c.key));

  const togglePrintCol = (key) => {
    setPrintCols((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handlePrint = () => {
    const filterParts = [];
    if (region) filterParts.push(`Region ${region}`);
    if (official) {
      const off = OFFICIALS.find((o) => o.code === official);
      if (off) filterParts.push(off.name);
    }
    const filterSubtitle = filterParts.length > 0 ? `<p style="font-size:0.9rem;margin:4px 0 0;font-weight:600">${filterParts.join(' | ')}</p>` : '';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>SUC Public Directory</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>body{font-family:'Montserrat',sans-serif;padding:20px}
      .print-header{text-align:center;margin-bottom:20px}
      .print-header img{height:60px}
      .print-header h4{margin:8px 0 2px;font-weight:700}
      .print-header p{color:#666;font-size:0.85rem;margin:0}
      table{width:100%;font-size:0.78rem}
      th{background:#1a1f3d;color:#fff;padding:6px 8px;white-space:nowrap}
      td{padding:5px 8px;vertical-align:top}
      .text-muted{color:#888}small{font-size:0.75rem}
      </style></head><body>
      <div class="print-header">
        <img src="/ched-bp-logo.png" alt="CHED"/>
        <h4>Commission on Higher Education</h4>
        <p>SUC Public Directory</p>
        ${filterSubtitle}
      </div>
      <table class="table table-bordered table-sm">
        <thead><tr><th>#</th>${printCols.map((k) => `<th>${PRINT_COLUMNS.find((c) => c.key === k)?.label || k}</th>`).join('')}</tr></thead>
        <tbody>${filtered.map((suc, idx) => `<tr><td>${idx + 1}</td>${printCols.map((k) => {
          if (k === 'sucName') return `<td><strong>${suc.sucName}</strong>${suc.abbreviation ? ` <span class="text-muted">(${suc.abbreviation})</span>` : ''}${suc.address ? `<br/><small class="text-muted">${suc.address}</small>` : ''}</td>`;
          return `<td>${suc[k] || ''}</td>`;
        }).join('')}</tr>`).join('')}</tbody>
      </table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
    setShowPrintOpts(false);
  };

  const handleDownloadExcel = () => {
    const data = filtered.map((suc, idx) => ({
      '#': idx + 1,
      'Region': suc.region || '',
      'SUC Name': suc.sucName || '',
      'Abbreviation': suc.abbreviation || '',
      'Address': suc.address || '',
      'President': suc.president || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SUC Directory');
    XLSX.writeFile(wb, 'SUC_Public_Directory.xlsx');
  };

  const fetchSucs = async (regionFilter) => {
    setLoading(true);
    try {
      const res = await getPublicSucs(regionFilter || undefined);
      setSucs(res.data);
    } catch {
      setSucs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSucs(region); }, [region]);

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
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      suc.sucName?.toLowerCase().includes(q) ||
      suc.address?.toLowerCase().includes(q) ||
      suc.president?.toLowerCase().includes(q) ||
      suc.region?.toLowerCase().includes(q);
    const matchesOfficial = !official || suc.occCode === official;
    return matchesSearch && matchesOfficial;
  });

  // Calculate statistics
  const totalSucs = sucs.length;
  const filteredCount = filtered.length;
  const regionsCount = new Set(sucs.map(s => s.region).filter(Boolean)).size;
  const overallCompleteness = totalSucs > 0
    ? Math.round(sucs.reduce((acc, s) => acc + calculateCompleteness(s), 0) / totalSucs)
    : 0;

  return (
    <div className="container-fluid px-0 fade-in">
      {/* Hero Header Banner */}
      <div 
        className="p-4 p-md-5 mb-4 text-white rounded-3 shadow animate-header" 
        style={{ 
          background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', 
          borderBottom: '5px solid var(--ched-gold)' 
        }}
      >
        <div className="row align-items-center">
          <div className="col-lg-8">
            <h1 className="display-5 fw-bold mb-2 d-flex align-items-center flex-wrap gap-2" style={{ fontSize: '2.2rem' }}>
              <i className="bi bi-bank2 text-warning"></i> SUC Public Directory
            </h1>
            <p className="lead mb-0 text-white-50" style={{ fontSize: '1.05rem', fontWeight: '500' }}>
              Access, search, and explore contact profiles and administrative information for all State Universities and Colleges coordinating under CHED.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="row g-3 mb-4">
        {/* Stat 1: Total SUCs */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid var(--ched-navy)', borderRadius: '10px' }}>
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-building fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Total Registered SUCs</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{totalSucs}</h2>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Across all regions and offices</small>
              </div>
            </div>
          </div>
        </div>

        {/* Stat 2: Regions Represented */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid var(--ched-gold)', borderRadius: '10px' }}>
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-map fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Regions Represented</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{regionsCount}</h2>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Active regional offices in database</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Filters & Export Toolbar */}
      <div className="bg-white p-3 rounded-3 shadow-sm mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Left: Input Filters */}
          <div className="d-flex flex-wrap gap-2 flex-grow-1" style={{ maxWidth: '850px' }}>
            <div className="input-group shadow-sm" style={{ minWidth: '240px', maxWidth: '360px', flex: 1 }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder="Search SUC name, address, president..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="input-group shadow-sm" style={{ width: '170px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-geo-alt"></i>
              </span>
              <select className="form-select border-start-0 ps-1" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">All Regions</option>
                {REGIONS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>Region {r}</option>
                ))}
              </select>
            </div>

            <div className="input-group shadow-sm" style={{ minWidth: '200px', maxWidth: '280px', flex: 1 }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-person-badge"></i>
              </span>
              <select className="form-select border-start-0 ps-1" value={official} onChange={(e) => setOfficial(e.target.value)}>
                <option value="">All CHED Officials</option>
                {OFFICIALS.map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: View Mode Toggle & Export Controls */}
          <div className="d-flex align-items-center gap-2">
            
            {/* View Mode Switcher */}
            <div className="btn-group shadow-sm me-2" role="group" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <button 
                type="button" 
                className={`btn btn-sm d-flex align-items-center gap-1 ${viewMode === 'list' ? 'btn-primary' : 'btn-light text-dark'}`}
                onClick={() => setViewMode('list')}
                title="List Table View"
              >
                <i className="bi bi-list-task"></i> List
              </button>
              <button 
                type="button" 
                className={`btn btn-sm d-flex align-items-center gap-1 ${viewMode === 'grid' ? 'btn-primary' : 'btn-light text-dark'}`}
                onClick={() => setViewMode('grid')}
                title="Grid Card View"
              >
                <i className="bi bi-grid-3x3-gap-fill"></i> Grid
              </button>
            </div>

            {/* SUC counter badge */}
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 fs-6 border border-primary border-opacity-10" style={{ borderRadius: '6px' }}>
              {filteredCount} SUCs Found
            </span>

            {/* Export buttons */}
            <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 fw-bold px-3 py-2" onClick={handleDownloadExcel} style={{ borderRadius: '6px' }}>
              <i className="bi bi-file-earmark-excel-fill"></i> Excel
            </button>
            
            <div className="position-relative">
              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fw-bold px-3 py-2" onClick={() => setShowPrintOpts(!showPrintOpts)} style={{ borderRadius: '6px' }}>
                <i className="bi bi-printer-fill"></i> Print
              </button>
              {showPrintOpts && (
                <div className="position-absolute end-0 mt-1 p-3 bg-white border rounded shadow-lg" style={{ zIndex: 1050, minWidth: 240, borderRadius: '10px' }}>
                  <h6 className="mb-2 fw-bold text-dark" style={{ fontSize: '0.82rem' }}>Select columns to print:</h6>
                  {PRINT_COLUMNS.map((col) => (
                    <div key={col.key} className="form-check mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`print-${col.key}`}
                        checked={printCols.includes(col.key)}
                        onChange={() => togglePrintCol(col.key)}
                      />
                      <label className="form-check-label small text-muted fw-semibold" htmlFor={`print-${col.key}`}>{col.label}</label>
                    </div>
                  ))}
                  <div className="d-flex gap-2 mt-3 pt-2 border-top">
                    <button className="btn btn-sm btn-primary flex-grow-1 fw-bold" onClick={handlePrint}>
                      <i className="bi bi-printer-fill me-1"></i>Print
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPrintOpts(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading SUC profiles...</span>
          </div>
          <p className="text-muted mt-2 small fw-semibold">Loading SUC profiles...</p>
        </div>
      ) : (
        <div>
          {/* GRID CARD VIEW */}
          {viewMode === 'grid' && (
            <div className="suc-grid fade-in">
              {filtered.length === 0 ? (
                <div className="text-center py-5 w-100 bg-white rounded shadow-sm">
                  <i className="bi bi-inbox fs-3 d-block text-muted mb-2"></i>
                  <span className="text-muted fw-semibold">No SUC records found matching your filters.</span>
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
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small fw-semibold">Chair Designate:</span>
                            <span className="badge bg-light text-primary fw-bold text-truncate" style={{ maxWidth: '140px' }} title={OFFICIALS_MAP[suc.occCode] || '—'}>
                              {suc.occCode || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="suc-card-footer justify-content-center">
                        <button className="btn btn-sm btn-outline-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-1" onClick={() => { setSelectedSucDetail(suc); setShowQuickView(true); }}>
                          <i className="bi bi-eye-fill"></i> View SUC Details
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST TABLE VIEW */}
          {viewMode === 'list' && (
            <div className="card shadow-sm border-0 fade-in" style={{ borderRadius: '10px', overflow: 'hidden' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-striped table-hover align-middle mb-0 custom-suc-table">
                    <thead className="table-light text-dark" style={{ borderBottom: '3px solid var(--ched-gold)' }}>
                      <tr>
                        <th className="px-3 py-3 text-dark fw-bold" style={{ width: '60px' }}>#</th>
                        <th className="px-3 py-3 text-dark fw-bold" style={{ width: '120px' }}>Region</th>
                        <th className="px-3 py-3 text-dark fw-bold">SUC Name & Address</th>
                        <th className="px-3 py-3 text-dark fw-bold">President</th>
                        <th className="px-3 py-3 text-dark fw-bold" style={{ width: '220px' }}>Chair Designate</th>
                        <th className="px-3 py-3 text-dark fw-bold text-center" style={{ width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted fw-semibold">No records found</td>
                        </tr>
                      ) : (
                        filtered.map((suc, idx) => {
                          const pct = calculateCompleteness(suc);
                          return (
                            <tr key={suc._id}>
                              <td className="px-3 text-muted fw-bold">{idx + 1}</td>
                              <td className="px-3">
                                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 fw-bold">
                                  Region {suc.region}
                                </span>
                              </td>
                              <td className="px-3">
                                <div className="d-flex align-items-center flex-wrap gap-2">
                                  <strong className="text-dark" style={{ fontSize: '0.92rem' }}>{suc.sucName}</strong>
                                  {suc.abbreviation && <span className="badge bg-primary bg-opacity-10 text-primary">{suc.abbreviation}</span>}
                                </div>
                                {suc.address && <div className="text-muted small mt-1"><i className="bi bi-geo-alt me-1"></i>{suc.address}</div>}
                              </td>
                              <td className="px-3 fw-medium text-dark">{suc.president || '—'}</td>
                              <td className="px-3">
                                {suc.occCode ? (
                                  <span className="small fw-bold text-primary">
                                    {OFFICIALS_MAP[suc.occCode] || suc.chedOfficial}
                                  </span>
                                ) : <span className="text-muted small">—</span>}
                              </td>
                              <td className="px-3 text-center">
                                <button 
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center p-2"
                                  onClick={() => { setSelectedSucDetail(suc); setShowQuickView(true); }}
                                  title="View Details"
                                  style={{ borderRadius: '6px', width: '34px', height: '34px' }}
                                >
                                  <i className="bi bi-eye-fill fs-6"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUC Profile Quick View Modal */}
      {showQuickView && (
        <QuickViewModal
          show={showQuickView}
          onClose={() => { setShowQuickView(false); setSelectedSucDetail(null); }}
          suc={selectedSucDetail}
          onEdit={null} // Read-only for guest/public visitors
        />
      )}
    </div>
  );
}

export default PublicDirectory;
