import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCrops } from '../services/api';
import { getCropPhoto } from '../utils/cropPhotos';
import './Crops.css';

const cropEmojis = {
  cotton: '🌸', kapas: '🌸',
  groundnut: '🥜', mungfali: '🥜',
  maize: '🌽', makka: '🌽', corn: '🌽',
  bajra: '🌾', millet: '🌾',
  jowar: '🌾', sorghum: '🌾',
  tur: '🫘', arhar: '🫘', 'pigeon pea': '🫘',
  'moth bean': '🫘',
  'mung bean': '🫛', 'green gram': '🫛', moong: '🫛',
  'urad': '🫘', 'black gram': '🫘',
  castor: '🌿', erandi: '🌿',
  sesame: '🌿', til: '🌿',
  rice: '🍚', paddy: '🍚',
  sugarcane: '🎋', sherdio: '🎋',
  banana: '🍌', kela: '🍌',
  turmeric: '🟡', haldi: '🟡',
  ginger: '🫚', adrak: '🫚',
  wheat: '🌾', ghau: '🌾',
  mustard: '🌻', rai: '🌻',
  cumin: '🌿', jiru: '🌿',
  coriander: '🌿', dhana: '🌿',
  fennel: '🌿', saunf: '🌿', variyali: '🌿',
  chickpea: '🫘', chana: '🫘', 'bengal gram': '🫘',
  lentil: '🫘', masoor: '🫘',
  garlic: '🧄', lasan: '🧄',
  onion: '🧅', dungali: '🧅',
  potato: '🥔', batata: '🥔',
  tomato: '🍅', tameta: '🍅',
  fenugreek: '🌿', methi: '🌿',
  isabgol: '💊', psyllium: '💊',
  safflower: '🌼', kardai: '🌼',
  watermelon: '🍉', tarbuj: '🍉',
  muskmelon: '🍈', kharbuja: '🍈',
  cucumber: '🥒', kakdi: '🥒',
  'bottle gourd': '🫙', dudhi: '🫙',
  'bitter gourd': '🥬', karela: '🥬',
  okra: '🌱', bhindi: '🌱', 'lady finger': '🌱',
  cowpea: '🫘', chawli: '🫘',
  'sponge gourd': '🥬', turiya: '🥬',
  'cluster bean': '🌿', guar: '🌿',
  forage: '🌿', fodder: '🌿',
  default: '🌱',
};

const getEmoji = (name) => {
  if (!name) return cropEmojis.default;
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(cropEmojis)) {
    if (key !== 'default' && lower.includes(key)) return emoji;
  }
  return cropEmojis.default;
};

