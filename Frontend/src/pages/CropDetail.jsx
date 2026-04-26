import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCropById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { addToCart } from '../services/api';
import { getCropPhoto } from '../utils/cropPhotos';
import './CropDetail.css';

export default function CropDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    getCropById(id)
      .then(res => { setData(res.data); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddSeed = async (seed) => {
    if (!user) return;
    try {
      await addToCart({ item_type: 'seed', seed_stock_id: seed.stock_id, quantity: 1 });
      setCartMsg(`${seed.variety_name} added to cart!`);
      setTimeout(() => setCartMsg(''), 3000);
    } catch (e) {
      setCartMsg(e.response?.data?.message || 'Failed to add to cart.');
      setTimeout(() => setCartMsg(''), 3000);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}><h2>{t('crops.noCropsFound')}</h2></div>;

  const { crop, weekly_schedule = [], seeds = [] } = data;
  const weekData = weekly_schedule.find(w => w.week_number === activeWeek) || weekly_schedule[0];
  const maxWeeks = weekly_schedule.length;

  const displayName = t(`cropsList.${crop.name.toLowerCase()}`, { defaultValue: crop.name });

  return (
    <div className="crop-detail page-enter">
      <div className="container">
        {/* Back */}
        <Link to="/crops" className="back-link">{t('cropDetail.backToCrops')}</Link>

        {/* Hero */}
        <div className="crop-detail-hero">
          <div className="crop-hero-image-wrapper">
            <img src={getCropPhoto(crop.name, crop.image_url)} alt={crop.name} className="crop-hero-photo" />
          </div>
          <div className="crop-hero-info">
            <h1 className="section-title">{displayName}</h1>
            {crop.local_name && <p style={{color:'var(--text-light)',fontStyle:'italic',marginBottom:8}}>{crop.local_name}</p>}
            <div className="crop-tags">
              <span className="badge badge-green">
                {crop.season === 'monsoon' ? t('crops.stats.monsoon') : crop.season === 'winter' ? t('crops.stats.winter') : t('crops.stats.summer')}
              </span>
              {crop.duration_days && <span className="badge badge-gold">⏱ {crop.duration_days} {t('crops.days')}</span>}
              {crop.total_weeks && !crop.duration_days && <span className="badge badge-gold">📅 {crop.total_weeks} {t('crops.weeks')}</span>}
              {crop.water_requirement && <span className="badge badge-green">💧 {crop.water_requirement}</span>}
            </div>
            {crop.description && <p className="crop-full-desc">{crop.description}</p>}
            <div className="crop-detail-stats">
              {crop.soil_type        && <div className="cds"><span>{t('cropDetail.soil')}</span><strong>{crop.soil_type}</strong></div>}
              {crop.temperature      && <div className="cds"><span>{t('cropDetail.temp')}</span><strong>{crop.temperature}</strong></div>}
              {crop.water_requirement && <div className="cds"><span>{t('cropDetail.water')}</span><strong>{crop.water_requirement}</strong></div>}
              {crop.spacing          && <div className="cds"><span>{t('cropDetail.spacing')}</span><strong>{crop.spacing}</strong></div>}
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        {weekly_schedule.length > 0 && (
          <section className="schedule-section">
            <h2 className="section-title" style={{ marginBottom: 24 }}>{t('cropDetail.weeklyCareSchedule')}</h2>
            <div className="week-selector">
              {weekly_schedule.map(w => (
                <button
                  key={w.week_number}
                  className={activeWeek === w.week_number ? 'active' : ''}
                  onClick={() => setActiveWeek(w.week_number)}
                >
                  {w.is_critical ? '⚠️ ' : ''}{t('cropDetail.week')} {w.week_number}
                </button>
              ))}
            </div>
            {weekData && (
              <div className={`week-card${weekData.is_critical ? ' week-critical' : ''}`}>
                <h3>
                  {t('cropDetail.week')} {weekData.week_number}
                  {weekData.day_from && weekData.day_to && <span style={{fontSize:'0.85rem',color:'var(--text-light)',marginLeft:8}}>Day {weekData.day_from}–{weekData.day_to}</span>}
                  {' — '}{weekData.week_label || 'Care Guide'}
                  {weekData.is_critical && <span style={{marginLeft:8,color:'#c62828',fontSize:'0.78rem',fontWeight:700}}>⚠️ {t('cropDetail.critical')}</span>}
                </h3>
                <div className="week-grid">
                  {weekData.fertilizer   && <div className="week-item"><span>{t('cropDetail.fertilizer')}</span><p>{weekData.fertilizer}{weekData.fertilizer_dose ? ` — ${weekData.fertilizer_dose}` : ''}</p></div>}
                  {weekData.irrigation   && <div className="week-item"><span>{t('cropDetail.irrigation')}</span><p>{weekData.irrigation}{weekData.irrigation_days ? ` (every ${weekData.irrigation_days} days)` : ''}</p></div>}
                  {weekData.medicine     && <div className="week-item"><span>{t('cropDetail.medicine')}</span><p>{weekData.medicine}{weekData.medicine_dose ? ` @ ${weekData.medicine_dose}` : ''}</p></div>}
                  {weekData.diseases     && <div className="week-item week-item-full"><span>{t('cropDetail.watchForDiseases')}</span><p>{weekData.diseases}</p></div>}
                  {weekData.tips         && <div className="week-item week-item-full"><span>{t('cropDetail.tipsAndActivities')}</span><p>{weekData.tips}</p></div>}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Seeds */}
        {seeds.length > 0 && (
          <section className="seeds-section">
            <h2 className="section-title" style={{ marginBottom: 24 }}>{t('cropDetail.availableSeeds')}</h2>
            {cartMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{cartMsg}</div>}
            <div className="seeds-grid">
              {seeds.map(seed => (
                <div key={seed.id} className="seed-card">
                  <div className="seed-header">
                    <h4>{seed.variety_name}</h4>
                    {seed.company && <span className="seed-company">{seed.company}</span>}
                  </div>
                  <div className="seed-info">
                    {seed.days_to_harvest && <span>⏱ {seed.days_to_harvest} days</span>}
                    {seed.yield_per_acre  && <span>📦 {seed.yield_per_acre}/acre</span>}
                  </div>
                  {seed.description && <p className="seed-desc">{seed.description}</p>}
                  {seed.price ? (
                    <div className="seed-purchase">
                      <div className="seed-price">₹{seed.price} <small>/ {seed.quantity_value}{seed.quantity_unit}</small></div>
                      {user ? (
                        seed.stock > 0 ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAddSeed(seed)}>Add to Cart</button>
                        ) : (
                          <span className="badge badge-red">Out of Stock</span>
                        )
                      ) : (
                        <Link to="/login" className="btn btn-outline btn-sm">Login to Buy</Link>
                      )}
                    </div>
                  ) : (
                    <span className="badge badge-gold">Price on Request</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
