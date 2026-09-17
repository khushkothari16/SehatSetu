import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building,
  Phone,
  Clock,
  ShieldAlert,
  Navigation,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { INITIAL_FACILITIES } from '../data/mockData';
import { LeafletMap } from '../components/common/LeafletMap';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { locationService } from '../services/locationService';

export const NearbyHealthcare = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { addToast } = useNotifications();
  const { location, isLive, refreshLocation } = useLocation();

  const [facilities, setFacilities] = useState(() => {
    const loc = locationService.getCachedLocation();
    const userLat = loc?.lat || 28.1878;
    const userLng = loc?.lng || 75.5001;
    const distFromKhed = locationService.calculateDistanceKm(userLat, userLng, 18.8472, 73.9142);

    if (parseFloat(distFromKhed) > 50) {
      return locationService.getLocalFacilities(userLat, userLng, loc?.village || loc?.city || 'Local');
    }
    return INITIAL_FACILITIES.map((f) => ({
      ...f,
      distance: `${locationService.calculateDistanceKm(userLat, userLng, f.lat, f.lng)} km`
    }));
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFacility, setActiveFacility] = useState(null);

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    const userLat = location.lat;
    const userLng = location.lng;
    const distFromKhed = locationService.calculateDistanceKm(userLat, userLng, 18.8472, 73.9142);

    if (parseFloat(distFromKhed) > 50) {
      setFacilities(locationService.getLocalFacilities(userLat, userLng, location.village || location.city || 'Local'));
    } else {
      setFacilities(
        INITIAL_FACILITIES.map((f) => ({
          ...f,
          distance: `${locationService.calculateDistanceKm(userLat, userLng, f.lat, f.lng)} km`
        }))
      );
    }
  }, [location?.lat, location?.lng, location?.village]);

  const categories = ['All', 'PHC', 'Hospital', 'Diagnostic Centre', 'Pharmacy', 'Clinic'];

  const filteredFacilities = facilities.filter((fac) => {
    const matchCat = selectedCategory === 'All' || fac.type === selectedCategory;
    const matchSearch =
      fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Include user live location as a special map marker
  const mapMarkers = [
    {
      lat: location?.lat || 28.1878,
      lng: location?.lng || 75.5001,
      title: `📍 You Are Here (${location?.village || location?.city || 'Live Location'})`,
      subtitle: location?.accuracy || 'Live GPS Location',
      distance: '0.0 km',
      description: location?.fullAddress || 'Your real-time detected position',
      type: 'user',
      isUserLocation: true
    },
    ...filteredFacilities.map((f) => ({
      lat: f.lat,
      lng: f.lng,
      title: f.name,
      subtitle: `${f.type} • ${f.distance}`,
      distance: f.distance,
      description: f.address,
      type: f.type === 'Pharmacy' ? 'pharmacy' : f.type === 'Diagnostic Centre' ? 'diagnostic' : 'hospital',
      status: f.isOpen ? 'Open Now' : 'Closed'
    }))
  ];

  const handleDirections = (fac) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`, '_blank');
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <MapPin size={28} color="var(--secondary)" />
          {t('nearbyHealthcare')}
        </h1>
      </div>

      {/* Active Live Location Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1.15rem',
          background: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.8s infinite' }} />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534' }}>
              📍 Healthcare Facilities Near: <strong>{location?.village || location?.city || 'Live Location'}, {location?.state || 'India'}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#15803d' }}>
              Live GPS: {location?.lat?.toFixed(4)}° N, {location?.lng?.toFixed(4)}° E &bull; {location?.accuracy || 'Active'}
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            await refreshLocation();
            addToast('Updated live GPS and recalibrated nearby facilities', 'success');
          }}
          className="btn btn-outline btn-xs"
          style={{ background: '#ffffff', borderColor: '#86efac', color: '#166534', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={12} />
          <span>🛰️ Refresh Live GPS</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 260 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search facility name, village, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Facilities List + Leaflet Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Facilities List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              className="card card-clickable"
              onClick={() => setActiveFacility(fac)}
              style={{
                padding: '1.25rem',
                border: activeFacility?.id === fac.id ? '2px solid var(--primary)' : '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <span className="badge badge-neutral" style={{ marginBottom: 4 }}>
                    {fac.type}
                  </span>
                  <h3 style={{ margin: '2px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {fac.name}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {fac.address} &bull; <strong>{fac.distance} away</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {fac.hasEmergency && (
                    <span className="badge badge-emergency" style={{ display: 'block', marginBottom: 4 }}>
                      🚨 24/7 Emergency
                    </span>
                  )}
                  <span className="badge badge-success">
                    {fac.hours}
                  </span>
                </div>
              </div>

              {/* Available services pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.75rem 0' }}>
                {fac.availableServices.slice(0, 4).map((srv, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-alt)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    ✓ {srv}
                  </span>
                ))}
                {fac.availableServices.length > 4 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                    +{fac.availableServices.length - 4} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDirections(fac); }}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                >
                  <Navigation size={14} />
                  Directions
                </button>
                <a
                  href={`tel:${fac.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Phone size={14} />
                  Call ({fac.phone})
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Map View */}
        <div style={{ position: 'sticky', top: 'calc(var(--header-height) + 1.5rem)', height: 'fit-content' }}>
          <div className="card" style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🗺️ Rural Facilities Map (OpenStreetMap)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {filteredFacilities.length} locations
              </span>
            </div>

            <LeafletMap
              center={activeFacility ? [activeFacility.lat, activeFacility.lng] : [location?.lat || 28.1878, location?.lng || 75.5001]}
              zoom={13}
              markers={mapMarkers}
              height="480px"
              onMarkerClick={(m) => {
                const found = facilities.find(f => f.name === m.title);
                if (found) setActiveFacility(found);
              }}
            />
          </div>
        </div>
      </div>

      {/* Facility Details Modal (Section 32) */}
      {activeFacility && (
        <div className="modal-overlay" onClick={() => setActiveFacility(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: 4 }}>
                  {activeFacility.type}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{activeFacility.name}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveFacility(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div><strong>Address:</strong> {activeFacility.address}</div>
                <div><strong>Distance:</strong> {activeFacility.distance} from detected location</div>
                <div><strong>Contact Phone:</strong> {activeFacility.phone}</div>
                <div><strong>Hours:</strong> {activeFacility.hours}</div>
                {activeFacility.hasEmergency && (
                  <div style={{ color: 'var(--emergency)', fontWeight: 700 }}>
                    🚨 24x7 Emergency & Trauma Unit Active
                  </div>
                )}
                {activeFacility.availableBeds > 0 && (
                  <div><strong>Inpatient Beds Available:</strong> {activeFacility.availableBeds} beds</div>
                )}

                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Key Clinical & Diagnostic Services:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {activeFacility.availableServices.map((s, idx) => (
                      <span key={idx} className="badge badge-neutral">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setActiveFacility(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => handleDirections(activeFacility)}>
                <Navigation size={16} />
                Get Driving Directions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
