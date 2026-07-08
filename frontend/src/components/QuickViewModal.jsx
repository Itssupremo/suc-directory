import { useState } from 'react';

function QuickViewModal({ show, onClose, suc, onEdit, onTransfer, onDelete }) {
  const [copied, setCopied] = useState(false);

  if (!show || !suc) return null;

  // Compute completeness score
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
  const score = Math.round((filled / fields.length) * 100);

  const getCompletenessText = () => {
    if (score === 100) return 'Profile Complete (100%)';
    return `Incomplete Profile (${score}%)`;
  };

  const handleCopyDetails = () => {
    const detailsText = `SUC Name: ${suc.sucName || ''} ${suc.abbreviation ? `(${suc.abbreviation})` : ''}
Region: Region ${suc.region || '—'}
Address: ${suc.address || '—'}
Section: ${suc.section || '—'}
CHED Official Assigned: ${suc.chedOfficial || '—'}
Office Code: ${suc.occCode || '—'}

President/Institutional Head: ${suc.president || '—'}
President Email: ${suc.email || '—'}
President Contact: ${suc.contact || '—'}

Board Secretary: ${suc.boardSecretaryName || '—'}
Board Sec Email: ${suc.boardSecretaryEmail || '—'}
Board Sec Contact: ${suc.boardSecretaryContact || '—'}`;

    navigator.clipboard.writeText(detailsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal show d-block fade-in" tabIndex="-1" role="dialog" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'rgba(14, 19, 41, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg" role="document">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
          
          {/* Header */}
          <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', borderTopLeftRadius: '14px', borderTopRightRadius: '14px', borderBottom: '3px solid var(--ched-gold)' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-building-fill fs-4 text-warning"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">{suc.sucName}</h5>
                {suc.abbreviation && <span className="badge bg-light text-primary fw-bold mt-1">{suc.abbreviation}</span>}
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ backgroundColor: 'var(--ched-light)' }}>

            <div className="row g-4">
              {/* Left Column: General Info */}
              <div className="col-md-6">
                <div className="bg-white p-3 rounded-3 shadow-sm h-100">
                  <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                    <i className="bi bi-info-circle-fill me-2"></i>General Information
                  </h6>
                  
                  <div className="mb-2">
                    <label className="text-muted small fw-semibold d-block">REGION</label>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                      Region {suc.region || '—'}
                    </span>
                  </div>

                  <div className="mb-2">
                    <label className="text-muted small fw-semibold d-block">PHYSICAL ADDRESS</label>
                    <p className="small mb-0 text-dark fw-medium">{suc.address || '—'}</p>
                  </div>

                  <div className="mb-2">
                    <label className="text-muted small fw-semibold d-block">ASSIGNED CHED OFFICIAL</label>
                    <p className="small mb-0 text-dark fw-bold">{suc.chedOfficial || '—'}</p>
                  </div>

                  <div className="mb-2">
                    <label className="text-muted small fw-semibold d-block">OFFICE CODE (OCC)</label>
                    <p className="small mb-0 text-primary fw-bold">{suc.occCode || '—'}</p>
                  </div>


                </div>
              </div>

              {/* Right Column: Leadership & Board Sec */}
              <div className="col-md-6">
                <div className="d-flex flex-column gap-3 h-100">
                  
                  {/* President Card */}
                  <div className="bg-white p-3 rounded-3 shadow-sm flex-grow-1">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-person-fill me-2"></i>Institutional Leadership
                    </h6>
                    <div className="mb-2">
                      <label className="text-muted small fw-semibold d-block">PRESIDENT / OIC</label>
                      <p className="small mb-1 text-dark fw-bold">{suc.president || '—'}</p>
                    </div>
                  </div>

                  {/* Board Secretary Card */}
                  <div className="bg-white p-3 rounded-3 shadow-sm flex-grow-1">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-people-fill me-2"></i>Board Secretary
                    </h6>
                    <div className="mb-2">
                      <label className="text-muted small fw-semibold d-block">BOARD SECRETARY</label>
                      <p className="small mb-1 text-dark fw-bold">{suc.boardSecretaryName || '—'}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer bg-white border-0 py-3 d-flex justify-content-between" style={{ borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
            <div>
              <button 
                type="button" 
                className={`btn btn-${copied ? 'success' : 'outline-primary'} fw-bold px-3 d-flex align-items-center gap-2`} 
                onClick={handleCopyDetails}
                style={{ borderRadius: '8px' }}
              >
                <i className={`bi ${copied ? 'bi-clipboard-check-fill' : 'bi-clipboard-plus'}`}></i>
                {copied ? 'Copied!' : 'Copy Directory Details'}
              </button>
            </div>
            
            <div className="d-flex gap-2">
              {onEdit && (
                <button 
                  type="button" 
                  className="btn btn-warning fw-bold px-3 text-dark d-flex align-items-center gap-1"
                  onClick={() => { onEdit(suc); onClose(); }}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-pencil-square"></i> Edit
                </button>
              )}
              {onTransfer && (
                <button 
                  type="button" 
                  className="btn btn-info fw-bold px-3 text-white d-flex align-items-center gap-1"
                  onClick={() => { onTransfer(suc); onClose(); }}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-arrow-left-right"></i> Transfer
                </button>
              )}
              {onDelete && (
                <button 
                  type="button" 
                  className="btn btn-danger fw-bold px-3 d-flex align-items-center gap-1"
                  onClick={() => { onDelete(suc._id); onClose(); }}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-trash"></i> Delete
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-secondary fw-semibold px-4" 
                onClick={onClose}
                style={{ borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default QuickViewModal;
