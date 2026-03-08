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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Admin Dashboard</h3>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add SUC
        </button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card shadow-sm">
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
