import { useState, useEffect } from 'react';
import { getSucs, createSuc, updateSuc, deleteSuc, transferSuc, getOccOfficials } from '../services/api';
import SucTable from '../components/SucTable';
import AddSucModal from '../components/AddSucModal';
import EditSucModal from '../components/EditSucModal';
import TransferModal from '../components/TransferModal';

function AdminDashboard() {
  const [sucs, setSucs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedSuc, setSelectedSuc] = useState(null);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [officialFilter, setOfficialFilter] = useState('');
  const [officials, setOfficials] = useState([]);

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

  const filtered = sucs.filter((suc) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || suc.sucName.toLowerCase().includes(q) || suc.president?.toLowerCase().includes(q) || suc.region?.toLowerCase().includes(q) || suc.abbreviation?.toLowerCase().includes(q);
    const matchesOfficial = !officialFilter || suc.occCode === officialFilter;
    return matchesSearch && matchesOfficial;
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

  return (
    <div className="container-fluid px-0">
      {/* Header Banner */}
      <div className="p-4 mb-4 text-white rounded-3 shadow" style={{ background: 'linear-gradient(135deg, var(--ched-navy) 0%, var(--ched-blue) 100%)', borderBottom: '4px solid var(--ched-gold)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="display-6 fw-bold mb-1" style={{ fontSize: '1.8rem' }}>
              <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
            </h1>
            <p className="lead mb-0 text-white-50" style={{ fontSize: '0.95rem' }}>
              Manage State Universities and Colleges (SUCs), view details, and assign OCC codes.
            </p>
          </div>
          <div>
            <button className="btn btn-light fw-bold px-4 py-2 shadow-sm d-flex align-items-center text-primary" onClick={() => setShowAdd(true)} style={{ borderRadius: '8px' }}>
              <i className="bi bi-plus-circle-fill me-2 fs-5"></i> Add SUC
            </button>
          </div>
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
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Total SUCs</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{sucs.length}</h2>
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
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Regions Covered</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{new Set(sucs.map(s => s.region).filter(Boolean)).size}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid var(--ched-gold)', borderRadius: '10px' }}>
            <div className="card-body d-flex align-items-center py-3">
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-person-badge fs-3"></i>
              </div>
              <div>
                <h6 className="card-subtitle text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Office Codes</h6>
                <h2 className="card-title mb-0 fw-bold text-dark">{new Set(sucs.map(s => s.occCode).filter(Boolean)).size}</h2>
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
            isAdmin
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTransfer={handleTransfer}
            search={search}
            onSearchChange={setSearch}
            officialFilter={officialFilter}
            onOfficialFilterChange={setOfficialFilter}
            officials={officials}
          />
        </div>
      </div>

      <AddSucModal show={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} />
      <EditSucModal show={showEdit} onClose={() => { setShowEdit(false); setSelectedSuc(null); }} onSave={handleEditSave} suc={selectedSuc} />
      <TransferModal show={showTransfer} onClose={() => { setShowTransfer(false); setSelectedSuc(null); }} onSave={handleTransferSave} suc={selectedSuc} />
    </div>
  );
}

export default AdminDashboard;
