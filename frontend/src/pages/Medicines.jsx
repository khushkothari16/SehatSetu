import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { medicineService } from '../services/medicineService';
import { voiceService } from '../services/voiceService';
import { LeafletMap } from '../components/common/LeafletMap';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const Medicines = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const formatStockStatus = (status) => {
    if (!status) return tr('Available in Stock', 'स्टॉक में उपलब्ध', 'साठा उपलब्ध');
    if (status.includes('Available')) return tr('Available in Stock', 'स्टॉक में उपलब्ध', 'साठा उपलब्ध');
    if (status.includes('Limited')) return tr('Limited Stock Left', 'सीमित स्टॉक शेष', 'मर्यादित साठा');
    if (status.includes('Out')) return tr('Out of Stock', 'स्टॉक समाप्त', 'साठा उपलब्ध नाही');
    return status;
  };

  const [isListening, setIsListening] = useState(false);
  const [speakingPharmacyId, setSpeakingPharmacyId] = useState(null);

  // Load any medicine requested via 1-click navigate from prescription
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = localStorage.getItem('sehatsetu_active_med_search');
    if (saved) {
      localStorage.removeItem('sehatsetu_active_med_search');
      return saved;
    }
    const recent = medicineService.getPrescribedMedicines();
    if (recent && recent.length > 0) {
      return recent[0].name;
    }
    return 'Amoxicillin';
  });

  const [prescribedMedicines, setPrescribedMedicines] = useState(() => medicineService.getPrescribedMedicines());
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const searchPharmacies = async () => {
    setLoading(true);
    try {
      const data = await medicineService.getPharmacies(searchTerm);
      setPharmacies(data);
      if (data.length > 0) {
        setSelectedPharmacy(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPharmacies();
  }, [searchTerm]);

  // Real-time synchronization: listen for newly issued doctor prescriptions
  useEffect(() => {
    const checkActiveSearch = () => {
      const savedSearch = localStorage.getItem('sehatsetu_active_med_search');
      if (savedSearch) {
        localStorage.removeItem('sehatsetu_active_med_search');
        setSearchTerm(savedSearch);
      }
      setPrescribedMedicines(medicineService.getPrescribedMedicines());
    };

    checkActiveSearch();

    const handleNewRx = (e) => {
      const newMeds = medicineService.getPrescribedMedicines();
      setPrescribedMedicines(newMeds);
      if (e.detail?.medicines?.[0]?.name) {
        setSearchTerm(e.detail.medicines[0].name);
        addToast(`💊 Doctor prescribed "${e.detail.medicines[0].name}" — live pharmacy stock loaded!`, 'info');
      }
    };

    window.addEventListener('prescription_created', handleNewRx);
    window.addEventListener('prescribed_medicines_updated', handleNewRx);
    window.addEventListener('storage', checkActiveSearch);
    return () => {
      window.removeEventListener('prescription_created', handleNewRx);
      window.removeEventListener('prescribed_medicines_updated', handleNewRx);
      window.removeEventListener('storage', checkActiveSearch);
    };
  }, []);

  const mapMarkers = pharmacies.map(p => ({
    lat: p.lat,
    lng: p.lng,
    title: p.name,
    subtitle: p.address,
    distance: p.distance,
    type: 'pharmacy',
    status: p.isOpen ? 'Open Now' : 'Closed'
  }));

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleDirections = (p) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank');
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Pill size={28} color="var(--primary)" />
          {t('medicines')} {tr('& Pharmacy Stock', 'एवं फार्मेसी दवा स्टॉक', 'व औषध साठा')}
        </h1>
      </div>

      {/* 💊 DOCTOR PRESCRIBED MEDICINES QUICK-DISCOVERY BANNER */}
      {prescribedMedicines.length > 0 && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1.5px solid #86EFAC',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 2px 8px -2px rgba(22, 163, 74, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.9rem', color: '#15803D' }}>
              <Sparkles size={18} color="#16A34A" />
              <span>{tr('Prescribed by Your Doctor • Click to Check Live Stock:', 'डॉक्टर द्वारा लिखी गई दवाएं • लाइव स्टॉक देखने हेतु क्लिक करें:', 'डॉक्टरांनी दिलेली औषधे • थेट साठा पाहण्यासाठी क्लिक करा:')}</span>
            </div>
            <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#15803D', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 800, border: '1px solid #86EFAC' }}>
              {prescribedMedicines.length} {tr('Prescribed Medications', 'पर्चे की दवाएं', 'औषधे')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {prescribedMedicines.map((m) => {
              const medClean = m.name.toLowerCase().trim();
              const currentClean = searchTerm.toLowerCase().trim();
              const isSelected = currentClean.includes(medClean) || medClean.includes(currentClean);

              return (
                <button
                  key={m.name}
                  onClick={() => setSearchTerm(m.name)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    border: isSelected ? '2px solid #16A34A' : '1px solid #86EFAC',
                    background: isSelected ? '#16A34A' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#15803D',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: isSelected ? '0 2px 8px rgba(22, 163, 74, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>💊 {m.name}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>({m.dosage})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="search-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={isListening ? tr('Listening... Speak medicine name...', 'सुन रहे हैं... दवा का नाम बोलें...', 'ऐकत आहे... औषधाचे नाव सांगा...') : tr('Search generic medicine (e.g. Amoxicillin, Paracetamol, ORS)...', 'दवा का नाम खोजें (उदा. एमोक्सिसिलिन, पैरासिटामोल, ओआरएस)...', 'औषधाचे नाव शोधा (उदा. पॅरासिटामॉल, ओआरएस)...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Mic Button for Medicine Search */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                setIsListening(false);
                return;
              }
              if (!voiceService.isSpeechRecognitionSupported()) {
                addToast('Voice mic is not supported in this browser.', 'warning');
                return;
              }
              setIsListening(true);
              addToast(tr('🎙️ Speak medicine name (e.g. Paracetamol, ORS)...', '🎙️ दवा का नाम बोलें (जैसे पैरासिटामोल, ओआरएस)...', '🎙️ औषधाचे नाव सांगा (उदा. पॅरासिटामॉल, ओआरएस)...'), 'info');
              voiceService.startListening({
                language,
                onResult: ({ text }) => setSearchTerm(text),
                onError: () => setIsListening(false),
                onEnd: () => setIsListening(false)
              });
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 10px',
              color: isListening ? '#EF4444' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isListening ? 'Stop listening' : 'Tap to speak medicine name'}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tr('Quick Search:', 'त्वरित खोज:', 'जलद शोध:')}</span>
          {['Amoxicillin', 'Paracetamol', 'Oral Rehydration Salts (ORS)', 'Cetirizine', 'Azithromycin'].map(m => (
            <button
              key={m}
              onClick={() => setSearchTerm(m)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                backgroundColor: searchTerm === m ? 'var(--primary-light)' : 'var(--surface)',
                color: searchTerm === m ? 'var(--primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Pharmacy List + Leaflet Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Pharmacies with Stock Cards */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
          ) : pharmacies.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Pill size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3>{tr('No local pharmacies found for', 'इस दवा के लिए कोई स्थानीय फार्मेसी नहीं मिली:', 'या औषधासाठी कोणतीही स्थानिक फार्मसी आढळली नाही:')} "{searchTerm}"</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {tr('Try searching by generic compound or broad salt name.', 'कृपया जेनेरिक नाम या अन्य दवा का नाम लिखकर खोजें।', 'कृपया जेनेरिक नाव किंवा साध्या औषधाचे नाव टाकून शोधा.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pharmacies.map((pharmacy) => {
                const sClean = searchTerm.toLowerCase().trim();
                const sTokens = sClean.split(/[\s,+/]+/).filter(w => w.length >= 3);
                const stockInfo = pharmacy.medicinesStock?.[searchTerm] ||
                  Object.entries(pharmacy.medicinesStock || {}).find(([k]) => {
                    const kClean = k.toLowerCase().trim();
                    if (kClean.includes(sClean) || sClean.includes(kClean)) return true;
                    return sTokens.length > 0 && sTokens.some(tok => kClean.includes(tok));
                  })?.[1] || { status: 'Available in Stock' };

                const isAvailable = stockInfo.status && (
                  stockInfo.status.toLowerCase().includes('avail') ||
                  stockInfo.status.toLowerCase().includes('stock')
                );
                const isSelected = selectedPharmacy?.id === pharmacy.id;

                return (
                  <div
                    key={pharmacy.id}
                    className={`card ${isSelected ? 'card-highlight' : ''}`}
                    onClick={() => setSelectedPharmacy(pharmacy)}
                    style={{
                      padding: '1.25rem',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        {pharmacy.isGovtDiscount && (
                          <span className="badge badge-success" style={{ marginBottom: '4px' }}>
                            <ShieldCheck size={12} /> {tr('Pradhan Mantri Jan Aushadhi (85% Savings)', 'प्रधानमंत्री जन औषधि केंद्र (85% बचत)', 'प्रधानमंत्री जन औषधी केंद्र (८५% बचत)')}
                          </span>
                        )}
                        <h3 style={{ margin: '2px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {pharmacy.name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {pharmacy.address} &bull; <strong>{pharmacy.distance}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Speaker Button to Hear Pharmacy Stock info */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (speakingPharmacyId === pharmacy.id) {
                              voiceService.stopSpeaking();
                              setSpeakingPharmacyId(null);
                              return;
                            }
                            setSpeakingPharmacyId(pharmacy.id);
                            const textToSpeak = `${pharmacy.name}. ${tr('Address:', 'पता:', 'पत्ता:')} ${pharmacy.address}, ${tr('distance', 'दूरी', 'अंतर')} ${pharmacy.distance}. ${tr('Status:', 'स्थिति:', 'स्थिती:')} ${pharmacy.isOpen ? tr('Open', 'खुला है', 'चालू आहे') : tr('Closed', 'बंद है', 'बंद आहे')}. ${tr('Medicine', 'दवा', 'औषध')} ${searchTerm} ${formatStockStatus(stockInfo.status)}.`;
                            voiceService.speakText({
                              text: textToSpeak,
                              language,
                              onStart: () => setSpeakingPharmacyId(pharmacy.id),
                              onEnd: () => setSpeakingPharmacyId(null),
                              onError: () => setSpeakingPharmacyId(null)
                            });
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            color: speakingPharmacyId === pharmacy.id ? '#DC2626' : '#0F766E',
                            backgroundColor: speakingPharmacyId === pharmacy.id ? '#FEE2E2' : '#F0FDFA',
                            border: '1px solid #CCFBF1'
                          }}
                          title={speakingPharmacyId === pharmacy.id ? tr('Stop audio', 'रोकें', 'थांबवा') : tr('Listen aloud', 'बोलकर सुनें', 'ऐका')}
                        >
                          {speakingPharmacyId === pharmacy.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                        <span className={`badge ${pharmacy.isOpen ? 'badge-success' : 'badge-neutral'}`}>
                          {pharmacy.isOpen ? tr('Open', 'खुला है', 'चालू') : tr('Closed', 'बंद है', 'बंद')}
                        </span>
                      </div>
                    </div>

                    {/* Stock status alert box */}
                    <div
                      style={{
                        margin: '0.85rem 0',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isAvailable ? '#F0FDF4' : '#FEF2F2',
                        border: `1px solid ${isAvailable ? '#BBF7D0' : '#FECACA'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isAvailable ? (
                          <CheckCircle size={18} color="#16A34A" />
                        ) : (
                          <AlertCircle size={18} color="#DC2626" />
                        )}
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isAvailable ? '#166534' : '#991B1B' }}>
                            {formatStockStatus(stockInfo.status)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {tr('Selected Query:', 'चयनित दवा:', 'निवडलेले औषध:')} <strong>{searchTerm}</strong>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Pharmacy Info & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} /> {pharmacy.timing}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCall(pharmacy.phone); }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          <Phone size={13} /> {tr('Call', 'कॉल करें', 'फोन करा')}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDirections(pharmacy); }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          <Navigation size={13} /> {tr('Directions', 'रास्ता देखें', 'मार्ग पहा')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive OpenStreetMap with Pharmacy Pins */}
        <div>
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div className="card" style={{ padding: '0.5rem' }}>
              <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📍 {tr('Local Jan Aushadhi & Pharmacy Map', 'स्थानीय जन औषधि व मेडिकल स्टोर नक्शा', 'स्थानिक जन औषधी व फार्मसी नकाशा')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {pharmacies.length} {tr('locations near you', 'नजदीकी केंद्र', 'जवळची केंद्रे')}
                </span>
              </div>
              <LeafletMap
                center={selectedPharmacy ? [selectedPharmacy.lat, selectedPharmacy.lng] : [18.8472, 73.9142]}
                zoom={14}
                markers={mapMarkers}
                height="480px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
