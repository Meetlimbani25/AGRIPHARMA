import React, { useEffect, useState } from 'react';
import { getAdminShopkeepers, updateShopkeeperApproval } from '../services/api';
import './AdminPanel.css';

export default function AdminPanel() {
  const [shopkeepers, setShopkeepers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadShopkeepers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminShopkeepers();
      setShopkeepers(res.data.shopkeepers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load shopkeepers.');
    } finally {
      setLoading(false);
    }
  };

  const setApproval = async (id, approve) => {
    try {
      await updateShopkeeperApproval(id, approve);
      await loadShopkeepers();
    } catch (err) {
      console.error('admin approval error', err);
      setError(err.response?.data?.message || 'Failed to update approval.');
    }
  };

  useEffect(() => {
    loadShopkeepers();
  }, []);

  return (
    <div className="admin-page page-enter">
      <div className="container" style={{ padding: '20px 0' }}>
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="section-subtitle">Manage system operations and verifications</p>



        {error && <div className="alert alert-error">{error}</div>}
        
        {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Shopkeeper</th><th>Mobile</th><th>Shop</th><th>City</th><th>Approved</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {shopkeepers.map(sk => (
                  <tr key={sk.id} className={sk.is_approved ? 'approved' : ''}>
                    <td>{sk.name}</td>
                    <td>{sk.mobile}</td>
                    <td>{sk.shop_name}</td>
                    <td>{sk.city}</td>
                    <td>{sk.is_approved ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="btn btn-success" onClick={() => setApproval(sk.id, true)} disabled={sk.is_approved}>Approve</button>
                      <button className="btn btn-danger" onClick={() => setApproval(sk.id, false)} disabled={!sk.is_approved}>Reject</button>
                    </td>
                  </tr>
                ))}
                {shopkeepers.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center'}}>No shopkeepers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
