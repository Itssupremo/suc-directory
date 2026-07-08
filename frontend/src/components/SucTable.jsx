import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const ALL_COLUMNS = [
  { key: 'region', label: 'Region' },
  { key: 'sucName', label: 'SUC Name' },
  { key: 'president', label: 'President' },
  { key: 'email', label: 'Email' },
  { key: 'contact', label: 'Contact' },
  { key: 'boardSecretaryName', label: 'Board Secretary' },
  { key: 'boardSecretaryEmail', label: 'Board Sec Email' },
  { key: 'boardSecretaryContact', label: 'Board Sec Contact' },
  { key: 'chedOfficial', label: 'CHED Official' },
];

function SucTable({ sucs, onEdit, onDelete, onTransfer, onView, showActions = false, isAdmin = false, search, onSearchChange, officialFilter, onOfficialFilterChange, officials }) {
  const printRef = useRef();
  const [showPrintOpts, setShowPrintOpts] = useState(false);
  const [printCols, setPrintCols] = useState(() => ALL_COLUMNS.map((c) => c.key));
  const [toastMsg, setToastMsg] = useState(null);

  const togglePrintCol = (key) => {
    setPrintCols((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label} to clipboard!`);
  };

  const getCompleteness = (suc) => {
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
    const percentage = Math.round((filled / fields.length) * 100);
    return {
      percentage,
      isComplete: percentage === 100
    };
  };

  const handlePrint = () => {
    const table = printRef.current;
    if (!table) return;
    // Build filter subtitle
    const filterParts = [];
    if (officialFilter && officials) {
      const off = officials.find((o) => o.code === officialFilter);
      if (off) filterParts.push(off.name);
    }
    const filterSubtitle = filterParts.length > 0 ? `<p style="font-size:0.9rem;margin:4px 0 0;font-weight:600">${filterParts.join(' | ')}</p>` : '';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>SUC Directory</title>
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
      @media print{.no-print{display:none}}
      </style></head><body>
      <div class="print-header">
        <img src="/ched-bp-logo.png" alt="CHED"/>
        <h4>Commission on Higher Education</h4>
        <p>SUC Directory Management System</p>
        ${filterSubtitle}
      </div>
      <table class="table table-bordered table-sm">
        <thead><tr><th>#</th>${printCols.map((k) => `<th>${ALL_COLUMNS.find((c) => c.key === k)?.label || k}</th>`).join('')}</tr></thead>
        <tbody>${sucs.map((suc, idx) => `<tr><td>${idx + 1}</td>${printCols.map((k) => {
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
    const data = sucs.map((suc, idx) => {
      const row = { '#': idx + 1 };
      printCols.forEach((k) => {
        const col = ALL_COLUMNS.find((c) => c.key === k);
        if (k === 'sucName') {
          row['SUC Name'] = suc.sucName || '';
          row['Abbreviation'] = suc.abbreviation || '';
          row['Address'] = suc.address || '';
        } else {
          row[col?.label || k] = suc[k] || '';
        }
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SUC Directory');
    XLSX.writeFile(wb, 'SUC_Directory.xlsx');
  };

  return (
    <div>
      {/* Toolbar: search, filter, print */}
      {showActions && (
        <div className="d-flex flex-wrap gap-3 align-items-center p-3 bg-light border-bottom">
          {/* Search Box */}
          <div className="input-group shadow-sm" style={{ maxWidth: 320, borderRadius: '8px', overflow: 'hidden' }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-1"
              placeholder="Search SUC, president, region..."
              value={search || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>

          {/* Official Filter */}
          {onOfficialFilterChange && (
            <div className="input-group shadow-sm" style={{ maxWidth: 280, borderRadius: '8px', overflow: 'hidden' }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-funnel"></i>
              </span>
              <select
                className="form-select border-start-0 ps-1"
                value={officialFilter || ''}
                onChange={(e) => onOfficialFilterChange && onOfficialFilterChange(e.target.value)}
              >
                <option value="">All CHED Officials</option>
                {(officials || []).map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="ms-auto d-flex gap-2 position-relative">
            <button className="btn btn-outline-success d-flex align-items-center shadow-sm px-3" onClick={handleDownloadExcel} style={{ borderRadius: '8px', fontWeight: 600 }}>
              <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
            </button>
            <button className="btn btn-outline-secondary d-flex align-items-center shadow-sm px-3" onClick={() => setShowPrintOpts(!showPrintOpts)} style={{ borderRadius: '8px', fontWeight: 600 }}>
              <i className="bi bi-printer me-2"></i>Print
            </button>
            {showPrintOpts && (
              <div className="position-absolute end-0 mt-2 p-3 bg-white border rounded-3 shadow-lg" style={{ zIndex: 1050, minWidth: 240 }}>
                <h6 className="mb-2 fw-bold text-dark" style={{ fontSize: '0.82rem' }}>Select columns to print:</h6>
                {ALL_COLUMNS.map((col) => (
                  <div key={col.key} className="form-check my-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`print-${col.key}`}
                      checked={printCols.includes(col.key)}
                      onChange={() => togglePrintCol(col.key)}
                    />
                    <label className="form-check-label small fw-medium" htmlFor={`print-${col.key}`}>{col.label}</label>
                  </div>
                ))}
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary btn-sm flex-grow-1 fw-semibold" onClick={handlePrint}>
                    Print Directory
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPrintOpts(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-responsive" ref={printRef}>
        <table className="table table-bordered table-striped table-hover align-middle mb-0">
          <thead className="table-light text-dark" style={{ borderBottom: '3px solid var(--ched-gold)' }}>
            <tr>
              <th className="py-3 px-3 text-dark fw-bold">#</th>
              <th className="py-3 px-3 text-dark fw-bold">Region</th>
              <th className="py-3 px-3 text-dark fw-bold">SUC Name</th>
              <th className="py-3 px-3 text-dark fw-bold">President</th>
              {showActions && (
                <>
                  <th className="py-3 px-2 text-dark fw-bold">Email</th>
                  <th className="py-3 px-2 text-dark fw-bold">Contact</th>
                  <th className="py-3 px-2 text-dark fw-bold">Board Secretary</th>
                  <th className="py-3 px-2 text-dark fw-bold">Board Sec Email</th>
                  <th className="py-3 px-2 text-dark fw-bold">Board Sec Contact</th>
                  <th className="py-3 px-2 text-dark fw-bold">CHED Official</th>
                  <th className="py-3 px-3 text-dark fw-bold text-center">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sucs.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 11 : 4} className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                  No SUC records found
                </td>
              </tr>
            ) : (
              sucs.map((suc, idx) => (
                <tr key={suc._id}>
                  <td className="px-3 fw-bold text-muted">{idx + 1}</td>
                  <td className="px-3"><span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">{suc.region}</span></td>
                  <td className="px-3">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <strong className="text-dark">{suc.sucName}</strong>
                      {suc.abbreviation && <span className="badge bg-primary bg-opacity-10 text-primary">{suc.abbreviation}</span>}
                      {(() => {
                        const { percentage, isComplete } = getCompleteness(suc);
                        return (
                          <span 
                            className={`completeness-badge ${isComplete ? 'complete' : 'incomplete'}`} 
                            title={`Profile is ${percentage}% complete`}
                            style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                          >
                            <i className={`bi ${isComplete ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                            {percentage}%
                          </span>
                        );
                      })()}
                    </div>
                    {suc.address && <div className="text-muted small mt-1"><i className="bi bi-geo-alt me-1"></i>{suc.address}</div>}
                  </td>
                  <td className="px-3 fw-medium">{suc.president || '—'}</td>
                  {showActions && (
                    <>
                      <td className="small px-2 text-wrap" style={{ maxWidth: '140px' }}>
                        {suc.email ? (
                          <div className="d-flex align-items-center justify-content-between gap-1">
                            <span className="text-truncate" title={suc.email}>{suc.email}</span>
                            <button className="copy-btn" onClick={() => handleCopyText(suc.email, 'Email')} title="Copy Email">
                              <i className="bi bi-clipboard"></i>
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="small px-2">
                        {suc.contact ? (
                          <div className="d-flex align-items-center justify-content-between gap-1">
                            <span>{suc.contact}</span>
                            <button className="copy-btn" onClick={() => handleCopyText(suc.contact, 'Contact Number')} title="Copy Contact">
                              <i className="bi bi-clipboard"></i>
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="small px-2 fw-medium">{suc.boardSecretaryName || '—'}</td>
                      <td className="small px-2 text-wrap" style={{ maxWidth: '140px' }}>
                        {suc.boardSecretaryEmail ? (
                          <div className="d-flex align-items-center justify-content-between gap-1">
                            <span className="text-truncate" title={suc.boardSecretaryEmail}>{suc.boardSecretaryEmail}</span>
                            <button className="copy-btn" onClick={() => handleCopyText(suc.boardSecretaryEmail, 'Board Sec Email')} title="Copy Email">
                              <i className="bi bi-clipboard"></i>
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="small px-2">
                        {suc.boardSecretaryContact ? (
                          <div className="d-flex align-items-center justify-content-between gap-1">
                            <span>{suc.boardSecretaryContact}</span>
                            <button className="copy-btn" onClick={() => handleCopyText(suc.boardSecretaryContact, 'Board Sec Contact')} title="Copy Contact">
                              <i className="bi bi-clipboard"></i>
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="small px-2 fw-bold text-primary">{suc.chedOfficial || '—'}</td>
                      <td className="px-3">
                        <div className="d-flex gap-1 justify-content-center">
                          {onView && (
                            <button className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center p-2" title="Quick View" onClick={() => onView(suc)} style={{ borderRadius: '6px' }}>
                              <i className="bi bi-eye fs-6"></i>
                            </button>
                          )}
                          {onEdit && (
                            <button className="btn btn-sm btn-outline-warning d-flex align-items-center justify-content-center p-2" title="Edit" onClick={() => onEdit(suc)} style={{ borderRadius: '6px' }}>
                              <i className="bi bi-pencil-square fs-6"></i>
                            </button>
                          )}
                          {isAdmin && onDelete && (
                            <button className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center p-2" title="Delete" onClick={() => onDelete(suc._id)} style={{ borderRadius: '6px' }}>
                              <i className="bi bi-trash fs-6"></i>
                            </button>
                          )}
                          {isAdmin && onTransfer && (
                            <button className="btn btn-sm btn-outline-info d-flex align-items-center justify-content-center p-2" title="Transfer" onClick={() => onTransfer(suc)} style={{ borderRadius: '6px' }}>
                              <i className="bi bi-arrow-left-right fs-6"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Clipboard Copy Toast Notification */}
      {toastMsg && (
        <div className="clipboard-toast shadow-lg">
          <i className="bi bi-clipboard-check-fill text-success fs-5"></i>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export default SucTable;
