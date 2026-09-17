import React, { useState, useEffect } from 'react';
import {
  FileText,
  Pill,
  Calendar,
  ChevronRight,
  ChevronDown,
  X,
  Stethoscope,
  ShieldCheck,
  Clock,
  ClipboardList,
  Printer,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { prescriptionService } from '../../services/prescriptionService';
import { voiceService } from '../../services/voiceService';
import { AiMedicationExplainerModal } from './AiMedicationExplainerModal';
import { INITIAL_PRESCRIPTIONS } from '../../data/mockData';

// Extra seed records so the table has variety
const SEED_HISTORY = [
  {
    id: 'RX-2026-0031',
    appointmentId: 'APT-2026-6710',
    doctorName: 'Dr. Anjali Mehta',
    doctorSpecialty: 'General Physician',
    doctorRegNo: 'MMC-2012-08-3921',
    facility: 'Khed Primary Health Centre',
    date: '20 Aug 2026',
    patientName: 'Rahul Sharma',
    patientAge: 34,
    diagnosis: 'Acute Gastroenteritis with Mild Dehydration',
    medicines: [
      { name: 'ORS Sachets (WHO Formula)', type: 'Powder', dosage: '1 sachet in 1L water', frequency: 'Sip frequently', duration: '3 days', instructions: 'Drink 2-3 litres daily', inStockNearby: true },
      { name: 'Ciprofloxacin 500mg', type: 'Tablet', dosage: '1 tablet', frequency: '1-0-1', duration: '3 days', instructions: 'After meals strictly', inStockNearby: true },
      { name: 'Zinc Sulphate 20mg', type: 'Syrup', dosage: '10 ml', frequency: '0-1-0', duration: '14 days', instructions: 'After lunch', inStockNearby: true }
    ],
    generalAdvice: 'Light diet: khichdi, banana, curd. Avoid spicy/oily food for 5 days. IV fluids if vomiting continues.',
    followUpDate: '25 August 2026',
    isDigital: true
  },
  {
    id: 'RX-2026-0019',
    appointmentId: 'APT-2026-3342',
    doctorName: 'Dr. V. K. Kulkarni',
    doctorSpecialty: 'General Medicine',
    doctorRegNo: 'MCI-2008-11-7123',
    facility: 'Alandi Gramin Health Post',
    date: '14 May 2026',
    patientName: 'Rahul Sharma',
    patientAge: 34,
    diagnosis: 'Seasonal Allergic Rhinitis & Mild Conjunctivitis',
    medicines: [
      { name: 'Cetirizine 10mg', type: 'Tablet', dosage: '1 tablet', frequency: '0-0-1 (Night)', duration: '10 days', instructions: 'Take at bedtime; may cause drowsiness', inStockNearby: true },
      { name: 'Fluticasone Nasal Spray', type: 'Spray', dosage: '2 puffs each nostril', frequency: '1-0-0', duration: '14 days', instructions: 'Shake well before use', inStockNearby: false },
      { name: 'Carboxymethylcellulose Eye Drops', type: 'Eye Drop', dosage: '1-2 drops', frequency: 'QID', duration: '7 days', instructions: 'Tilt head back; avoid touching eye', inStockNearby: true }
    ],
    generalAdvice: 'Avoid dust, pollen and strong perfumes. Use sunglasses outdoors. Wash hands frequently.',
    followUpDate: '28 May 2026',
    isDigital: false
  },
  {
    id: 'RX-2026-0008',
    appointmentId: 'APT-2026-1104',
    doctorName: 'Dr. Anjali Mehta',
    doctorSpecialty: 'General Physician',
    doctorRegNo: 'MMC-2012-08-3921',
    facility: 'Khed Primary Health Centre',
    date: '10 Jan 2026',
    patientName: 'Rahul Sharma',
    patientAge: 34,
    diagnosis: 'Osteoarthritis Flare — Bilateral Knee Pain',
    medicines: [
      { name: 'Paracetamol 650mg', type: 'Tablet', dosage: '1 tablet', frequency: '1-1-1 (TDS)', duration: '5 days', instructions: 'After meals', inStockNearby: true },
      { name: 'Aceclofenac 100mg', type: 'Tablet', dosage: '1 tablet', frequency: 'SOS', duration: '5 days', instructions: 'Only on severe pain; with food', inStockNearby: true }
    ],
    generalAdvice: 'Knee physiotherapy recommended. Avoid squatting, climbing stairs. Apply warm compress twice daily.',
    followUpDate: '20 January 2026',
    isDigital: false
  }
];

export const PrescriptionRecordsCard = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [selectedRx, setSelectedRx] = useState(null);    // full-detail modal
  const [showAllHistory, setShowAllHistory] = useState(false); // full history modal
  const [speakingRxId, setSpeakingRxId] = useState(null);
  const [explainingMed, setExplainingMed] = useState(null);

  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
    };
  }, []);

  const handleToggleSpeakRx = (rx, e) => {
    if (e) e.stopPropagation();
    if (speakingRxId === rx.id) {
      voiceService.stopSpeaking();
      setSpeakingRxId(null);
      return;
    }
    voiceService.stopSpeaking();
    setSpeakingRxId(rx.id);

    const medList = (rx.medicines || []).map((m, idx) =>
      language === 'mr'
        ? `औषध ${idx + 1}: ${m.name}, प्रमाण ${m.dosage}, ${m.frequency}, ${m.duration} दिवस. ${m.instructions || ''}`
        : language === 'hi'
        ? `दवा ${idx + 1}: ${m.name}, खुराक ${m.dosage}, ${m.frequency}, ${m.duration} तक. ${m.instructions || ''}`
        : `Medicine ${idx + 1}: ${m.name}, dosage ${m.dosage}, take ${m.frequency} for ${m.duration}. ${m.instructions || ''}`
    ).join('. ');

    const speechText = language === 'mr'
      ? `डॉक्टर ${rx.doctorName}, रुग्णालय ${rx.facility}, तारीख ${rx.date}. रुग्ण: ${rx.patientName}. आजार तपासणी: ${rx.diagnosis}. औषधांची यादी: ${medList}. डॉक्टरांचा सल्ला: ${rx.generalAdvice || 'औषधे वेळेवर घ्या'}. पुढील भेट: ${rx.followUpDate || 'गरज पडल्यास'}.`
      : language === 'hi'
      ? `डॉक्टर ${rx.doctorName}, अस्पताल ${rx.facility}, तारीख ${rx.date}। मरीज: ${rx.patientName}। बीमारी की जांच: ${rx.diagnosis}। पर्चे की दवाएं: ${medList}। डॉक्टर की सलाह: ${rx.generalAdvice || 'दवाएं समय पर लें'}। अगली जांच: ${rx.followUpDate || 'जरूरत पड़ने पर'}।`
      : `Prescription by ${rx.doctorName}, at ${rx.facility} on ${rx.date}. Patient: ${rx.patientName}. Diagnosis: ${rx.diagnosis}. Prescribed medicines: ${medList}. Doctor's advice: ${rx.generalAdvice || 'Take rest and adequate fluids'}. Follow-up: ${rx.followUpDate || 'as needed'}.`;

    voiceService.speakText({
      text: speechText,
      language,
      onStart: () => setSpeakingRxId(rx.id),
      onEnd: () => setSpeakingRxId(null),
      onError: () => setSpeakingRxId(null)
    });
  };

  useEffect(() => {
    const fetchPrescriptions = () => {
      prescriptionService.getPrescriptions().then(data => {
        if (data && data.length > 0) setPrescriptions(data);
      });
    };

    fetchPrescriptions();

    const handleNewRx = (e) => {
      fetchPrescriptions();
      if (e.detail) {
        addToast(`📋 New Prescription Synced: ${e.detail.doctorName || 'Doctor'} sent digital prescription.`, 'info');
      }
    };

    window.addEventListener('prescription_created', handleNewRx);
    window.addEventListener('storage', fetchPrescriptions);
    return () => {
      window.removeEventListener('prescription_created', handleNewRx);
      window.removeEventListener('storage', fetchPrescriptions);
    };
  }, []);

  // Merge live + seed history; deduplicate by id; most recent first
  const allRecords = [...prescriptions, ...SEED_HISTORY].reduce((acc, rx) => {
    if (!acc.find(r => r.id === rx.id)) acc.push(rx);
    return acc;
  }, []);

  const recentRecords = allRecords.slice(0, 3); // show 3 most recent rows

  const handlePrint = (e, rx) => {
    e.stopPropagation();
    window.print();
    addToast(`Downloaded prescription ${rx.id}.`, 'info');
  };

  // ─── Shared table row ────────────────────────────────────────────────────────
  const VisitRow = ({ rx, isLast, inModal }) => (
    <tr
      style={{ borderBottom: isLast ? 'none' : '1px solid #e2e8f0', transition: 'background 0.12s ease', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Date */}
      <td style={{ padding: inModal ? '0.8rem 1rem' : '0.72rem 0.85rem', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={12} color="#0284c7" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{rx.date}</span>
        </div>
        {rx.isDigital && (
          <span style={{ fontSize: '0.63rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '999px', fontWeight: 700, marginTop: '2px', display: 'inline-block' }}>
            Digital Rx
          </span>
        )}
      </td>

      {/* Doctor */}
      <td style={{ padding: inModal ? '0.8rem 1rem' : '0.72rem 0.85rem', verticalAlign: 'middle' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{rx.doctorName}</div>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{rx.doctorSpecialty} • {rx.facility}</div>
      </td>

      {/* Diagnosis / Remarks */}
      <td style={{ padding: inModal ? '0.8rem 1rem' : '0.72rem 0.85rem', verticalAlign: 'middle' }}>
        <div style={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 700, maxWidth: inModal ? 300 : 240, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {rx.diagnosis}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
          {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''} prescribed
          {rx.followUpDate ? ` • Follow-up: ${rx.followUpDate}` : ''}
        </div>
      </td>

      {/* Details button & Speaker button */}
      <td style={{ padding: inModal ? '0.8rem 1rem' : '0.72rem 0.85rem', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button
          onClick={(e) => handleToggleSpeakRx(rx, e)}
          style={{
            background: speakingRxId === rx.id ? '#fee2e2' : '#f0f9ff',
            color: speakingRxId === rx.id ? '#dc2626' : '#0284c7',
            border: speakingRxId === rx.id ? '1px solid #fca5a5' : '1px solid #bae6fd',
            borderRadius: '7px',
            padding: '0.32rem 0.6rem',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginRight: '0.4rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title={speakingRxId === rx.id ? tr('Stop audio', 'ऑडियो रोकें', 'ऑडिओ थांबवा') : tr('Listen to this prescription', 'पर्ची सुनें', 'चिठ्ठी ऐका')}
        >
          {speakingRxId === rx.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
          <span>{speakingRxId === rx.id ? tr('Stop', 'रोकें', 'थांबवा') : tr('Listen', 'पर्ची सुनें', 'चिठ्ठी ऐका')}</span>
        </button>

        <button
          onClick={() => { if (inModal) setShowAllHistory(false); setSelectedRx(rx); }}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '7px',
            padding: '0.32rem 0.8rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            boxShadow: '0 2px 5px rgba(2,132,199,0.22)',
            whiteSpace: 'nowrap'
          }}
        >
          <ClipboardList size={12} />
          {tr('Details', 'विवरण', 'तपशील')}
        </button>
      </td>
    </tr>
  );

  // ─── Table head shared ────────────────────────────────────────────────────────
  const TableHead = () => (
    <thead>
      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
        {[
          tr('📅 Visit Date', '📅 तारीख', '📅 भेट तारीख'),
          tr('🩺 Doctor & Facility', '🩺 डॉक्टर व अस्पताल', '🩺 डॉक्टर व रुग्णालय'),
          tr('📋 Diagnosis & Remarks', '📋 जांच व सलाह', '📋 आजार व सल्ला'),
          tr('Full Rx', 'पर्ची', 'चिठ्ठी')
        ].map((h, i) => (
          <th key={i} style={{ padding: '0.52rem 0.85rem', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textAlign: i === 3 ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <>
      {/* ======================================================= */}
      {/* MAIN CARD — recent visits table                          */}
      {/* ======================================================= */}
      <div
        className="card"
        style={{ marginBottom: '1.75rem', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem 1.35rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                {tr('Recent Doctor Visits', 'हाल की डॉक्टर विज़िट', 'अलीकडील डॉक्टर भेटी')}
              </h3>
              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '1px' }}>
                {tr('Prescriptions & doctor remarks — click Details for full Rx', 'डॉक्टर की पर्ची व टिप्पणियां', 'डॉक्टरांची चिठ्ठी व सूचना')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('prescriptions')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.77rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <FileText size={13} />
            {tr('Prescription Records', 'सभी पर्चियां', 'सर्व चिठ्ठ्या')}
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Visit Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHead />
            <tbody>
              {recentRecords.map((rx, idx) => (
                <VisitRow key={rx.id} rx={rx} isLast={idx === recentRecords.length - 1} inModal={false} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1.35rem', borderTop: '1px solid #e2e8f0', background: '#fafafa', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Showing {recentRecords.length} of {allRecords.length} visits
          </span>
          <button
            onClick={() => setShowAllHistory(true)}
            style={{ background: '#ffffff', border: '1.5px solid #0284c7', color: '#0284c7', borderRadius: '8px', padding: '0.35rem 1rem', fontSize: '0.77rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            <Clock size={13} />
            {language === 'hi' ? 'इतिहास' : language === 'mr' ? 'इतिहास' : 'History'}
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL: Full Prescription Details                         */}
      {/* ======================================================= */}
      {selectedRx && (
        <div className="modal-overlay" onClick={() => setSelectedRx(null)} style={{ zIndex: 9999 }}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>

            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Full Prescription</div>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800 }}>{selectedRx.id} &bull; {selectedRx.date}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={e => handlePrint(e, selectedRx)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: 'white', borderRadius: '7px', padding: '0.28rem 0.75rem', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => setSelectedRx(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Doctor + Patient */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Doctor</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{selectedRx.doctorName}</div>
                  <div style={{ fontSize: '0.74rem', color: '#0369a1' }}>{selectedRx.doctorSpecialty}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{selectedRx.facility}</div>
                  <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>Reg: {selectedRx.doctorRegNo}</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Patient</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{selectedRx.patientName}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Age: {selectedRx.patientAge} yrs</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Visit: <strong>{selectedRx.date}</strong></div>
                  {selectedRx.isDigital && (
                    <span style={{ fontSize: '0.67rem', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '999px', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                      <ShieldCheck size={10} /> Digital Rx
                    </span>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '0.8rem 1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.2rem' }}>📋 Diagnosis</div>
                <div style={{ fontWeight: 700, color: '#78350f', fontSize: '0.88rem' }}>{selectedRx.diagnosis}</div>
              </div>

              {/* Medicines */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  💊 Prescribed Medicines ({selectedRx.medicines.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {selectedRx.medicines.map((med, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.65rem 0.9rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
                          {med.name} <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.76rem' }}>({med.type})</span>
                        </div>
                        <div style={{ fontSize: '0.77rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          {med.dosage} &bull; {med.frequency} &bull; {med.duration}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{med.instructions}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        {med.inStockNearby && (
                          <span style={{ fontSize: '0.63rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>✓ In Stock</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setExplainingMed({ medicine: med, prescription: selectedRx })}
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.22rem 0.55rem',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(124, 58, 237, 0.2)'
                          }}
                          title="Explain dosage, timings, and duration with AI"
                        >
                          <Sparkles size={11} color="#FDE047" />
                          <span>{tr('AI Guide', 'दवा समझें (AI)', 'औषध माहिती (AI)')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Advice */}
              {selectedRx.generalAdvice && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '0.8rem 1rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    🩺 {tr("Doctor's Advice", 'डॉक्टर की सलाह', 'डॉक्टरांचा सल्ला')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#14532d', lineHeight: 1.5 }}>{selectedRx.generalAdvice}</div>
                </div>
              )}

              {/* Follow-up */}
              {selectedRx.followUpDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '8px' }}>
                  <Calendar size={15} color="#7c3aed" />
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4c1d95' }}>
                    {tr('Follow-up Visit:', 'अगली जांच तारीख:', 'पुढील तपासणी तारीख:')} <strong>{selectedRx.followUpDate}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '0 0 12px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleToggleSpeakRx(selectedRx)}
                  style={{
                    background: speakingRxId === selectedRx.id ? '#fee2e2' : '#f0f9ff',
                    border: speakingRxId === selectedRx.id ? '1.5px solid #ef4444' : '1.5px solid #0284c7',
                    color: speakingRxId === selectedRx.id ? '#dc2626' : '#0284c7',
                    borderRadius: '8px',
                    padding: '0.38rem 1rem',
                    fontSize: '0.77rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Listen to full prescription read aloud"
                >
                  {speakingRxId === selectedRx.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{speakingRxId === selectedRx.id ? tr('Stop Audio', 'रोकें (Stop)', 'थांबवा (Stop)') : tr('🔊 Listen to Rx', '🔊 पूरी पर्ची सुनें (Listen)', '🔊 संपूर्ण चिठ्ठी ऐका')}</span>
                </button>

                <button
                  onClick={() => { setSelectedRx(null); onNavigate('medicines'); }}
                  style={{ background: '#ffffff', border: '1.5px solid #0284c7', color: '#0284c7', borderRadius: '8px', padding: '0.38rem 1rem', fontSize: '0.77rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Pill size={13} /> {tr('Find in Jan Aushadhi', 'जन औषधि में खोजें', 'जन औषधी मध्ये शोधा')}
                </button>
              </div>

              <button
                onClick={() => setSelectedRx(null)}
                style={{ background: '#0284c7', border: 'none', color: 'white', borderRadius: '8px', padding: '0.38rem 1.25rem', fontSize: '0.77rem', fontWeight: 800, cursor: 'pointer' }}
              >
                {tr('Close', 'बंद करें', 'बंद करा')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: Full History Table                                */}
      {/* ======================================================= */}
      {showAllHistory && (
        <div className="modal-overlay" onClick={() => setShowAllHistory(false)} style={{ zIndex: 9998 }}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>

            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.68rem', opacity: 0.65, fontWeight: 700, textTransform: 'uppercase' }}>Complete Visit Log</div>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.08rem', fontWeight: 800 }}>
                  📅 {tr('Doctor Visit History', 'डॉक्टर विज़िट इतिहास', 'डॉक्टर भेट इतिहास')} — {allRecords.length} {tr('Records', 'रिकॉर्ड', 'नोंदी')}
                </h3>
              </div>
              <button onClick={() => setShowAllHistory(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    {['📅 Visit Date', '🩺 Doctor & Facility', '📋 Diagnosis & Remarks', 'Full Rx'].map((h, i) => (
                      <th key={i} style={{ padding: '0.58rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textAlign: i === 3 ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRecords.map((rx, idx) => (
                    <VisitRow key={rx.id} rx={rx} isLast={idx === allRecords.length - 1} inModal={true} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderRadius: '0 0 12px 12px', flexShrink: 0 }}>
              <button onClick={() => setShowAllHistory(false)} style={{ background: '#0284c7', border: 'none', color: 'white', borderRadius: '8px', padding: '0.38rem 1.25rem', fontSize: '0.77rem', fontWeight: 800, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Medication Explainer Modal */}
      <AiMedicationExplainerModal
        isOpen={Boolean(explainingMed)}
        onClose={() => setExplainingMed(null)}
        medicine={explainingMed?.medicine}
        prescription={explainingMed?.prescription}
        onNavigate={onNavigate}
      />
    </>
  );
};

