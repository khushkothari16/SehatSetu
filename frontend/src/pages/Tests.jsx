import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { diagnosticService } from '../services/diagnosticService';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const Tests = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking modal
  const [bookingTest, setBookingTest] = useState(null);
  const [selectedLab, setSelectedLab] = useState('Khed PHC Pathology Laboratory');
  const [bookDate, setBookDate] = useState('2026-09-12');
  const [bookTime, setBookTime] = useState('08:30 AM');
  const [sampleMode, setSampleMode] = useState('lab_visit');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await diagnosticService.getAvailableTests(searchTerm);
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [searchTerm]);

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (bookingTest) {
        e.preventDefault();
        setBookingTest(null);
        setConfirmedBooking(null);
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [bookingTest]);

  const handleConfirmTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await diagnosticService.bookTest({
        testId: bookingTest.id,
        facilityName: selectedLab,
        date: bookDate,
        time: bookTime,
        sampleMode: sampleMode === 'home' ? 'Home Sample Collection' : 'Lab Visit'
      });
      setConfirmedBooking(res);
      addToast(`${tr('Diagnostic test booked successfully:', 'जांच स्लॉट सफलतापूर्वक बुक हुआ:', 'चाचणी यशस्वीरित्या बुक झाली:')} ${bookingTest.name}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to book test', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              <Activity size={28} color="var(--primary)" />
              {t('tests')} {tr('& Lab Investigations', 'एवं लैब जांच', 'व प्रयोगशाळा चाचण्या')}
            </h1>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="btn btn-outline btn-sm"
          >
            <FileCheck size={16} />
            {tr('View Past Reports', 'पुरानी रिपोर्ट देखें', 'मागील अहवाल पहा')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-wrapper" style={{ marginBottom: '1.5rem' }}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={tr('Search tests (e.g. CBC, Blood Sugar, X-Ray)...', 'जांच खोजें (जैसे सीबीसी, ब्लड शुगर, एक्स-रे)...', 'चाचणी शोधा (उदा. सीबीसी, रक्त शर्करा, एक्स-रे)...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
      ) : tests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>{tr('No diagnostic tests match your query', 'आपकी खोज के अनुसार कोई जांच नहीं मिली', 'कोणतीही चाचणी आढळली नाही')}</h3>
        </div>
      ) : (
        <div className="grid-2">
          {tests.map((test) => (
            <div
              key={test.id}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span className="badge badge-neutral">{test.category}</span>
                </div>

                <h3 style={{ margin: '4px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {test.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                  {test.description}
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div><strong>{tr('Sample:', 'नमूना:', 'नमुना:')}</strong> {test.sampleType}</div>
                  <div><strong>{tr('Report Ready In:', 'रिपोर्ट समय:', 'अहवाल वेळ:')}</strong> {test.turnaroundTime}</div>
                  <div>
                    <strong>{tr('Fasting:', 'खाली पेट:', 'उपाशी पोटी:')}</strong>{' '}
                    <span style={{ color: test.fastingRequired ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                      {test.fastingRequired ? tr('Required (8-10 hrs overnight)', 'आवश्यक (रात भर खाली पेट)', 'आवश्यक (रात्रभर उपाशी)') : tr('Not Required', 'आवश्यक नहीं', 'आवश्यक नाही')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setBookingTest(test); setConfirmedBooking(null); }}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', fontWeight: 700 }}
              >
                {tr('Book Diagnostic Slot', 'जांच स्लॉट बुक करें', 'चाचणी वेळ बुक करा')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingTest && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setBookingTest(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {tr('Book', 'जांच बुक करें:', 'चाचणी बुक करा:')} {bookingTest.name}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setBookingTest(null)} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {!confirmedBooking ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">{tr('Select Diagnostic Centre', 'जांच केंद्र चुनें', 'तपासणी केंद्र निवडा')}</label>
                    <select
                      className="form-select"
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                    >
                      <option value="Khed PHC Pathology Laboratory">Khed PHC Pathology Laboratory (Govt Subsidized)</option>
                      <option value="Apex Rural Diagnostic Centre">Apex Rural Diagnostic & Imaging Centre</option>
                      <option value="District Civil Hospital Lab">District Civil Hospital Lab, Chakan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr('Sample Collection Mode', 'सैंपल संकलन माध्यम', 'नमुना संकलन प्रकार')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div
                        onClick={() => setSampleMode('lab_visit')}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${sampleMode === 'lab_visit' ? 'var(--primary)' : 'var(--border)'}`,
                          background: sampleMode === 'lab_visit' ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tr('Lab Visit', 'लैब पर जाएं', 'लॅबमध्ये भेट')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tr('Visit centre directly', 'सीधे केंद्र पर पहुंचें', 'थेट केंद्रावर जा')}</div>
                      </div>

                      <div
                        onClick={() => setSampleMode('home')}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${sampleMode === 'home' ? 'var(--primary)' : 'var(--border)'}`,
                          background: sampleMode === 'home' ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tr('Home Collection', 'घर से सैंपल', 'घरी नमुना संकलन')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tr('Phlebotomist doorstep visit', 'घर पर लैब तकनीशियन आएगा', 'घरी लॅब तंत्रज्ञ येईल')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr('Date', 'दिनांक', 'तारीख')}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={bookDate}
                      min="2026-09-08"
                      onChange={(e) => setBookDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr('Time Slot', 'समय स्लॉट', 'वेळ')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {['07:30 AM', '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM', '04:00 PM'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setBookTime(slot)}
                          style={{
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${bookTime === slot ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: bookTime === slot ? 'var(--primary)' : 'var(--surface)',
                            color: bookTime === slot ? 'white' : 'var(--text-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle2 size={48} color="#16A34A" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{tr('Booking Confirmed!', 'जांच बुकिंग सुनिश्चित!', 'चाचणी बुकिंग निश्चित!')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {tr('Reference ID:', 'संदर्भ आईडी:', 'संदर्भ आयडी:')} <strong>{confirmedBooking.bookingId}</strong>
                  </p>

                  <div style={{ margin: '1rem 0', padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: '0.85rem' }}>
                    <div><strong>{tr('Test:', 'जांच:', 'चाचणी:')}</strong> {confirmedBooking.testName}</div>
                    <div><strong>{tr('Lab:', 'प्रयोगशाला:', 'प्रयोगशाळा:')}</strong> {confirmedBooking.facility}</div>
                    <div><strong>{tr('Schedule:', 'समय सारिणी:', 'वेळ:')}</strong> {confirmedBooking.date} at {confirmedBooking.time}</div>
                    <div><strong>{tr('Collection Mode:', 'सैंपल माध्यम:', 'नमुना प्रकार:')}</strong> {confirmedBooking.sampleMode}</div>
                    <div style={{ color: '#B45309', marginTop: '4px' }}><strong>{tr('Note:', 'टिप्पणी:', 'टीप:')}</strong> {confirmedBooking.instructions}</div>
                  </div>

                  <button
                    onClick={() => { setBookingTest(null); onNavigate('reports'); }}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    {tr('Done & View Reports Dashboard', 'पूर्ण & रिपोर्ट डैशबोर्ड देखें', 'पूर्ण & अहवाल डॅशबोर्ड पहा')}
                  </button>
                </div>
              )}
            </div>

            {!confirmedBooking && (
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setBookingTest(null)}
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmTest}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? tr('Booking Slot...', 'स्लॉट बुक हो रहा है...', 'वेळ निश्चित केली जात आहे...') : tr('Confirm Lab Booking', 'जांच पक्की करें', 'चाचणी निश्चित करा')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
