import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowDown,
  Building,
  Building2,
  Stethoscope,
  FileText,
  Activity,
  AlertCircle,
  Share2,
  ShieldCheck,
  Calendar,
  User,
  MessageSquare,
  QrCode,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ReferralTrackingTimeline = ({ chain, isDoctorView = false, onOpenReferModal = null }) => {
  const { language, tr } = useLanguage();
  const [expandedHopId, setExpandedHopId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeSlipHop, setActiveSlipHop] = useState(null);

  if (!chain || !chain.hops || chain.hops.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>{tr('No active referral tracking chain found.', 'कोई सक्रिय रेफरल ट्रैकिंग नहीं मिली।', 'कोणतीही सक्रिय रेफरल ट्रॅकिंग साखळी आढळली नाही.')}</p>
      </div>
    );
  }

  const toggleExpand = (hopId) => {
    setExpandedHopId(expandedHopId === hopId ? null : hopId);
  };

  const handlePrintSlip = (hop) => {
    setActiveSlipHop(hop);
    setShowQrModal(true);
  };

  const completedHopsCount = chain.hops.filter(h => h.status === 'completed').length;
  const progressPercent = Math.min(100, Math.round(((completedHopsCount) / Math.max(1, chain.hops.length)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ============================================================ */}
      {/* 1. FLIPKART-STYLE ORDER / REFERRAL TRACKING HEADER BANNER */}
      {/* ============================================================ */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(2, 132, 199, 0.25)',
                  color: '#38bdf8',
                  border: '1px solid #0284c7',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}
              >
                ● {tr('LIVE REFERRAL TRACKER', 'लाइव रेफरल ट्रैकर', 'थेट संदर्भ ट्रॅकर')}
              </span>

              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {tr('Tracking ID:', 'ट्रैकिंग आईडी:', 'ट्रॅकिंग आयडी:')} <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{chain.id}</strong>
              </span>

              <span
                style={{
                  background: chain.priority.includes('High') || chain.priority.includes('Urgent') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: chain.priority.includes('High') || chain.priority.includes('Urgent') ? '#fca5a5' : '#93c5fd',
                  border: chain.priority.includes('High') || chain.priority.includes('Urgent') ? '1px solid #ef4444' : '1px solid #3b82f6',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {chain.priority}
              </span>
            </div>

            <h2 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {chain.primaryCondition}
            </h2>

            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
              {tr('Patient:', 'मरीज:', 'रुग्ण:')} <strong>{chain.patientName}</strong> {chain.patientNameHindi && `(${chain.patientNameHindi})`} &bull; ABHA: <strong>{chain.abhaId}</strong> &bull; {chain.age}Y, {chain.gender} &bull; {chain.village}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Activity size={15} />
              <span>{chain.status}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              {tr('Last Synced:', 'अंतिम सिंक:', 'शेवटचे सिंक:')} {chain.lastUpdated}
            </div>
          </div>
        </div>

        {/* E-Commerce Package Journey Horizontal Stepper (Mini Overview) */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>{tr('Referral Care Progression', 'रेफरल यात्रा प्रगति', 'संदर्भ प्रवास प्रगती')}</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{completedHopsCount} {tr('of', 'में से', 'पैकी')} {chain.hops.length} {tr('Steps Completed', 'चरण पूर्ण', 'टप्पे पूर्ण')} ({progressPercent}%)</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #0284c7 100%)', transition: 'width 0.4s ease' }}></div>
          </div>

          {/* Stepper Nodes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {chain.hops.map((hop, idx) => {
              const isDone = hop.status === 'completed';
              const isCurrent = hop.status === 'in_progress';

              return (
                <div key={hop.hopId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', padding: '0 0.25rem' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isDone ? '#10b981' : isCurrent ? '#0284c7' : '#334155',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      marginBottom: '0.35rem',
                      border: isCurrent ? '2px solid #38bdf8' : 'none',
                      animation: isCurrent ? 'pulse 2s infinite' : 'none',
                      boxShadow: isCurrent ? '0 0 10px rgba(2, 132, 199, 0.7)' : 'none'
                    }}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : hop.stepNumber}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isCurrent ? '#38bdf8' : isDone ? '#e2e8f0' : '#94a3b8' }}>
                    {hop.doctorName}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hop.facility}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DETAILED CHRONOLOGICAL HOP-BY-HOP TIMELINE CARDS */}
      {/* ============================================================ */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Continuous Connecting Track Line */}
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: '20px',
            bottom: '20px',
            width: '3px',
            background: 'linear-gradient(180deg, #10b981 0%, #0284c7 60%, #cbd5e1 100%)',
            zIndex: 1
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {chain.hops.map((hop, idx) => {
            const isDone = hop.status === 'completed';
            const isCurrent = hop.status === 'in_progress';
            const isExpanded = expandedHopId === hop.hopId || isCurrent || idx === chain.hops.length - 1;

            return (
              <div key={hop.hopId} style={{ position: 'relative' }}>
                {/* Visual Step Marker on Track Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-2rem',
                    top: '1.25rem',
                    transform: 'translateX(-50%)',
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isDone ? '#10b981' : isCurrent ? '#0284c7' : '#ffffff',
                    border: isCurrent ? '3px solid #bae6fd' : isDone ? '2px solid #a7f3d0' : '2px solid #cbd5e1',
                    color: isDone || isCurrent ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} />
                  ) : isCurrent ? (
                    <Stethoscope size={14} />
                  ) : (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{hop.stepNumber}</span>
                  )}
                </div>

                {/* Main Hop Card */}
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    background: '#ffffff',
                    border: isCurrent ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: isCurrent ? '0 8px 24px -4px rgba(2, 132, 199, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Card Header: Stage Number, Doctor Title, Date & Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <span
                          style={{
                            background: isDone ? '#ecfdf5' : '#e0f2fe',
                            color: isDone ? '#047857' : '#0369a1',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em'
                          }}
                        >
                          STAGE {hop.stepNumber} OF {chain.hops.length}
                        </span>

                        <span
                          style={{
                            background: isDone ? '#d1fae5' : isCurrent ? '#bae6fd' : '#f1f5f9',
                            color: isDone ? '#065f46' : isCurrent ? '#075985' : '#475569',
                            padding: '0.12rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}
                        >
                          ● {isDone ? tr('Consultation Completed', 'परामर्श पूर्ण हुआ', 'सल्ला पूर्ण झाला') : isCurrent ? tr('Active / In Review', 'सक्रिय / समीक्षाधीन', 'सक्रिय / पुनरावलोकन सुरू') : tr('Scheduled', 'निर्धारित', 'नियोजित')}
                        </span>

                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {tr('Slip:', 'पर्ची:', 'पावती:')} <strong style={{ color: '#0f172a' }}>{hop.referralSlipId}</strong>
                        </span>
                      </div>

                      <h3 style={{ margin: '0.2rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {language === 'hi' && hop.titleHindi ? hop.titleHindi : language === 'mr' && hop.titleMarathi ? hop.titleMarathi : hop.title}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        <Calendar size={14} color="#0284c7" />
                        <span>{hop.date}</span>
                        <span style={{ color: '#94a3b8' }}>&bull;</span>
                        <Clock size={14} color="#0284c7" />
                        <span>{hop.time}</span>
                      </div>
                      <button
                        onClick={() => handlePrintSlip(hop)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title={tr('View & Print Official ABHA Referral Slip', 'आधिकारिक ABHA रेफरल पर्ची देखें व प्रिंट करें', 'अधिकृत आभा संदर्भ पावती पहा व प्रिंट करा')}
                      >
                        <QrCode size={13} />
                        <span>{tr('Official Referral Slip', 'आधिकारिक रेफरल पर्ची', 'अधिकृत संदर्भ पावती')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Doctor & Facility Profile Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800
                        }}
                      >
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                          {hop.doctorName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {hop.doctorDegree} &bull; <strong>{hop.doctorRole}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                        <Building size={15} color="#0284c7" />
                        <span>{hop.facility}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {hop.department} &bull; <span style={{ color: '#0369a1', fontWeight: 600 }}>{hop.facilityType}</span>
                      </div>
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* CRITICAL USER REQUIREMENT: DOCTOR'S CLINICAL REMARKS BOX */}
                  {/* ============================================================ */}
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                      <MessageSquare size={14} color="#d97706" />
                      <span>{tr("Doctor's Official Clinical Remarks & Referral Directives", 'चिकित्सक की नैदानिक ​​टिप्पणियां एवं निर्देश', 'वैद्यकीय शेरे व संदर्भ सूचना')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f', lineHeight: 1.5, fontWeight: 500, fontStyle: 'italic' }}>
                      "{hop.doctorRemarks}"
                    </p>
                  </div>

                  {/* Clinical Findings & Vitals Snapshot */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        {tr('Clinical Diagnosis / Findings', 'रोग निदान / जांच निष्कर्ष', 'रोग निदान / तपासणी निष्कर्ष')}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, marginTop: '0.2rem' }}>
                        {hop.clinicalFindings}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        {tr('Vitals Snapshot at Referral', 'रेफरल समय मरीज के वाइटल्स', 'रेफरल वेळचे व्हायटल्स')}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                        {hop.vitals.bp && <span>BP: <strong style={{ color: '#0284c7' }}>{hop.vitals.bp}</strong></span>}
                        {hop.vitals.pulse && <span>Pulse: <strong>{hop.vitals.pulse}</strong></span>}
                        {hop.vitals.spo2 && <span>SpO2: <strong style={{ color: '#16a34a' }}>{hop.vitals.spo2}</strong></span>}
                        {hop.vitals.temp && <span>Temp: <strong>{hop.vitals.temp}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* Hop Action Result Transfer Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      paddingTop: '0.6rem',
                      borderTop: '1px dashed #e2e8f0',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                      <span style={{ fontWeight: 700 }}>{tr('Action:', 'कार्रवाई:', 'कृती:')}</span>
                      <span style={{ color: '#0369a1', fontWeight: 600 }}>{hop.actionTaken}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', fontWeight: 700 }}>
                      <ShieldCheck size={14} />
                      <span>{tr('ABHA Certified Digital Referral Transfer', 'ABHA प्रमाणित डिजिटल रेफरल ट्रांसफर', 'आभा प्रमाणित डिजिटल संदर्भ हस्तांतरण')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DOCTOR ACTION BUTTON: REFER TO ANOTHER DOCTOR */}
      {/* ============================================================ */}
      {isDoctorView && onOpenReferModal && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
            border: '1.5px solid #7dd3fc',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: '0.5rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1', fontWeight: 800, fontSize: '0.95rem' }}>
              <Share2 size={18} />
              <span>{tr('Refer Patient to Another Doctor / Tertiary Facility', 'रोगी को आगे किसी अन्य डॉक्टर/अस्पताल को रेफर करें', 'रुग्णाला पुढील डॉक्टर/रुग्णालयाकडे रेफर करा')}</span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#475569' }}>
              {tr(
                "Add a new stage to this patient's live referral tracking chain with your clinical findings and directions.",
                'इस मरीज की लाइव रेफरल ट्रैकिंग में अपने निष्कर्षों के साथ एक नया चरण जोड़ें।',
                'या रुग्णाच्या थेट संदर्भ ट्रॅकिंगमध्ये आपल्या वैद्यकीय निष्कर्षांसह नवीन टप्पा जोडा.'
              )}
            </p>
          </div>

          <button
            onClick={onOpenReferModal}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Share2 size={16} />
            <span>{tr('+ Refer to Next Doctor', '+ नया रेफरल जारी करें', '+ पुढील डॉक्टरांना रेफर करा')}</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. OFFICIAL DIGITAL REFERRAL SLIP MODAL */}
      {/* ============================================================ */}
      {showQrModal && activeSlipHop && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <ShieldCheck size={20} color="#16a34a" />
                <span>{tr('Ayushman Bharat Digital Health Referral Pass', 'आयुष्मान भारत डिजिटल स्वास्थ्य रेफरल पास', 'आयुष्मान भारत डिजिटल आरोग्य संदर्भ पास')}</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowQrModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '1.25rem' }}>
                <div style={{ width: 110, height: 110, margin: '0 auto 0.75rem', background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <QrCode size={80} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', fontFamily: 'monospace' }}>
                  {activeSlipHop.referralSlipId}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {tr(
                    'Official ABDM Fast-Track Token • Scan at Receiving PHC / Civil Hospital Counter',
                    'आधिकारिक ABDM फास्ट-ट्रैक टोकन • अस्पताल काउंटर पर स्कैन करें',
                    'अधिकृत आभा फास्ट-ट्रॅक टोकन • रुग्णालय काऊंटरवर स्कॅन करा'
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>{tr('REFERRED BY', 'द्वारा रेफर', 'रेफर करणारे डॉक्टर')}</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>{activeSlipHop.doctorName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{activeSlipHop.facility}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>{tr('TRANSFER DATE', 'स्थानांतरण तिथि', 'हस्तांतरण तारीख')}</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>{activeSlipHop.date}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{activeSlipHop.time}</div>
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                  {tr("Doctor's Certified Referral Remarks:", 'डॉक्टर के प्रमाणित निर्देश:', 'डॉक्टरांचे प्रमाणित शेरे:')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#1e3a8a', fontStyle: 'italic', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  "{activeSlipHop.doctorRemarks}"
                </div>
              </div>

              <button
                onClick={() => {
                  window.print();
                }}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Printer size={16} />
                <span>{tr('Print Official Slip (A4 / Thermal)', 'आधिकारिक पर्ची प्रिंट करें (A4 / थर्मल)', 'अधिकृत पावती प्रिंट करा (A4 / थर्मल)')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
