import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, getDiseaseHistory, getCart, BACKEND_URL } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user, role } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [scans, setScans]     = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'farmer') { setLoading(false); return; }
    Promise.all([
      getMyOrders().catch(() => ({ data: { orders: [] } })),
      getDiseaseHistory().catch(() => ({ data: { history: [] } })),
      getCart().catch(() => ({ data: { admin_cart: { items: [] }, shopkeeper_cart: { items: [] } } })),
    ]).then(([oRes, sRes, cRes]) => {
      setOrders(oRes.data.orders || []);
      setScans(sRes.data.history || []);
      const items = (cRes.data.admin_cart?.items?.length || 0) + (cRes.data.shopkeeper_cart?.items?.length || 0);
      setCartCount(items);
    }).finally(() => setLoading(false));
  }, [role]);

  const quickLinks = [
    { to: '/crops',   icon: '🌾', label: 'Browse Crops',    color: '#e8f5e8' },
    { to: '/disease', icon: '🔬', label: 'Scan Disease',    color: '#e0f2fe' },
    { to: '/shop',    icon: '🛒', label: 'Shop Inputs',     color: '#fef3c7' },
    { to: '/orders',  icon: '📦', label: 'My Orders',       color: '#fce7f3' },
    { to: '/cart',    icon: '🛍️', label: `Cart (${cartCount})`, color: '#f3e8ff' },
    { to: '/profile', icon: '👤', label: 'My Profile',      color: '#d1fae5' },
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="dashboard page-enter">
      <div className="container">

        {/* Greeting */}
        <div className="dash-header">
          <div>
            <h1 className="section-title">Good day, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="section-subtitle">
              {role === 'farmer'
                ? `${user?.village ? user.village + ' · ' : ''}${user?.district || ''}`
                : `${user?.shop_name || ''} · ${user?.city || ''}`}
            </p>
          </div>
          <div className="dash-header-badge">
            <span>{role === 'farmer' ? '🌾' : '🏪'}</span>
            <span>{role === 'farmer' ? 'Farmer' : 'Shopkeeper'}</span>
          </div>
        </div>

        {role === 'farmer' && (
          <>
            {/* Stats Row */}
            <div className="dash-stats">
              <div className="dash-stat">
                <span className="stat-num">{orders.length}</span>
                <span className="stat-lbl">Total Orders</span>
              </div>
              <div className="dash-stat">
                <span className="stat-num">{scans.length}</span>
                <span className="stat-lbl">Disease Scans</span>
              </div>
              <div className="dash-stat">
                <span className="stat-num">{cartCount}</span>
                <span className="stat-lbl">Cart Items</span>
              </div>
              <div className="dash-stat">
                <span className="stat-num">{user?.land_size || '—'}</span>
                <span className="stat-lbl">Acres</span>
              </div>
            </div>

            {/* Quick Links */}
            <section className="dash-section">
              <h2 className="dash-section-title">Quick Actions</h2>
              <div className="quick-links-grid">
                {quickLinks.map(q => (
                  <Link key={q.to} to={q.to} className="quick-link" style={{ background: q.color }}>
                    <span className="ql-icon">{q.icon}</span>
                    <span className="ql-label">{q.label}</span>
                    <span className="ql-arrow">→</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recent Scans */}
            {scans.length > 0 && (
              <section className="dash-section">
                <div className="dash-section-header">
                  <h2 className="dash-section-title">Recent Disease Scans</h2>
                  <Link to="/disease" className="see-all">View All →</Link>
                </div>
                <div className="recent-scans">
                  {scans.slice(0,3).map(s => (
                    <div key={s.id} className="scan-card">
                      {s.image_url && (
                        <img src={`${BACKEND_URL}${s.image_url.startsWith('/') ? '' : '/'}${s.image_url}`} alt="scan" className="scan-thumb" />
                      )}
                      <div className="scan-info">
                        <strong>{s.disease_name || 'Unknown'}</strong>
                        <span className={`badge ${s.confidence > 0.7 ? 'badge-red' : 'badge-gold'}`}>
                          {s.confidence ? `${(s.confidence * 100).toFixed(0)}% confidence` : 'Analyzed'}
                        </span>
                        <small>{new Date(s.scanned_at || s.created_at).toLocaleDateString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Orders */}
            {orders.length > 0 && (
              <section className="dash-section">
                <div className="dash-section-header">
                  <h2 className="dash-section-title">Recent Orders</h2>
                  <Link to="/orders" className="see-all">View All →</Link>
                </div>
                <div className="orders-mini">
                  {orders.slice(0,3).map(o => (
                    <div key={o.id} className="order-mini-card">
                      <div>
                        <strong>Order #{o.id}</strong>
                        <span className="badge badge-green" style={{ marginLeft: 8 }}>{o.status || 'Placed'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                          {o.item_count} items · ₹{Number(o.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Disease Detection CTA if no scans */}
            {scans.length === 0 && (
              <section className="dash-section">
                <div className="disease-cta-card">
                  <div>
                    <h3>🔬 Try AI Disease Detection</h3>
                    <p>Upload a photo of your crop and get instant disease diagnosis with treatment suggestions.</p>
                    <Link to="/disease" className="btn btn-primary" style={{ marginTop: 16 }}>Scan Your Crop →</Link>
                  </div>
                  <div className="disease-cta-emoji">🌿</div>
                </div>
              </section>
            )}
          </>
        )}

        {role === 'shopkeeper' && (
          <div className="dash-section">
            <div className="quick-links-grid">
              <Link to="/shopkeeper" className="quick-link" style={{ background: '#e8f5e8' }}>
                <span className="ql-icon">📦</span>
                <span className="ql-label">My Products</span>
                <span className="ql-arrow">→</span>
              </Link>
              <Link to="/profile" className="quick-link" style={{ background: '#fef3c7' }}>
                <span className="ql-icon">👤</span>
                <span className="ql-label">My Profile</span>
                <span className="ql-arrow">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
