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
      suc.address.toLowerCase().includes(q) ||
      suc.president.toLowerCase().includes(q) ||
      suc.region.toLowerCase().includes(q);
    const matchesOfficial = !official || suc.occCode === official;
    return matchesSearch && matchesOfficial;
  });

  return (
    <div>
      <h3 className="mb-3">SUC Public Directory</h3>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, address, president, or region..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">All Regions</option>
                {REGIONS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>Region {r}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={official} onChange={(e) => setOfficial(e.target.value)}>
                <option value="">All CHED Officials</option>
                {OFFICIALS.map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 text-end">
              <span className="badge bg-primary fs-6 mt-2">{filtered.length} SUCs</span>
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
      )}
    </div>
  );
}

export default PublicDirectory;
