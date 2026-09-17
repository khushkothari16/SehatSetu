import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  User,
  ShieldCheck,
  Send,
  Calendar,
  FileText,
  Share2,
  Activity,
  Heart,
  Thermometer,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ashaService } from '../services/ashaService';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { queueService } from '../services/queueService';

export const DoctorAshaRequestsModal = ({
  isOpen,
  onClose,
  onSelectPatientForRx,
  onSelectPatientForReferral
}) => {
  const { tr, language } = useLanguage();
  const { addToast } = useNotifications();

  const [requests, setRequests] = useState(() => ashaService.getConsultationRequestsSync());
  const [filter, setFilter] = useState('all'); // 'all' | 'RED' | 'YELLOW' | 'GREEN' | 'Accepted'
  const [selectedReq, setSelectedReq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sync = () => {
      const all = ashaService.getConsultationRequestsSync();
      setRequests(all);
      if (selectedReq) {
        const updated = Array.isArray(all) ? all.find(r => r.id === selectedReq.id) : null;
        if (updated) setSelectedReq(updated);
      }
    };
    window.addEventListener('asha_consultation_request_created', sync);
    window.addEventListener('asha_consultation_request_updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('asha_consultation_request_created', sync);
      window.removeEventListener('asha_consultation_request_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [selectedReq]);

  if (!isOpen) return null;

  const safeRequests = Array.isArray(requests) ? requests : [];
  const filteredRequests = safeRequests.filter(r => {
    if (filter === 'RED' && r.triageCategory !== 'RED') return false;
    if (filter === 'YELLOW' && r.triageCategory !== 'YELLOW') return false;
    if (filter === 'GREEN' && r.triageCategory !== 'GREEN') return false;
    if (filter === 'Accepted' && r.status !== 'Accepted') return false;
    if (filter === 'pending' && r.status === 'Accepted') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        (r.village && r.village.toLowerCase().includes(q)) ||
        (r.ashaName && r.ashaName.toLowerCase().includes(q)) ||
        (r.symptoms && r.symptoms.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAcceptAndQueue = async (req) => {
    setIsSubmitting(true);
    try {
      // 1. Update ASHA request status
      ashaService.updateConsultationRequestStatus(req.id, 'Accepted', {
        doctorNotes: doctorNotes.trim() || 'Accepted by Dr. Anjali Mehta. Patient queued for priority clinical examination.',
        assignedDoctorId: 'DOC-ANJALI-01',
        assignedDoctorName: 'Dr. Anjali Mehta'
      });

      // 2. Add to active queue if queueService supports it
      try {
        queueService.addOfflinePatientToQueueSync({
          name: req.patientName,
          age: req.age || 40,
          gender: req.gender || 'Unknown',
          village: req.village || 'Field Outreach',
          abhaId: req.abhaId || 'ABHA-FIELD-999',
          symptoms: req.symptoms,
          priority: req.triageCategory === 'RED' ? 'Emergency' : req.triageCategory === 'YELLOW' ? 'High' : 'Normal',
          source: 'ASHA Field Triage'
        });
      } catch (err) {
        console.warn('Queue sync fallback:', err);
      }

      // 3. Send guidance message to ASHA
      ashaService.sendMessage({
        toRole: 'asha',
        toId: req.ashaId,
        patientId: req.patientId,
        patientName: req.patientName,
        text: `Consultation accepted for ${req.patientName}. Token issued in OPD. ${doctorNotes.trim() ? `Instructions: ${doctorNotes.trim()}` : 'Please guide patient to PHC Room 4.'}`
      });

      addToast(`Accepted consultation for ${req.patientName}. OPD Queue Token generated.`, 'success');
      setDoctorNotes('');
    } catch (err) {
      console.error(err);
      addToast('Error accepting consultation request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendGuidance = (req) => {
    if (!doctorNotes.trim()) {
      addToast('Please write clinical guidance before sending', 'warning');
      return;
    }
    ashaService.sendMessage({
      toRole: 'asha',
      toId: req.ashaId,
      patientId: req.patientId,
      patientName: req.patientName,
      text: doctorNotes.trim()
    });

    ashaService.updateConsultationRequestStatus(req.id, req.status, {
      doctorNotes: doctorNotes.trim(),
      lastGuidanceAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    addToast(`Clinical guidance dispatched to ASHA worker ${req.ashaName}`, 'success');
    setDoctorNotes('');
  };

  const handleRequestMoreVitals = (req) => {
    const msg = 'Please re-measure blood pressure and SpO2 in 15 minutes. Check if patient has taken oral hydration.';
    ashaService.sendMessage({
      toRole: 'asha',
      toId: req.ashaId,
      patientId: req.patientId,
      patientName: req.patientName,
      text: msg
    });
    ashaService.updateConsultationRequestStatus(req.id, 'More Information Requested', {
      doctorNotes: msg
    });
    addToast('Request for repeat field vitals sent to ASHA', 'info');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          maxWidth: '1050px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.6rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #065F46 0%, #047857 60%, #059669 100%)',
            color: 'white'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              <Users size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {tr('ASHA Field Triage & Rural Consultation Desk', 'आशा फील्ड ट्राइएज व ग्रामीण परामर्श डेस्क', 'आशा फील्ड ट्रायज व ग्रामीण सल्लामसलत डेस्क')}
                </h3>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  SIH26133
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#D1FAE5' }}>
                {tr(
                  'Review real-time digital triage requests from frontline ASHA workers in connected villages',
                  'संबंधित गांवों के फ्रंटलाइन आशा कार्यकर्ताओं से वास्तविक समय के फील्ड ट्राइएज अनुरोध देखें',
                  'जोडलेल्या गावांमधील आशा कार्यकर्त्यांकडून रिअल-टाइम ट्रायज विनंत्यांचे पुनरावलोकन करा'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: '0.85rem 1.6rem',
            borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: tr('All Requests', 'सभी अनुरोध', 'सर्व विनंत्या'), count: requests.length },
              { id: 'RED', label: '🚨 ' + tr('Emergency Red', 'आपातकालीन लाल', 'तातडीची लाल'), count: requests.filter(r => r.triageCategory === 'RED').length, color: '#dc2626' },
              { id: 'YELLOW', label: '⚠️ ' + tr('Urgent Yellow', 'गंभीर पीला', 'गंभीर पिवळा'), count: requests.filter(r => r.triageCategory === 'YELLOW').length, color: '#d97706' },
              { id: 'GREEN', label: '🟢 ' + tr('Routine Green', 'सामान्य हरा', 'सामान्य हिरवा'), count: requests.filter(r => r.triageCategory === 'GREEN').length, color: '#16a34a' },
              { id: 'pending', label: tr('Pending Action', 'लंबित', 'प्रलंबित'), count: requests.filter(r => r.status !== 'Accepted').length },
              { id: 'Accepted', label: '✓ ' + tr('Accepted', 'स्वीकृत', 'स्वीकृत'), count: requests.filter(r => r.status === 'Accepted').length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: filter === tab.id ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: filter === tab.id ? '#059669' : '#ffffff',
                  color: filter === tab.id ? '#ffffff' : tab.color || '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: filter === tab.id ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.7rem'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={tr('Search patient, village, symptom...', 'मरीज, गांव या लक्षण खोजें...', 'रुग्ण, गाव किंवा लक्षण शोधा...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedReq ? '1.1fr 1.3fr' : '1fr', overflow: 'hidden', flex: 1 }}>
          {/* Requests List */}
          <div style={{ padding: '1rem', overflowY: 'auto', borderRight: selectedReq ? '1px solid #e2e8f0' : 'none', maxHeight: '68vh' }}>
            {filteredRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontWeight: 800, color: '#475569', fontSize: '1rem' }}>
                  {tr('No ASHA consultation requests match filter', 'कोई आशा परामर्श अनुरोध नहीं मिला', 'कोणतीही आशा सल्लामसलत विनंती सापडली नाही')}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                  {tr('When ASHA workers submit digital triage for patients in field, they appear here in real-time.', 'जब आशा कार्यकर्ता फील्ड में मरीजों का डिजिटल ट्राइएज सबमिट करेंगी, तो वे यहाँ लाइव दिखेंगे।', 'जेव्हा आशा कार्यकर्त्या फील्डमध्ये रुग्णांचे डिजिटल ट्रायज सादर करतील, तेव्हा त्या येथे थेट दिसतील.')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredRequests.map((req) => {
                  const isRed = req.triageCategory === 'RED';
                  const isYellow = req.triageCategory === 'YELLOW';
                  const isSelected = selectedReq?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      style={{
                        padding: '0.9rem 1.1rem',
                        borderRadius: '12px',
                        border: isSelected
                          ? '2px solid #059669'
                          : isRed
                          ? '2px solid #FCA5A5'
                          : isYellow
                          ? '1.5px solid #FDE68A'
                          : '1px solid #E2E8F0',
                        background: isSelected
                          ? '#ECFDF5'
                          : isRed
                          ? '#FEF2F2'
                          : isYellow
                          ? '#FFFBEB'
                          : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                              {req.patientName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ({req.age || 40}Y • {req.gender || 'F'} • {req.village})
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            ABHA: <strong>{req.abhaId || '12-3456-7890-1234'}</strong>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            background: isRed ? '#EF4444' : isYellow ? '#F59E0B' : '#10B981',
                            color: '#ffffff'
                          }}
                        >
                          {req.triageCategory === 'RED' ? 'EMERGENCY RED' : req.triageCategory === 'YELLOW' ? 'URGENT YELLOW' : 'ROUTINE GREEN'}
                        </span>
                      </div>

                      {/* Symptoms & Vitals pill */}
                      <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {req.symptoms}
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                        {req.vitals?.bp && (
                          <span style={{ fontSize: '0.7rem', background: '#e2e8f0', padding: '1px 6px', borderRadius: '6px', color: '#334155' }}>
                            BP: {req.vitals.bp}
                          </span>
                        )}
                        {req.vitals?.spo2 && (
                          <span style={{ fontSize: '0.7rem', background: req.vitals.spo2 < 94 ? '#fee2e2' : '#e2e8f0', padding: '1px 6px', borderRadius: '6px', color: req.vitals.spo2 < 94 ? '#dc2626' : '#334155', fontWeight: req.vitals.spo2 < 94 ? 800 : 500 }}>
                            SpO2: {req.vitals.spo2}%
                          </span>
                        )}
                        {req.vitals?.temp && (
                          <span style={{ fontSize: '0.7rem', background: '#e2e8f0', padding: '1px 6px', borderRadius: '6px', color: '#334155' }}>
                            Temp: {req.vitals.temp}
                          </span>
                        )}
                      </div>

                      {/* Submitted By Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
                        <span>ASHA: <strong>{req.ashaName}</strong> ({req.ashaArea || req.village})</span>
                        <span>{req.status === 'Accepted' ? '✓ Accepted' : req.createdAt || 'Today'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Request Detail Panel */}
          {selectedReq ? (
            <div style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '68vh', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fbfcfd' }}>
              {/* Header Box */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedReq.patientName}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {selectedReq.age || 40} Yrs • {selectedReq.gender || 'Female'} • Village: {selectedReq.village}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      background: selectedReq.triageCategory === 'RED' ? '#EF4444' : selectedReq.triageCategory === 'YELLOW' ? '#F59E0B' : '#10B981',
                      color: '#ffffff'
                    }}
                  >
                    {selectedReq.triageCategory} TRIAGE
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>BLOOD PRESSURE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0284c7' }}>{selectedReq.vitals?.bp || '120/80'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>OXYGEN SPO2</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: (selectedReq.vitals?.spo2 || 98) < 94 ? '#dc2626' : '#16a34a' }}>
                      {selectedReq.vitals?.spo2 || 98}%
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>PULSE RATE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#16a34a' }}>{selectedReq.vitals?.pulse || 78} bpm</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TEMPERATURE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#d97706' }}>{selectedReq.vitals?.temp || '98.6°F'}</div>
                  </div>
                </div>
              </div>

              {/* Reported Symptoms & ASHA Field Notes */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  CHIEF COMPLAINTS & SYMPTOMS
                </div>
                <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 600, marginBottom: '0.75rem' }}>
                  {selectedReq.symptoms}
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  ASHA WORKER OBSERVATIONS & FIELD NOTES
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                  &ldquo;{selectedReq.ashaNotes || 'Patient visited during morning village round. Requested prompt medical guidance.'}&rdquo;
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
                  Reported by: <strong>{selectedReq.ashaName}</strong> (ASHA ID: {selectedReq.ashaId}) • Phone: {selectedReq.ashaPhone || '+91 98230 44102'}
                </div>
              </div>

              {/* Statutory Disclaimer Box */}
              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '0.6rem 0.85rem', fontSize: '0.74rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Statutory Notice:</strong> Preliminary digital triage support only. Final medical assessment & clinical directives must be performed by a qualified healthcare professional.
                </span>
              </div>

              {/* Doctor Guidance / Directives Input */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {tr("Doctor's Clinical Directives & Guidance to ASHA:", 'आशा के लिए डॉक्टर के नैदानिक निर्देश:', 'आशासाठी डॉक्टरांचे वैद्यकीय निर्देश:')}
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder={tr('E.g. Accept for Room 4 OPD immediately. Advise oral hydration and rest. Keep patient warm.', 'उदा. मरीज को तुरंत कमरा 4 में लाएं। ओआरएस और आराम की सलाह दें।', 'उदा. रुग्णाला ताबडतोब खोली ४ मध्ये आणा. ओआरएस द्या.')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleSendGuidance(selectedReq)}
                    className="btn btn-sm btn-outline"
                    style={{
                      borderColor: '#059669',
                      color: '#059669',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem'
                    }}
                  >
                    <Send size={14} />
                    <span>Send Message to ASHA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestMoreVitals(selectedReq)}
                    className="btn btn-sm btn-ghost"
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b'
                    }}
                  >
                    Request Repeat Vitals
                  </button>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                {/* Button 1: Accept & Queue */}
                <button
                  type="button"
                  onClick={() => handleAcceptAndQueue(selectedReq)}
                  disabled={isSubmitting || selectedReq.status === 'Accepted'}
                  style={{
                    flex: 1,
                    background: selectedReq.status === 'Accepted'
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: selectedReq.status === 'Accepted' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {selectedReq.status === 'Accepted' ? '✓ Accepted & Queued' : '✓ Accept & Add to OPD Queue'}
                  </span>
                </button>

                {/* Button 2: Pre-Fill Rx */}
                {onSelectPatientForRx && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPatientForRx(selectedReq);
                      onClose();
                    }}
                    style={{
                      background: '#0284C7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.65rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <FileText size={15} />
                    <span>Prescribe Rx</span>
                  </button>
                )}

                {/* Button 3: Specialist Referral */}
                {onSelectPatientForReferral && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPatientForReferral(selectedReq);
                      onClose();
                    }}
                    style={{
                      background: '#7C3AED',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.65rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Share2 size={15} />
                    <span>Referral</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
