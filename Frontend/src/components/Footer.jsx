import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Footer.css';

export default function Footer() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">🌿 Agri<span>Pharma</span></div>
            <p>{t('home.heroDesc')}</p>
          </div>
          <div className="footer-links">
            <h4>{t('common.platform')}</h4>
            <Link to="/crops">{t('common.crops')}</Link>
            <Link to="/shop">{t('common.shop')}</Link>
            <Link to="/disease">{t('common.diseaseAI')}</Link>
          </div>
          {!user && (
            <div className="footer-links">
              <h4>{t('common.account')}</h4>
              <Link to="/register">{t('common.registerFarmer')}</Link>
              <Link to="/register/shopkeeper">{t('common.registerShopkeeper')}</Link>
              <Link to="/login">{t('common.login')}</Link>
            </div>
          )}
          <div className="footer-links">
            <h4>{t('common.support')}</h4>
            <a href="mailto:support@agripharma.com">{t('common.contactUs')}</a>
            <a href="#">{t('common.privacyPolicy')}</a>
            <a href="#">{t('common.termsOfService')}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 AgriPharma. Built with ❤️ for Indian farmers.</p>
        </div>
      </div>
    </footer>
  );
}
