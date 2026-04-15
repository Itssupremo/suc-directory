import { useState, useEffect } from 'react';
import { getPublicSucs } from '../services/api';

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

  const buildPrintHtml = (forPdf = false) => {
    const officialLabel = official ? OFFICIALS.find(o => o.code === official)?.name || official : '';
    return `
      <html><head><title>SUC Public Directory</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>body{font-family:'Montserrat',sans-serif;padding:20px}
      .print-header{text-align:center;margin-bottom:20px}
      .print-header img{height:60px}
      .print-header h4{margin:8px 0 2px;font-weight:700}
      .print-header p{color:#666;font-size:0.85rem;margin:0}
      .print-filters{text-align:center;margin-bottom:15px;font-size:0.85rem}
      table{width:100%;font-size:0.78rem}
      th{background:#1a1f3d;color:#fff;padding:6px 8px;white-space:nowrap}
      td{padding:5px 8px;vertical-align:top}
      .text-muted{color:#888}small{font-size:0.75rem}
      @media print{.no-print{display:none}}
      </style></head><body>
      <div class="print-header">
        <img src="/ched-bp-logo.png" alt="CHED"/>
        <h4>Commission on Higher Education</h4>
        <p>SUC Public Directory</p>
      </div>
      <div class="print-filters">
        <strong>Total:</strong> ${filtered.length} SUCs
        ${region ? ` &nbsp;|&nbsp; <strong>Region:</strong> ${region}` : ''}
        ${officialLabel ? ` &nbsp;|&nbsp; <strong>CHED Official:</strong> ${officialLabel}` : ''}
      </div>
      <table class="table table-bordered table-sm">
        <thead><tr><th>#</th>${ALL_COLUMNS.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${filtered.map((suc, idx) => `<tr>
          <td>${idx + 1}</td>
          <td>${suc.region || ''}</td>
          <td><strong>${suc.sucName}</strong>${suc.abbreviation ? ` <span class="text-muted">(${suc.abbreviation})</span>` : ''}${suc.address ? `<br/><small class="text-muted">${suc.address}</small>` : ''}</td>
          <td>${suc.president || ''}</td>
        </tr>`).join('')}</tbody>
      </table></body></html>`;
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(buildPrintHtml(false));
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

  const handleDownloadExcel = () => {
    const headers = ['#', ...ALL_COLUMNS.map((c) => c.label)];
    const rows = filtered.map((suc, idx) => {
      return [
        (idx + 1).toString(),
        suc.region || '',
        `${suc.sucName}${suc.abbreviation ? ` (${suc.abbreviation})` : ''}${suc.address ? ` - ${suc.address}` : ''}`,
        suc.president || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SUC_Public_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(buildPrintHtml(true));
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

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
            <div className="col-md-5 text-end d-flex align-items-center justify-content-end gap-2 flex-wrap">
              <span className="badge bg-primary fs-6">{filtered.length} SUCs</span>
              
              {/* Print Button - Direct print, no popup */}
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handlePrint}
                disabled={loading || filtered.length === 0}
                title="Print Directory"
              >
                <i className="bi bi-printer me-1"></i> Print
              </button>

              {/* Download Excel Button - Direct download */}
              <button
                className="btn btn-outline-success btn-sm"
                onClick={handleDownloadExcel}
                disabled={loading || filtered.length === 0}
                title="Download Excel"
              >
                <i className="bi bi-file-earmark-excel me-1"></i> Excel
              </button>

              {/* Download PDF Button - Direct download */}
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleDownloadPdf}
                disabled={loading || filtered.length === 0}
                title="Download PDF"
              >
                <i className="bi bi-file-earmark-pdf me-1"></i> PDF
              </button>
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
