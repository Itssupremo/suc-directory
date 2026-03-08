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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>User Dashboard</h3>
        {user?.occCode && (
          <span className="badge bg-primary fs-6 fw-semibold">
            <i className="bi bi-person-badge me-1"></i>
            {OCC_OFFICIALS[user.occCode] || user.occCode}
          </span>
        )}
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card shadow-sm">
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
