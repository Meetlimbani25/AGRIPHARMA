import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import './Profile.css';

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const [form, setForm]   = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ ...user });
  }, [user]);

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await updateProfile(form);
      setUser({ ...user, ...form });
      setMsg('Profile updated successfully! ✅');
      setEditing(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="profile-page page-enter">
      <div className="container">
        <div className="page-header">
          <h1 className="section-title">👤 My Profile</h1>
        </div>

        <div className="profile-layout">
          {/* Avatar Card */}
          <div className="profile-avatar-card">
            <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <h3>{user?.name}</h3>
            <span className="badge badge-green">{role === 'farmer' ? '🌾 Farmer' : '🏪 Shopkeeper'}</span>
            {role === 'farmer' && (
              <div className="profile-mini-stats">
                {user?.village && <div><span>🏘️</span><span>{user.village}</span></div>}
                {user?.district && <div><span>🗺️</span><span>{user.district}</span></div>}
                {user?.land_size && <div><span>📐</span><span>{user.land_size} acres</span></div>}
                {user?.water_level && <div><span>💧</span><span>{user.water_level} water</span></div>}
              </div>
            )}
            {role === 'shopkeeper' && (
              <div className="profile-mini-stats">
                {user?.shop_name && <div><span>🏪</span><span>{user.shop_name}</span></div>}
                {user?.city && <div><span>📍</span><span>{user.city}</span></div>}
              </div>
            )}
          </div>

          {/* Edit Form */}
          <div className="profile-form-card">
            <div className="profile-form-header">
              <h3>Account Details</h3>
              {!editing ? (
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                    {loading ? '...' : '💾 Save'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setForm({...user}); setError(''); }}>Cancel</button>
                </div>
              )}
            </div>

            {msg   && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {role === 'farmer' && (
              <div className="form-cols">
                <div className="form-group">
                  <label>👤 Full Name</label>
                  <input value={form.name || ''} onChange={e => set('name', e.target.value)} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>📱 Mobile</label>
                  <input value={form.mobile || ''} disabled className="disabled-field" />
                </div>
                <div className="form-group">
                  <label>📧 Email</label>
                  <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>🏘️ Village</label>
                  <input value={form.village || ''} onChange={e => set('village', e.target.value)} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>📍 Taluko</label>
                  <input value={form.taluko || ''} onChange={e => set('taluko', e.target.value)} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>🗺️ District</label>
                  <input value={form.district || ''} onChange={e => set('district', e.target.value)} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>📐 Land Size (acres)</label>
                  <input type="number" value={form.land_size || ''} onChange={e => set('land_size', e.target.value)} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>💧 Water Level</label>
                  <select value={form.water_level || 'medium'} onChange={e => set('water_level', e.target.value)} disabled={!editing}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            )}

            {role === 'shopkeeper' && (
              <div className="form-cols">
                <div className="form-group">
                  <label>👤 Owner Name</label>
                  <input value={form.name || ''} disabled className="disabled-field" />
                </div>
                <div className="form-group">
                  <label>🏪 Shop Name</label>
                  <input value={form.shop_name || ''} disabled className="disabled-field" />
                </div>
                <div className="form-group">
                  <label>📱 Mobile</label>
                  <input value={form.mobile || ''} disabled className="disabled-field" />
                </div>
                <div className="form-group">
                  <label>🏙️ City</label>
                  <input value={form.city || ''} disabled className="disabled-field" />
                </div>
              </div>
            )}

            {!editing && (
              <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', marginTop: 8 }}>
                Click "Edit" to modify your profile. Mobile number cannot be changed.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
