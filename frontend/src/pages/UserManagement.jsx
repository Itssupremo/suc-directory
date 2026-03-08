import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

const OCC_OPTIONS = [
  { code: '', label: 'None' },
  { code: 'OCSCA', label: 'OCSCA — Chairperson Shirley C. Agrupis' },
  { code: 'OCDRA', label: 'OCDRA — Commissioner Desiderio R. Apag III' },
  { code: 'OCRPA', label: 'OCRPA — Commissioner Ricmar P. Aquino' },
  { code: 'OCMQM', label: 'OCMQM — Commissioner Myrna Q. Mallari' },
  { code: 'OCMAO', label: 'OCMAO — Commissioner Michelle Aguilar-Ong' },
];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullname: '', username: '', password: '', role: 'user', occCode: '' });
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      showAlert('danger', 'Failed to load users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ fullname: '', username: '', password: '', role: 'user', occCode: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ fullname: user.fullname, username: user.username, password: '', role: user.role, occCode: user.occCode || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const data = { fullname: form.fullname, username: form.username, role: form.role, occCode: form.occCode };
        if (form.password) data.password = form.password;
        await updateUser(editing._id, data);
        showAlert('success', 'User updated successfully');
      } else {
        await createUser(form);
        showAlert('success', 'User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      showAlert('success', 'User deleted');
      fetchUsers();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.fullname.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.occCode || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">
          <i className="bi bi-people me-2"></i>User Management
        </h3>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-person-plus me-1"></i>Add User
        </button>
      </div>

      {alert && <div className={`alert alert-${alert.type} alert-dismissible fade show`}>{alert.msg}</div>}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="p-3 pb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ maxWidth: 300 }}
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle mb-0">
              <thead className="table-primary">
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>OCC Code</th>
                  <th>Created</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted">No users found</td></tr>
                ) : (
                  filtered.map((u, idx) => (
                    <tr key={u._id}>
                      <td>{idx + 1}</td>
                      <td>
                        <i className={`bi ${u.role === 'admin' ? 'bi-shield-check text-primary' : 'bi-person'} me-1`}></i>
                        {u.fullname}
                      </td>
                      <td><code>{u.username}</code></td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-info'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.occCode || '—'}</td>
                      <td className="small text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-warning" title="Edit" onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(u._id, u.username)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'var(--ched-navy)', color: '#fff' }}>
                <h5 className="modal-title">
                  <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-person-plus'} me-2`}></i>
                  {editing ? 'Edit User' : 'Create User'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <input type="text" className="form-control" value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Username</label>
                    <input type="text" className="form-control" value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Password {editing && <span className="text-muted fw-normal">(leave blank to keep current)</span>}
                    </label>
                    <input type="password" className="form-control" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      {...(!editing && { required: true })}
                      minLength={4} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Role</label>
                      <select className="form-select" value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">OCC Code</label>
                      <select className="form-select" value={form.occCode}
                        onChange={(e) => setForm({ ...form, occCode: e.target.value })}>
                        {OCC_OPTIONS.map((o) => (
                          <option key={o.code} value={o.code}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi ${editing ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                    {editing ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
