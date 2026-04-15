import { useState, useEffect, useRef } from 'react';
import { getPublicSucs } from '../services/api';
import * as XLSX from 'xlsx';

const REGIONS = ['','NCR','1','2','3','4','MIMAROPA','5','6','NIR','7','8','9','10','11','12','CAR','CARAGA','BARMM'];

const OFFICIALS = [
  { code: 'OCSCA', name: 'Chairperson Shirley C. Agrupis' },
  { code: 'OCDRA', name: 'Commissioner Desiderio R. Apag III' },
  { code: 'OCRPA', name: 'Commissioner Ricmar P. Aquino' },
  { code: 'OCMQM', name: 'Commissioner Myrna Q. Mallari' },
  { code: 'OCMAO', name: 'Commissioner Michelle Aguilar-Ong' },
];

function PublicDirectory() {
  const [sucs, setSucs] = useState([]);
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const [official, setOfficial] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPrintOpts, setShowPrintOpts] = useState(false);
  const printRef = useRef();

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
    // Build filter subtitle
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

  const filtered = sucs.filter((suc) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      suc.sucName.toLowerCase().includes(q) ||
      suc.address?.toLowerCase().includes(q) ||
      suc.president?.toLowerCase().includes(q) ||
      suc.region?.toLowerCase().includes(q);
    const matchesOfficial = !official || suc.occCode === official;
    return matchesSearch && matchesOfficial;
  });

  return (
    <div>
      <h3 className="mb-3">SUC Public Directory</h3>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, address, president, or region..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">All Regions</option>
                {REGIONS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>Region {r}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={official} onChange={(e) => setOfficial(e.target.value)}>
                <option value="">All CHED Officials</option>
                {OFFICIALS.map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="col d-flex align-items-center justify-content-end gap-2">
              <span className="badge bg-primary fs-6">{filtered.length} SUCs</span>
              <button className="btn btn-sm btn-outline-success" onClick={handleDownloadExcel}>
                <i className="bi bi-file-earmark-excel me-1"></i>Excel
              </button>
              <div className="position-relative">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPrintOpts(!showPrintOpts)}>
                  <i className="bi bi-printer me-1"></i>Print
                </button>
                {showPrintOpts && (
                  <div className="position-absolute end-0 mt-1 p-3 bg-white border rounded shadow-sm" style={{ zIndex: 1050, minWidth: 220 }}>
                    <h6 className="mb-2" style={{ fontSize: '0.82rem' }}>Select columns to print:</h6>
                    {PRINT_COLUMNS.map((col) => (
                      <div key={col.key} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`print-${col.key}`}
                          checked={printCols.includes(col.key)}
                          onChange={() => togglePrintCol(col.key)}
                        />
                        <label className="form-check-label small" htmlFor={`print-${col.key}`}>{col.label}</label>
                      </div>
                    ))}
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-sm btn-primary flex-grow-1" onClick={handlePrint}>
                        <i className="bi bi-printer me-1"></i>Print
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPrintOpts(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle">
              <thead className="table-primary">
                <tr>
                  <th>#</th>
                  <th>Region</th>
                  <th>SUC Name</th>
                  <th>President</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">No records found</td>
                  </tr>
                ) : (
                  filtered.map((suc, idx) => (
                    <tr key={suc._id}>
                      <td>{idx + 1}</td>
                      <td>{suc.region}</td>
                      <td>
                        <strong>{suc.sucName}</strong>
                        {suc.abbreviation && <span className="text-muted ms-1">({suc.abbreviation})</span>}
                        {suc.address && <div className="text-muted small">{suc.address}</div>}
                      </td>
                      <td>{suc.president}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicDirectory;