const seasonColors = {
  Monsoon: { bg: 'linear-gradient(135deg,#e3f2fd,#bbdefb)', badge: '#1565c0' },
  Winter: { bg: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', badge: '#2e7d32' },
  Summer: { bg: 'linear-gradient(135deg,#fff8e1,#ffecb3)', badge: '#f57f17' },
};

const getSeasonCfg = (s) => {
  const lower = (s || '').toLowerCase();
  return seasonColors[lower.charAt(0).toUpperCase() + lower.slice(1)] || {};
};

export default function Crops() {
  const { t } = useTranslation();

  const SEASONS = [
    { label: t('crops.labels.allSeasons'), value: 'All' },
    { label: t('crops.labels.monsoon'), value: 'monsoon' },
    { label: t('crops.labels.winter'), value: 'winter' },
    { label: t('crops.labels.summer'), value: 'summer' },
  ];

  const getSeasonLabel = (s) => {
    const lower = (s || '').toLowerCase();
    if (lower === 'monsoon') return t('crops.stats.monsoon');
    if (lower === 'winter') return t('crops.stats.winter');
    if (lower === 'summer') return t('crops.stats.summer');
    return s;
  };

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season') || 'All';

  useEffect(() => {
    setLoading(true);
    getCrops(season === 'All' ? undefined : season)
      .then(res => setCrops(res.data.crops || []))
      .catch(() => setCrops([]))
      .finally(() => setLoading(false));
  }, [season]);

  const filtered = crops.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const setSeason = (s) => {
    setSearch('');
    if (s === 'All') { setSearchParams({}); }
    else setSearchParams({ season: s });
  };

  const grouped = season === 'All'
    ? ['Monsoon', 'Winter', 'Summer'].reduce((acc, s) => {
      const list = filtered.filter(c => (c.season || '').toLowerCase() === s.toLowerCase());
      if (list.length) acc[s] = list;
      return acc;
    }, {})
    : null;

  return (
    <div className="crops-page page-enter">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="section-title">{t('crops.hubTitle')}</h1>
            <p className="section-subtitle">
              {t('crops.hubSubtitle')}
            </p>
          </div>
          {!loading && (
            <div className="crop-count-badge">
              <span>{filtered.length}</span> {t('home.stats.crops')}
            </div>
          )}
        </div>

        {/* Season Stats */}
        <div className="season-stats-row">
          <div className="season-stat monsoon">
            <span className="ss-icon">🌧️</span>
            <div>
              <div className="ss-label">{t('crops.stats.monsoon')}</div>
              <div className="ss-sub">{t('crops.stats.monsoonMonths')}</div>
            </div>
          </div>
          <div className="season-stat winter">
            <span className="ss-icon">❄️</span>
            <div>
              <div className="ss-label">{t('crops.stats.winter')}</div>
              <div className="ss-sub">{t('crops.stats.winterMonths')}</div>
            </div>
          </div>
          <div className="season-stat summer">
            <span className="ss-icon">☀️</span>
            <div>
              <div className="ss-label">{t('crops.stats.summer')}</div>
              <div className="ss-sub">{t('crops.stats.summerMonths')}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="crops-filters">
          <div className="season-tabs">
            {SEASONS.map(s => (
              <button
                key={s.value}
                className={season === s.value ? 'active' : ''}
                onClick={() => setSeason(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input
            className="search-input" type="text"
            placeholder={t('crops.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🌱</div>
            <h3>{t('crops.noCropsFound')}</h3>
            <p>{t('crops.tryChangingFilter')}</p>
          </div>
        ) : season === 'All' && grouped ? (
          // Grouped view when All is selected
          Object.entries(grouped).map(([s, list]) => {
            const cfg = getSeasonCfg(s);
            return (
              <div key={s} className="season-group">
                <div className="season-group-header" style={{ borderLeftColor: cfg.badge }}>
                  <h2 style={{ color: cfg.badge }}>{getSeasonLabel(s)}</h2>
                  <span className="sg-count" style={{ background: cfg.badge }}>{list.length} crops</span>
                </div>
                <div className="crops-grid">
                  {list.map(crop => (
                    <CropCard key={crop.id} crop={crop} cfg={getSeasonCfg(crop.season)} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="crops-grid">
            {filtered.map(crop => {
              const cfg = getSeasonCfg(crop.season);
              return <CropCard key={crop.id} crop={crop} cfg={cfg} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CropCard({ crop, cfg }) {
  const { t } = useTranslation();

  // Try to find translated name, fallback to original
  const displayName = t(`cropsList.${crop.name.toLowerCase()}`, { defaultValue: crop.name });

  return (
    <Link to={`/crops/${crop.id}`} className="crop-card">
      <div className="crop-card-image-wrapper">
        <img src={getCropPhoto(crop.name, crop.image_url)} alt={crop.name} className="crop-card-photo" loading="lazy" />
        <div className="crop-card-emoji-overlay">{getEmoji(crop.name)}</div>
      </div>
      <div className="crop-card-body">
        <h3>{displayName}</h3>
        <div className="crop-meta">
          <span
            className="badge-season"
            style={{ background: cfg.badge || 'var(--green-mid)', color: '#fff' }}
          >
            {crop.season === 'monsoon' ? t('crops.stats.monsoon') : crop.season === 'winter' ? t('crops.stats.winter') : t('crops.stats.summer')}
          </span>
          {crop.duration_days && (
            <span className="crop-duration">⏱ {crop.duration_days} {t('crops.days')}</span>
          )}
        </div>
        {crop.description && (
          <p className="crop-desc">{crop.description.slice(0, 95)}{crop.description.length > 95 ? '…' : ''}</p>
        )}
        <div className="crop-card-footer">
          <span className="view-detail">{t('crops.viewFullSchedule')}</span>
        </div>
      </div>
    </Link>
  );
}
