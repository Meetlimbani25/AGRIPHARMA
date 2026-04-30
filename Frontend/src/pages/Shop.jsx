import React, { useEffect, useState } from 'react';
import { getShopkeeperProducts, BACKEND_URL } from '../services/api';
import { addToShopCart } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Shop.css';

const TABS = ['Seeds', 'Fertilizers', 'Pesticides'];

export default function Shop() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Seeds');
  const [shopProds, setShopProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setSearch('');
    // Fetch shopkeeper products only
    getShopkeeperProducts().then(spRes => {
      setShopProds(spRes.data.products || []);
    }).catch(err => {
      console.error('Failed to load shop items', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []); // Only fetch once on component mount

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAddShopProduct = async (p) => {
    if (!user) return;
    try { await addToShopCart({ product_id: p.id, shopkeeper_id: p.shopkeeper_id, quantity: 1 }); showMsg(`${p.name} added to cart!`); }
    catch (e) { showMsg(e.response?.data?.message || 'Failed to add.'); }
  };

  // Helper to filter shopkeeper products by expected category
  const getCombinedProducts = (expectedCategories) => {
    return shopProds.filter(p =>
      p.category && expectedCategories.includes(p.category.toLowerCase()) &&
      (!search || p.name?.toLowerCase().includes(search.toLowerCase()))
    );
  };

  let displayedCombined = [];
  if (tab === 'Seeds') displayedCombined = getCombinedProducts(['seed', 'seeds']);
  if (tab === 'Fertilizers') displayedCombined = getCombinedProducts(['fertilizer', 'fertilizers']);
  if (tab === 'Pesticides') displayedCombined = getCombinedProducts(['pesticide', 'pesticides', 'medicine', 'medicines', 'medisine', 'insecticide', 'insecticides']);

  return (
    <div className="shop-page page-enter">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="section-title">Agri Shop</h1>
            <p className="section-subtitle">Quality seeds, fertilizers, and medicines from verified sellers</p>
          </div>
          {user && <Link to="/cart" className="btn btn-primary">🛒 View Cart</Link>}
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}

        {/* Tab Bar */}
        <div className="shop-tabs">
          {TABS.map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setSearch(''); }}>
              {t}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="shop-filters">
          <input className="search-input" type="text" placeholder={`🔍 Search ${tab.toLowerCase()}...`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* COMBINED PRODUCTS */}
            {(tab === 'Seeds' || tab === 'Fertilizers' || tab === 'Pesticides') && (
              displayedCombined.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-emoji">{tab === 'Seeds' ? '🌱' : tab === 'Fertilizers' ? '🧪' : '💊'}</div>
                  <h3>No {tab.toLowerCase()} found</h3>
                </div>
              ) : (
                <div className="shop-grid">
                  {displayedCombined.map(p => (
                    <Link
                      key={`shop-${p.id}`}
                      to={`/shop/shopkeeper-products/${p.id}`}
                      className="shop-card-link"
                    >
                      <div className="shop-card">
                        <div className="shop-card-img">
                          {p.image_url
                            ? <img src={`${BACKEND_URL}${p.image_url.startsWith('/') ? '' : '/'}${p.image_url.replace(/\\/g, '/')}`} alt={p.name} />
                            : <img src={p.category?.toLowerCase() === 'seed' ? '/images/placeholder-seed.png' : p.category?.toLowerCase() === 'fertilizer' ? '/images/placeholder-fertilizer.png' : '/images/placeholder-pesticide.png'} alt={p.name} />
                          }
                        </div>
                        <div className="shop-card-body">
                          <div className="shop-card-meta">
                            <span className="badge badge-gold">📍 {p.city || 'Local Shop'}</span>
                          </div>
                          <h4>{p.name}</h4>
                          <p className="shop-desc">🏪 {p.shop_name}</p>
                          <div className="shop-card-footer">
                            <div>
                              {p.price && <span className="shop-price">₹{p.price} <small>/{p.price_unit || 'unit'}</small></span>}
                              {p.stock !== undefined && (
                                <span className={`badge ${p.stock > 0 ? 'badge-green' : 'badge-red'}`} style={{ marginLeft: 8 }}>
                                  {p.stock > 0 ? `${p.stock} left` : 'Out of Stock'}
                                </span>
                              )}
                            </div>
                            {user ? (
                              p.stock > 0 || p.stock === undefined
                                ? <button className="btn btn-primary btn-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddShopProduct(p); }}>Add to Cart</button>
                                : <span className="badge badge-red">Unavailable</span>
                            ) : (
                              <Link to="/login" className="btn btn-outline btn-sm" onClick={(e) => e.stopPropagation()}>Login</Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
