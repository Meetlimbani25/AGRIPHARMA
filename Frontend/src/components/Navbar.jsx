import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-leaf">🌿</span>
          <span className="logo-text">Agri<span>Pharma</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.dashboard')}</Link>
              <Link to="/crops" className={isActive('/crops') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.crops')}</Link>
              <Link to="/shop" className={isActive('/shop') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.shop')}</Link>
              {role === 'farmer' && (
                <>
                  <Link to="/disease" className={isActive('/disease') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.diseaseAI')}</Link>
                  <Link to="/cart" className={isActive('/cart') ? 'active' : ''} onClick={() => setMenuOpen(false)}>🛒 {t('common.cart')}</Link>
                  <Link to="/orders" className={isActive('/orders') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.orders')}</Link>
                </>
              )}
              {role === 'shopkeeper' && (
                <Link to="/shopkeeper" className={isActive('/shopkeeper') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.myShop')}</Link>
              )}
              {role === 'admin' && (
                <Link to="/admin" className={isActive('/admin') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.adminPanel')}</Link>
              )}
              
              <div className="nav-auth-wrapper">
                <div className="lang-selector-nav">
                  <button onClick={() => changeLanguage('en')} className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}>EN</button>
                  <button onClick={() => changeLanguage('gj')} className={`lang-btn ${i18n.language === 'gj' ? 'active' : ''}`}>ગુજ</button>
                </div>
                <div className="navbar-user">
                  <Link to="/profile" className="user-avatar" onClick={() => setMenuOpen(false)}>
                    {user.profile_picture ? (
                      <img src={`http://localhost:5001${user.profile_picture}`} alt="Profile" />
                    ) : (
                      user.name?.charAt(0).toUpperCase()
                    )}
                  </Link>
                  <button onClick={handleLogout} className="btn btn-outline btn-sm">{t('common.logout')}</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/crops" className={isActive('/crops') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.crops')}</Link>
              <Link to="/shop" className={isActive('/shop') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('common.shop')}</Link>
              
              <div className="nav-auth-wrapper">
                <div className="lang-selector-nav">
                  <button onClick={() => changeLanguage('en')} className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}>EN</button>
                  <button onClick={() => changeLanguage('gj')} className={`lang-btn ${i18n.language === 'gj' ? 'active' : ''}`}>ગુજ</button>
                </div>
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>{t('common.login')}</Link>
                  <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>{t('common.register')}</Link>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
