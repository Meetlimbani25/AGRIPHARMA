import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginFarmer, loginShopkeeper, requestPasswordResetOtp, resetPasswordWithOtp, adminLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [tab, setTab] = useState('farmer');
  const [form, setForm] = useState({ mobile: '', password: '' });
  
  const [isForgot, setIsForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [forgotForm, setForgotForm] = useState({ email: '', otp: '', newPassword: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, role, loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'shopkeeper') navigate('/shopkeeper');
      else navigate('/dashboard');
    }
  }, [user, role, navigate]);

  const validateMobile = (mobile) => /^\d{10}$/.test(mobile);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); 

    if (!validateMobile(form.mobile)) return setError('Please enter a valid 10-digit mobile number.');
    
    setLoading(true);

    try {
      // 1. Attempt admin login first
      const adminRes = await adminLogin(form);
      // If successful, log in as admin
      loginUser(adminRes.data.token, adminRes.data.admin, 'admin');
      navigate('/admin');
      return; // Exit function since login succeeded
    } catch (err) {
      // If error is 401 (Invalid credentials), it means it's a regular user login attempt.
      // We ignore the error and proceed to standard login below.
    }

    try {
      if (tab === 'farmer') {
        const res = await loginFarmer(form);
        loginUser(res.data.token, res.data.farmer, 'farmer');
        navigate('/dashboard');
      } else {
        const res = await loginShopkeeper(form);
        loginUser(res.data.token, res.data.shopkeeper, 'shopkeeper');
        navigate('/shopkeeper');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); 

    if (!validateEmail(forgotForm.email)) return setError('Please enter a valid email address.');
    
    setLoading(true);
    try {
      await requestPasswordResetOtp({ email: forgotForm.email, role: tab });
      setSuccess('OTP successfully sent to your email address!');
      setResetStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); 

    if (!validatePassword(forgotForm.newPassword)) return setError('New password must be at least 6 characters long.');
    
    setLoading(true);
    try {
      const res = await resetPasswordWithOtp({ 
        email: forgotForm.email, 
        role: tab, 
        otp: forgotForm.otp, 
        newPassword: forgotForm.newPassword 
      });
      setSuccess(res.data.message);
      setTimeout(() => {
        setIsForgot(false);
        setResetStep(1);
        setForgotForm({ email: '', otp: '', newPassword: '' });
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. OTP may be invalid.');
    } finally {
      setLoading(false);
    }
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

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <span>🌿</span>
            <span className="auth-logo-text">Agri<span>Pharma</span></span>
          </div>

          <h2>{isForgot ? 'Reset Password' : 'Welcome Back'}</h2>
          <p className="auth-subtitle">
            {isForgot ? 'Follow the secure verification process to set a new password.' : 'Login to access your agricultural knowledge hub'}
          </p>

          {/* Tab Switcher */}
          {!isForgot && (
            <div className="auth-tabs">
              <button className={tab === 'farmer' ? 'active' : ''} onClick={() => { setTab('farmer'); setError(''); setSuccess(''); }}>🌾 Farmer</button>
              <button className={tab === 'shopkeeper' ? 'active' : ''} onClick={() => { setTab('shopkeeper'); setError(''); setSuccess(''); }}>🏪 Shopkeeper</button>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!isForgot ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>📱 Mobile Number</label>
                <input
                  type="tel" required placeholder="Enter your mobile number"
                  value={form.mobile}
                  onChange={e => setForm({...form, mobile: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>🔒 Password</label>
                <input
                  type="password" required placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                <button type="button" className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
                {loading ? '...' : `Login as ${tab === 'farmer' ? 'Farmer' : 'Shopkeeper'} →`}
              </button>
              

            </form>
          ) : (
            resetStep === 1 ? (
              <form onSubmit={handleForgotRequest}>
                <div className="auth-tabs" style={{ marginBottom: '15px' }}>
                  <button type="button" className={tab === 'farmer' ? 'active' : ''} onClick={() => setTab('farmer')}>🌾 Farmer</button>
                  <button type="button" className={tab === 'shopkeeper' ? 'active' : ''} onClick={() => setTab('shopkeeper')}>🏪 Shopkeeper</button>
                </div>
                <div className="form-group">
                  <label>📧 Registered Email Address</label>
                  <input
                    type="email" required placeholder="Enter your email address"
                    value={forgotForm.email}
                    onChange={e => setForgotForm({...forgotForm, email: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP securely →'}
                </button>
                <button type="button" className="btn btn-outline" style={{width:'100%', justifyContent:'center', marginTop: '10px'}} onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}>
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotVerify}>
                <div className="form-group">
                  <label>🔑 Enter 6-digit OTP (sent to {forgotForm.email})</label>
                  <input
                    type="text" required placeholder="123456" maxLength="6"
                    value={forgotForm.otp}
                    onChange={e => setForgotForm({...forgotForm, otp: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>🔒 New Password</label>
                  <input
                    type="password" required placeholder="Secure new password"
                    value={forgotForm.newPassword}
                    onChange={e => setForgotForm({...forgotForm, newPassword: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center', backgroundColor: 'var(--green-deep)'}} disabled={loading}>
                  {loading ? 'Verifying...' : 'Set New Password 🔐'}
                </button>
              </form>
            )
          )}

          <div className="auth-footer-links" style={{ marginTop: '20px' }}>
            <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
