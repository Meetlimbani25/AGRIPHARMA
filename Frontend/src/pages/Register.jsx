import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { registerFarmer, registerShopkeeper } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const initialFarmer = {
  name: '', village: '', taluko: '', district: '',
  land_size: '', mobile: '', email: '',
  water_level: 'medium', password: '', confirm_password: ''
};
const initialShop = {
  name: '', shop_name: '', mobile: '', email: '',
  address: '', city: '', district: '', pincode: '',
  gst_number: '', upi_id: '', upi_name: '', password: '', confirm_password: ''
};

export default function Register() {
  const { type } = useParams();
  const [tab, setTab] = useState(type === 'shopkeeper' ? 'shopkeeper' : 'farmer');
  const [farmerForm, setFarmerForm] = useState(initialFarmer);
  const [shopForm, setShopForm]     = useState(initialShop);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const setF = (k, v) => setFarmerForm(f => ({ ...f, [k]: v }));
  const setS = (k, v) => setShopForm(f => ({ ...f, [k]: v }));

  const handleFarmerSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (farmerForm.password !== farmerForm.confirm_password) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { confirm_password, ...data } = farmerForm;
      const res = await registerFarmer(data);
      loginUser(res.data.token, res.data.farmer, 'farmer');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (shopForm.password !== shopForm.confirm_password) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { confirm_password, ...data } = shopForm;
      await registerShopkeeper(data);
      setSuccess('Registration successful! Please wait for admin approval before logging in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-bg">
        <div className="auth-sky">
          <div className="auth-sun"></div>
          <div className="cloud c1"></div><div className="cloud c2"></div><div className="cloud c3"></div>
        </div>
        <div className="auth-field"></div>
        <div className="auth-tractor">🚜</div>
        <div className="auth-crops">
          {[...Array(8)].map((_,i) => <div key={i} className="auth-crop">🌾</div>)}
        </div>
      </div>

      <div className="auth-container" style={{ maxWidth: tab === 'shopkeeper' ? 680 : 520 }}>
        <div className="auth-card">
          <div className="auth-logo">
            <span>🌿</span>
            <span className="auth-logo-text">Agri<span>Pharma</span></span>
          </div>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join our community of farmers and agricultural enthusiasts</p>

          <div className="auth-tabs">
            <button className={tab === 'farmer' ? 'active' : ''} onClick={() => { setTab('farmer'); setError(''); setSuccess(''); }}>🌾 Farmer</button>
            <button className={tab === 'shopkeeper' ? 'active' : ''} onClick={() => { setTab('shopkeeper'); setError(''); setSuccess(''); }}>🏪 Shopkeeper</button>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success} <Link to="/login">Login here</Link></div>}

          {/* ── FARMER FORM ── */}
          {tab === 'farmer' && (
            <form onSubmit={handleFarmerSubmit}>
              <div className="form-cols">
                <div className="form-group">
                  <label>👤 Full Name *</label>
                  <input required placeholder="Your full name" value={farmerForm.name} onChange={e => setF('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📱 Mobile *</label>
                  <input required type="tel" placeholder="10-digit mobile" value={farmerForm.mobile} onChange={e => setF('mobile', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📧 Email</label>
                  <input type="email" placeholder="Optional email" value={farmerForm.email} onChange={e => setF('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🏘️ Village</label>
                  <input placeholder="Village name" value={farmerForm.village} onChange={e => setF('village', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📍 Taluko</label>
                  <input placeholder="Taluko" value={farmerForm.taluko} onChange={e => setF('taluko', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🗺️ District</label>
                  <input placeholder="District" value={farmerForm.district} onChange={e => setF('district', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📐 Land Size (acres)</label>
                  <input type="number" min="0.1" step="0.1" placeholder="e.g. 2.5" value={farmerForm.land_size} onChange={e => setF('land_size', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>💧 Water Level</label>
                  <select value={farmerForm.water_level} onChange={e => setF('water_level', e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>🔒 Password *</label>
                  <input required type="password" placeholder="Create a password" value={farmerForm.password} onChange={e => setF('password', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🔒 Confirm Password *</label>
                  <input required type="password" placeholder="Confirm password" value={farmerForm.confirm_password} onChange={e => setF('confirm_password', e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop: 8 }} disabled={loading}>
                {loading ? '...' : 'Create Farmer Account →'}
              </button>
            </form>
          )}

          {/* ── SHOPKEEPER FORM ── */}
          {tab === 'shopkeeper' && !success && (
            <form onSubmit={handleShopSubmit}>
              <div className="form-cols">
                <div className="form-group">
                  <label>👤 Owner Name *</label>
                  <input required placeholder="Your full name" value={shopForm.name} onChange={e => setS('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🏪 Shop Name *</label>
                  <input required placeholder="Your shop name" value={shopForm.shop_name} onChange={e => setS('shop_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📱 Mobile *</label>
                  <input required type="tel" placeholder="10-digit mobile" value={shopForm.mobile} onChange={e => setS('mobile', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📧 Email</label>
                  <input type="email" placeholder="Business email" value={shopForm.email} onChange={e => setS('email', e.target.value)} />
                </div>
                <div className="form-group form-full">
                  <label>📍 Address</label>
                  <input placeholder="Shop address" value={shopForm.address} onChange={e => setS('address', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🏙️ City</label>
                  <input placeholder="City" value={shopForm.city} onChange={e => setS('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🗺️ District</label>
                  <input placeholder="District" value={shopForm.district} onChange={e => setS('district', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📮 Pincode</label>
                  <input placeholder="Pincode" value={shopForm.pincode} onChange={e => setS('pincode', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📋 GST Number</label>
                  <input placeholder="GST (optional)" value={shopForm.gst_number} onChange={e => setS('gst_number', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🔢 UPI ID (Optional)</label>
                  <input placeholder="e.g. shop@upi" value={shopForm.upi_id} onChange={e => setS('upi_id', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🗣️ UPI Display Name</label>
                  <input placeholder="e.g. Bharat Store" value={shopForm.upi_name} onChange={e => setS('upi_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🔒 Password *</label>
                  <input required type="password" placeholder="Create password" value={shopForm.password} onChange={e => setS('password', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>🔒 Confirm Password *</label>
                  <input required type="password" placeholder="Confirm password" value={shopForm.confirm_password} onChange={e => setS('confirm_password', e.target.value)} />
                </div>
              </div>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                ℹ️ Shopkeeper accounts require admin approval before you can log in.
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
                {loading ? '...' : 'Submit Registration →'}
              </button>
            </form>
          )}

          <div className="auth-footer-links">
            <p>Already have an account? <Link to="/login">Login</Link></p>
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
