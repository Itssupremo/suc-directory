import { useState, useEffect } from 'react';
import { getSucs, updateSuc } from '../services/api';
import SucTable from '../components/SucTable';
import EditSucModal from '../components/EditSucModal';

const ALLOWED_SECTIONS = ['Chairperson', 'Commissioner'];

const OCC_OFFICIALS = {
  'OCSCA': 'Chairperson Shirley C. Agrupis',
  'OCDRA': 'Commissioner Desiderio R. Apag III',
  'OCRPA': 'Commissioner Ricmar P. Aquino',
  'OCMQM': 'Commissioner Myrna Q. Mallari',
  'OCMAO': 'Commissioner Michelle Aguilar-Ong',
};

function UserDashboard({ user }) {
  const [sucs, setSucs] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedSuc, setSelectedSuc] = useState(null);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');

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

  const filtered = sucs.filter((suc) => {
    const q = search.toLowerCase();
    return !q || suc.sucName.toLowerCase().includes(q) || suc.president?.toLowerCase().includes(q) || suc.region?.toLowerCase().includes(q) || suc.abbreviation?.toLowerCase().includes(q);
  });

  const showMessage = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = (suc) => {
    if (!ALLOWED_SECTIONS.includes(suc.section)) {
      showMessage('warning', 'You can only edit Chairperson or Commissioner SUCs');
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

  return (
    <div className="container-fluid px-0">
      {/* Header Banner */}
      <div className="p-4 mb-4 text-white rounded-3 shadow" style={{ background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', borderBottom: '4px solid var(--ched-gold)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="display-6 fw-bold mb-1" style={{ fontSize: '1.8rem' }}>
              <i className="bi bi-person-workspace me-2"></i>User Dashboard
            </h1>
            <p className="lead mb-0 text-white-50" style={{ fontSize: '0.95rem' }}>
              Welcome back! View and edit your assigned State Universities and Colleges.
            </p>
          </div>
          {user?.occCode && (
            <div>
              <span className="badge bg-light text-primary fs-6 fw-semibold px-3 py-2 shadow-sm d-flex align-items-center">
                <i className="bi bi-person-badge-fill me-2 fs-5 text-warning"></i>
                {OCC_OFFICIALS[user.occCode] || user.occCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} d-flex align-items-center shadow-sm border-0`} role="alert" style={{ borderRadius: '8px' }}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} me-2 fs-5`}></i>
          <div>{alert.msg}</div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid var(--ched-navy)', borderRadius: '10px' }}>
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-building fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Your Assigned SUCs</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">
                  {sucs.filter(s => s.occCode === user?.occCode).length}
                </h2>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid var(--ched-accent)', borderRadius: '10px' }}>
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-info bg-opacity-10 text-info me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-geo-alt fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Your Regions</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">
                  {new Set(sucs.filter(s => s.occCode === user?.occCode).map(s => s.region).filter(Boolean)).size}
                </h2>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid var(--ched-gold)', borderRadius: '10px' }}>
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-globe fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Total Directory SUCs</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{sucs.length}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <div className="card-body p-0">
          <SucTable
            sucs={filtered}
            showActions
            isAdmin={false}
            onEdit={handleEdit}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </div>

      <EditSucModal
        show={showEdit}
        onClose={() => { setShowEdit(false); setSelectedSuc(null); }}
        onSave={handleEditSave}
        suc={selectedSuc}
        allowedSections={ALLOWED_SECTIONS}
      />
    </div>
  );
}

export default UserDashboard;
