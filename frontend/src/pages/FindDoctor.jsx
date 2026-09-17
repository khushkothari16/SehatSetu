import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Sparkles,
  Video,
  UserCheck,
  Filter,
  CheckCircle,
  AlertTriangle,
  X,
  Calendar,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import { voiceService } from '../services/voiceService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { locationService } from '../services/locationService';

export const FindDoctor = ({ onNavigate, onDoctorSelect }) => {
  const { user } = useAuth();
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();
  const { location } = useLocation();

  const getSpecialtyLabel = (spec) => {
    if (!spec) return '';
    const map = {
      'All': tr('All', 'सभी विभाग', 'सर्व विभाग'),
      'General Physician': tr('General Physician', 'सामान्य चिकित्सक', 'सामान्य वैद्यकीय अधिकारी'),
      'Pediatrician': tr('Pediatrician', 'बाल रोग विशेषज्ञ', 'बालरोगतज्ज्ञ'),
      'Gynecologist': tr('Gynecologist', 'स्त्री एवं प्रसूति रोग', 'स्त्रीरोगतज्ज्ञ'),
      'Cardiologist': tr('Cardiologist', 'हृदय रोग विशेषज्ञ', 'हृदयरोगतज्ज्ञ'),
      'Orthopedic': tr('Orthopedic', 'हड्डी रोग विशेषज्ञ', 'अस्थिरोगतज्ज्ञ'),
      'Dermatologist': tr('Dermatologist', 'त्वचा रोग विशेषज्ञ', 'त्वचारोगतज्ज्ञ'),
      'Ophthalmologist': tr('Ophthalmologist', 'नेत्र रोग विशेषज्ञ', 'नेत्ररोगतज्ज्ञ')
    };
    return map[spec] || spec;
  };

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [loading, setLoading] = useState(true);

  // Smart Recommendation State & Voice
  const [symptomInput, setSymptomInput] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isListeningSymptom, setIsListeningSymptom] = useState(false);
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [isSpeakingRec, setIsSpeakingRec] = useState(false);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [consultMode, setConsultMode] = useState('offline');
  const [consultDate, setConsultDate] = useState('2026-09-11');
  const [consultTime, setConsultTime] = useState('11:00 AM');
  const [symptomNotes, setSymptomNotes] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docList, specList] = await Promise.all([
        doctorService.getDoctors({ specialty: selectedSpecialty, search: searchQuery, mode: selectedMode }),
        doctorService.getSpecialties()
      ]);
      setDoctors(docList);
      setSpecialties(specList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSpecialty, searchQuery, selectedMode]);

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (bookingDoctor) {
        e.preventDefault();
        if (bookingStep === 2) {
          setBookingStep(1);
        } else {
          setBookingDoctor(null);
          setBookingConfirmed(null);
        }
        return;
      }
      if (recommendation) {
        e.preventDefault();
        setRecommendation(null);
        return;
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [bookingDoctor, bookingStep, recommendation]);

  const handleRunRecommendation = async (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;
    setIsRecommending(true);
    const rec = await doctorService.getSmartDoctorRecommendation(symptomInput);
    setRecommendation(rec);
    setIsRecommending(false);
  };

  const handleStartBooking = (doctor) => {
    setBookingDoctor(doctor);
    setConsultMode(doctor.consultationModes.includes('offline') ? 'offline' : 'online');
    setBookingStep(1);
    setBookingConfirmed(null);
  };

  const handleConfirmAppointment = async () => {
    setIsBooking(true);
    try {
      const newApt = await appointmentService.bookAppointment({
        doctor: bookingDoctor,
        mode: consultMode,
        date: consultDate,
        time: consultTime,
        reason: symptomNotes,
        patient: user
      });
      setBookingConfirmed(newApt);
      addToast(`Appointment confirmed with ${bookingDoctor.name}! Token #${newApt.tokenNumber}`, 'success');
      setBookingStep(3); // Success step
    } catch (err) {
      addToast(err.message || 'Failed to book appointment', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <UserCheck size={28} color="var(--primary)" />
          {t('findDoctor')}
        </h1>
      </div>

      {/* SMART DOCTOR RECOMMENDATION BANNER */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 100%)',
          border: '1px solid #99F6E4'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-hover)' }}>
              {t('smartRecommendation')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {tr('AI Triage Assistant • Future-ready Rural Healthcare Routing', 'एआई रोग पहचान सहायक • ग्रामीण स्वास्थ्य मार्गदर्शन', 'एआय आरोग्य सहाय्यक • ग्रामीण आरोग्य मार्गदर्शन')}
            </span>
          </div>
        </div>

        <form onSubmit={handleRunRecommendation} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flex: 1, minWidth: '240px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, margin: 0 }}
              placeholder={isListeningSymptom ? tr('Listening... Speak your symptoms...', 'सुन रहे हैं... अपने लक्षण बोलें...', 'ऐकत आहे... आपली लक्षणे सांगा...') : tr('Describe health complaints (e.g. stomach ache, fever)...', 'परेशानी या लक्षण लिखें (जैसे पेट दर्द, बुखार)...', 'त्रास किंवा लक्षणे लिहा (उदा. पोटदुखी, ताप)...')}
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
            />
            {/* Mic button for symptom input */}
            <button
              type="button"
              onClick={() => {
                if (isListeningSymptom) {
                  setIsListeningSymptom(false);
                  return;
                }
                if (!voiceService.isSpeechRecognitionSupported()) {
                  addToast('Voice mic is not supported in this browser.', 'warning');
                  return;
                }
                setIsListeningSymptom(true);
                addToast(tr('🎙️ Speak your symptoms now...', '🎙️ अब अपने लक्षण बोलें...', '🎙️ आता आपली लक्षणे सांगा...'), 'info');
                voiceService.startListening({
                  language,
                  onResult: ({ text }) => setSymptomInput(text),
                  onError: () => setIsListeningSymptom(false),
                  onEnd: () => setIsListeningSymptom(false)
                });
              }}
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: isListeningSymptom ? '#EF4444' : '#7C3AED',
                color: 'white',
                padding: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isListeningSymptom ? 'pulse 1.2s infinite' : 'none'
              }}
              title={isListeningSymptom ? 'Stop listening' : 'Tap to speak symptoms'}
            >
              {isListeningSymptom ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isRecommending || !symptomInput.trim()}>
            {isRecommending ? tr('Analyzing Symptoms...', 'लक्षणों का विश्लेषण हो रहा है...', 'लक्षणांचे विश्लेषण सुरू आहे...') : tr('Suggest Specialist', 'विशेषज्ञ डॉक्टर का सुझाव दें', 'तज्ज्ञ डॉक्टरांचा सल्ला घ्या')}
          </button>
        </form>

        {/* Recommendation Result Card */}
        {recommendation && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: recommendation.isEmergency ? 'var(--emergency-light)' : 'white',
              border: `1px solid ${recommendation.isEmergency ? '#FCA5A5' : 'var(--border)'}`
            }}
          >
            {recommendation.isEmergency ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--emergency)', fontWeight: 800, fontSize: '1rem' }}>
                  <AlertTriangle size={20} />
                  <span>{tr('EMERGENCY RED FLAG DETECTED', '🚨 गंभीर आपातकालीन लक्षण पाया गया', '🚨 गंभीर आपत्कालीन लक्षण आढळले')}</span>
                </div>
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#7F1D1D', fontWeight: 600 }}>
                  {recommendation.alertMessage}
                </p>
                <button
                  onClick={() => onNavigate('emergency')}
                  className="btn btn-emergency btn-sm"
                  style={{ marginTop: '0.5rem', fontWeight: 700 }}
                >
                  {tr('🚨 Launch Emergency SOS Dispatch (108)', '🚨 तुरंत 108 एम्बुलेंस आपातकाल भेजें', '🚨 त्वरित १०८ रुग्णवाहिका बोलवा')}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {tr('Suggested Department:', 'सुझाया गया विभाग:', 'सुचवलेला विभाग:')} {recommendation.recommendedDepartment}
                    </span>
                    <h4 style={{ margin: '2px 0 4px 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {tr('Recommended Care:', 'अनुशंसित विशेषज्ञ:', 'शिफारस केलेले तज्ज्ञ:')} {getSpecialtyLabel(recommendation.recommendedSpecialty)}
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSpecialty(recommendation.recommendedSpecialty);
                      setRecommendation(null);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    {tr('Filter Doctors by this Specialty', 'इस विशेषज्ञ के डॉक्टर देखें', 'या विभागातील डॉक्टर शोधा')}
                  </button>
                </div>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {recommendation.explanation}
                </p>

                {/* Speaker Button to Hear Recommendation Aloud */}
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeakingRec) {
                        voiceService.stopSpeaking();
                        setIsSpeakingRec(false);
                        return;
                      }
                      setIsSpeakingRec(true);
                      const speechText = `${tr('Recommended care:', 'सलाह:', 'सल्ला:')} ${getSpecialtyLabel(recommendation.recommendedSpecialty)}. ${tr('Department:', 'विभाग:', 'विभाग:')} ${recommendation.recommendedDepartment}. ${recommendation.explanation}`;
                      voiceService.speakText({
                        text: speechText,
                        language,
                        onStart: () => setIsSpeakingRec(true),
                        onEnd: () => setIsSpeakingRec(false),
                        onError: () => setIsSpeakingRec(false)
                      });
                    }}
                    className="btn btn-sm"
                    style={{
                      borderRadius: '16px',
                      backgroundColor: isSpeakingRec ? '#FEF2F2' : '#F5F3FF',
                      border: isSpeakingRec ? '1.5px solid #EF4444' : '1.5px solid #7C3AED',
                      color: isSpeakingRec ? '#DC2626' : '#6D28D9',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title={isSpeakingRec ? 'Stop audio' : 'Listen to this recommendation aloud'}
                  >
                    {isSpeakingRec ? (
                      <>
                        <VolumeX size={15} />
                        <span>{tr('Stop Audio', 'ऑडियो रोकें', 'ऑडिओ थांबवा')}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={15} />
                        <span>{tr('🔊 Listen to Recommendation', '🔊 सुझाव सुनें', '🔊 सल्ला ऐका')}</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  ⚠️ {t('smartRecommendationNotice')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 260, display: 'flex', alignItems: 'center' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={isListeningSearch ? "Listening... Speak doctor or specialty..." : t('searchDoctorPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Mic Button for Doctor Search */}
          <button
            type="button"
            onClick={() => {
              if (isListeningSearch) {
                setIsListeningSearch(false);
                return;
              }
              if (!voiceService.isSpeechRecognitionSupported()) {
                addToast('Voice mic is not supported in this browser.', 'warning');
                return;
              }
              setIsListeningSearch(true);
              addToast('🎙️ Speak doctor or specialty name...', 'info');
              voiceService.startListening({
                language,
                onResult: ({ text }) => setSearchQuery(text),
                onError: () => setIsListeningSearch(false),
                onEnd: () => setIsListeningSearch(false)
              });
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 8px',
              color: isListeningSearch ? '#EF4444' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isListeningSearch ? 'Stop listening' : 'Tap to speak doctor name or hospital'}
          >
            {isListeningSearch ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>

        {/* Mode Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${selectedMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedMode('all')}
          >
            {tr('All Modes', 'सभी प्रकार', 'सर्व प्रकार')}
          </button>
          <button
            className={`btn btn-sm ${selectedMode === 'offline' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedMode('offline')}
          >
            {tr('In-Person OPD', 'ओपीडी अस्पताल', 'प्रत्यक्ष ओपीडी')}
          </button>
          <button
            className={`btn btn-sm ${selectedMode === 'online' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedMode('online')}
          >
            <Video size={14} /> {tr('Teleconsult', 'वीडियो परामर्श', 'व्हिडिओ सल्ला')}
          </button>
        </div>
      </div>

      {/* Specialty Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          scrollbarWidth: 'none'
        }}
      >
        {specialties.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: selectedSpecialty === spec ? 'var(--primary)' : 'var(--border)',
              backgroundColor: selectedSpecialty === spec ? 'var(--primary)' : 'var(--surface)',
              color: selectedSpecialty === spec ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {getSpecialtyLabel(spec)}
          </button>
        ))}
      </div>

      {/* DOCTORS DIRECTORY GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          {t('loading')}
        </div>
      ) : doctors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <UserCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{tr('No doctors found', 'कोई डॉक्टर उपलब्ध नहीं मिला', 'कोणतेही डॉक्टर आढळले नाही')}</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.25rem 0' }}>
            {tr('Try adjusting your search terms or specialty filters.', 'कृपया खोज शब्द या विशेषज्ञ फिल्टर बदलकर देखें।', 'कृपया शोध शब्द किंवा विभाग फिल्टर बदलून पहा.')}
          </p>
          <button
            onClick={() => { setSelectedSpecialty('All'); setSearchQuery(''); setSelectedMode('all'); }}
            className="btn btn-primary btn-sm"
          >
            {tr('Reset Filters', 'सभी फिल्टर हटाएं', 'सर्व फिल्टर पूर्ववत करा')}
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                {/* Doctor Card Top */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      border: '2px solid var(--border-subtle)'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                        {getSpecialtyLabel(doctor.specialty)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#D97706', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Star size={14} fill="#D97706" />
                        <span>{doctor.rating}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>
                          ({doctor.reviewsCount})
                        </span>
                      </div>
                    </div>

                    <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {doctor.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {doctor.degrees} • {doctor.experience} {tr('exp', 'अनुभव', 'अनुभव')}
                    </div>
                  </div>
                </div>

                {/* Facility & Distance Info */}
                <div
                  style={{
                    margin: '1rem 0',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-alt)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.825rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{doctor.hospital}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0, fontWeight: 700 }}>
                      📍 {doctor.lat && doctor.lng && location?.lat && location?.lng
                        ? `${locationService.calculateDistanceKm(location.lat, location.lng, doctor.lat, doctor.lng)} km`
                        : doctor.distance}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Clock size={14} color="var(--secondary)" style={{ flexShrink: 0 }} />
                    <span>{tr('Next Slot:', 'अगला समय:', 'पुढील वेळ:')} <strong>{doctor.nextSlot}</strong></span>
                  </div>
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                  {doctor.bio}
                </p>
              </div>

              {/* Consultation Modes & Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {doctor.consultationModes.includes('offline') && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {tr('🏥 In-Person OPD', '🏥 ओपीडी अस्पताल', '🏥 प्रत्यक्ष ओपीडी')}
                    </span>
                  )}
                  {doctor.consultationModes.includes('online') && (
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      <Video size={12} /> {tr('Teleconsult', 'वीडियो परामर्श', 'व्हिडिओ सल्ला')}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleStartBooking(doctor)}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  {t('bookSlot')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5-STEP APPOINTMENT BOOKING MODAL */}
      {bookingDoctor && (
        <div className="modal-overlay" onClick={() => !isBooking && setBookingDoctor(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {tr('STEP', 'चरण', 'पायरी')} {bookingStep} {tr('OF 3', 'कुल 3 में से', '३ पैकी')}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {bookingStep === 3
                    ? tr('Booking Confirmed!', 'अपॉइंटमेंट पक्की हो गई!', 'अपॉइंटमेंट निश्चित झाली!')
                    : `${tr('Book with', 'अपॉइंटमेंट बुक करें:', 'अपॉइंटमेंट बुक करा:')} ${bookingDoctor.name}`}
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setBookingDoctor(null)}
                disabled={isBooking}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* STEP 1: Select Mode & Date/Time */}
              {bookingStep === 1 && (
                <div className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">{t('selectMode')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div
                        onClick={() => setConsultMode('offline')}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${consultMode === 'offline' ? 'var(--primary)' : 'var(--border)'}`,
                          background: consultMode === 'offline' ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {tr('🏥 In-Person OPD', '🏥 ओपीडी अस्पताल', '🏥 प्रत्यक्ष ओपीडी')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {tr('Visit at', 'अस्पताल:', 'दवाखाना:')} {bookingDoctor.hospital}
                        </div>
                      </div>

                      <div
                        onClick={() => setConsultMode('online')}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${consultMode === 'online' ? 'var(--primary)' : 'var(--border)'}`,
                          background: consultMode === 'online' ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Video size={14} /> {tr('Teleconsult', 'वीडियो परामर्श', 'व्हिडिओ सल्ला')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {tr('Video call from your phone/PC', 'मोबाइल से वीडियो परामर्श', 'मोबाईलवरून व्हिडिओ तपासणी')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('selectDate')}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={consultDate}
                      min="2026-09-08"
                      onChange={(e) => setConsultDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('selectTime')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {['09:30 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '03:30 PM'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setConsultTime(slot)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${consultTime === slot ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: consultTime === slot ? 'var(--primary)' : 'var(--surface)',
                            color: consultTime === slot ? 'white' : 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Symptoms & Review */}
              {bookingStep === 2 && (
                <div className="animate-fade-in">
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-alt)',
                      marginBottom: '1rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div><strong>{tr('Doctor:', 'डॉक्टर:', 'डॉक्टर:')}</strong> {bookingDoctor.name} ({getSpecialtyLabel(bookingDoctor.specialty)})</div>
                    <div><strong>{tr('Facility:', 'अस्पताल:', 'आरोग्य केंद्र:')}</strong> {bookingDoctor.hospital}</div>
                    <div><strong>{tr('Date & Time:', 'दिनांक व समय:', 'तारीख व वेळ:')}</strong> {consultDate} at {consultTime}</div>
                    <div><strong>{tr('Mode:', 'प्रकार:', 'प्रकार:')}</strong> {consultMode === 'online' ? tr('Video Teleconsultation', 'ऑनलाइन वीडियो परामर्श', 'ऑनलाइन व्हिडिओ तपासणी') : tr('In-Person OPD Visit', 'प्रत्यक्ष ओपीडी परामर्श', 'प्रत्यक्ष ओपीडी तपासणी')}</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr('Briefly describe your symptoms or reason for visit', 'अपनी परेशानी या लक्षण संक्षेप में लिखें', 'आपली लक्षणे किंवा भेटीचे कारण थोडक्यात लिहा')}</label>
                    <textarea
                      className="form-textarea"
                      placeholder={tr('e.g. Mild fever for 2 days, sore throat, needing routine prescription review...', 'उदा. 2 दिन से बुखार, गले में खराश, नियमित जांच...', 'उदा. २ दिवस ताप, घशात खवखव, नियमित तपासणी...')}
                      value={symptomNotes}
                      onChange={(e) => setSymptomNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Confirmed Screen */}
              {bookingStep === 3 && bookingConfirmed && (
                <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem auto'
                    }}
                  >
                    <CheckCircle size={36} />
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    {t('bookingSuccess')}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    {tr('Appointment Reference:', 'अपॉइंटमेंट संदर्भ ID:', 'अपॉइंटमेंट संदर्भ आयडी:')} <strong>{bookingConfirmed.id}</strong>
                  </p>

                  <div
                    style={{
                      margin: '1.25rem 0',
                      padding: '1.25rem',
                      background: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{tr('Assigned Token:', 'आवंटित टोकन:', 'मिळालेला टोकन क्रमांक:')}</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Token #{bookingConfirmed.tokenNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{tr('Doctor:', 'डॉक्टर:', 'डॉक्टर:')}</span>
                      <strong>{bookingConfirmed.doctorName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{tr('Date & Slot:', 'दिनांक व समय:', 'तारीख व वेळ:')}</span>
                      <strong>{bookingConfirmed.date}, {bookingConfirmed.time}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{tr('Location:', 'स्थान व कमरा:', 'स्थान व खोली:')}</span>
                      <strong>{bookingConfirmed.facility} ({bookingConfirmed.room})</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => { setBookingDoctor(null); onNavigate('queue'); }}
                      className="btn btn-primary"
                    >
                      {tr('Track Live Queue Token', 'लाइव ओपीडी कतार देखें', 'थेट ओपीडी रांग पहा')}
                    </button>
                    {bookingConfirmed.mode === 'online' && (
                      <button
                        onClick={() => { setBookingDoctor(null); onNavigate('consultation'); }}
                        className="btn btn-outline"
                      >
                        {tr('Join Video Room', 'वीडियो रूम में जुड़ें', 'व्हिडिओ रूममध्ये जा')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {bookingStep < 3 && (
              <div className="modal-footer">
                {bookingStep > 1 && (
                  <button
                    className="btn btn-outline"
                    onClick={() => setBookingStep(bookingStep - 1)}
                    disabled={isBooking}
                  >
                    {tr('Back', 'पीछे जाएं', 'मागे जा')}
                  </button>
                )}
                {bookingStep === 1 && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setBookingStep(2)}
                  >
                    {tr('Next', 'आगे', 'पुढे')}
                  </button>
                )}
                {bookingStep === 2 && (
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmAppointment}
                    disabled={isBooking}
                  >
                    {isBooking ? tr('Securing Slot...', 'स्लॉट सुरक्षित किया जा रहा है...', 'वेळ निश्चित केली जात आहे...') : t('confirmBooking')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
