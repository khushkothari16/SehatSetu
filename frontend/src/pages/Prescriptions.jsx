import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Upload,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  X,
  Printer,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { prescriptionService } from '../services/prescriptionService';
import { voiceService } from '../services/voiceService';
import { AiMedicationExplainerModal } from '../components/records/AiMedicationExplainerModal';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export const Prescriptions = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [prescriptions, setPrescriptions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [activeTab, setActiveTab] = useState('digital'); // 'digital' or 'uploaded'
  const [loading, setLoading] = useState(true);
  const [speakingRxId, setSpeakingRxId] = useState(null);
  const [explainingMed, setExplainingMed] = useState(null); // { medicine, prescription }

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
    };
  }, []);

  const handleToggleSpeakRx = (rx) => {
    if (speakingRxId === rx.id) {
      voiceService.stopSpeaking();
      setSpeakingRxId(null);
      return;
    }
    voiceService.stopSpeaking();
    setSpeakingRxId(rx.id);

    const medList = (rx.medicines || []).map((m, idx) =>
      tr(
        `Medicine ${idx + 1}: ${m.name}, dosage ${m.dosage}, take ${m.frequency} for ${m.duration}. Instructions: ${m.instructions || 'as advised'}`,
        `दवा ${idx + 1}: ${m.name}, खुराक ${m.dosage}, समय ${m.frequency}, ${m.duration} तक. निर्देश: ${m.instructions || 'सलाह अनुसार'}`,
        `औषध ${idx + 1}: ${m.name}, प्रमाण ${m.dosage}, वेळ ${m.frequency}, ${m.duration} साठी. सूचना: ${m.instructions || 'सल्ल्यानुसार'}`
      )
    ).join('. ');

    const speechText = tr(
      `Digital Prescription by ${rx.doctorName}, at ${rx.facility} on ${rx.date}. Patient: ${rx.patientName}. Diagnosis: ${rx.diagnosis}. Prescribed medicines: ${medList}. Doctor's advice: ${rx.generalAdvice || 'Take rest and proper hydration'}. Follow-up date: ${rx.followUpDate || 'as needed'}.`,
      `डिजिटल डॉक्टर पर्ची। डॉक्टर ${rx.doctorName}, अस्पताल ${rx.facility}, दिनांक ${rx.date}। मरीज: ${rx.patientName}। बीमारी की जांच: ${rx.diagnosis}। पर्चे में लिखी दवाएं: ${medList}। डॉक्टर की सलाह: ${rx.generalAdvice || 'पर्याप्त पानी पिएं और आराम करें'}। अगली जांच: ${rx.followUpDate || 'जरूरत पड़ने पर'}।`,
      `डिजिटल डॉक्टर प्रिस्क्रिप्शन. डॉक्टर ${rx.doctorName}, रुग्णालय ${rx.facility}, तारीख ${rx.date}. रुग्ण: ${rx.patientName}. आजाराचे निदान: ${rx.diagnosis}. लिहून दिलेली औषधे: ${medList}. डॉक्टरांचा सल्ला: ${rx.generalAdvice || 'विश्रांती घ्या आणि पुरेसे पाणी प्या'}. पुढील तपासणी तारीख: ${rx.followUpDate || 'गरज भासल्यास'}.`
    );

    voiceService.speakText({
      text: speechText,
      language,
      onStart: () => setSpeakingRxId(rx.id),
      onEnd: () => setSpeakingRxId(null),
      onError: () => setSpeakingRxId(null)
    });
  };

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [doctorNameInput, setDoctorNameInput] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxList, upList] = await Promise.all([
        prescriptionService.getPrescriptions(),
        prescriptionService.getPhysicalUploads()
      ]);
      setPrescriptions(rxList);
      setUploads(upList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleNewRx = (e) => {
      loadData();
      if (e.detail) {
        addToast(`📋 New Prescription Synced: ${e.detail.doctorName || 'Doctor'} generated digital prescription #${e.detail.id}!`, 'success');
      }
    };

    window.addEventListener('prescription_created', handleNewRx);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('prescription_created', handleNewRx);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (showUploadModal) {
        e.preventDefault();
        setShowUploadModal(false);
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [showUploadModal]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: Image or PDF only, max 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      addToast('Invalid file format. Please upload JPG, PNG, or PDF only.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('File too large. Maximum allowed size is 5MB.', 'error');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Please choose a file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const newUp = await prescriptionService.uploadPhysicalPrescription({
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        doctorName: doctorNameInput || 'Private Clinic Doctor',
        notes: uploadNotes
      });
      setUploads(prev => [newUp, ...prev]);
      addToast('Prescription uploaded securely for digital record archiving!', 'success');
      setShowUploadModal(false);
      setSelectedFile(null);
      setDoctorNameInput('');
      setUploadNotes('');
      setActiveTab('uploaded');
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrintDownload = (rx) => {
    window.print();
    addToast(`Downloaded PDF for prescription ${rx.id}`, 'info');
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              <FileText size={28} color="var(--primary)" />
              {t('prescriptions')}
            </h1>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Upload size={16} />
            {t('upload')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('digital')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'digital' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'digital' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          {tr(`Digital Prescriptions (${prescriptions.length})`, `डिजिटल पर्चियां (${prescriptions.length})`, `डिजिटल प्रिस्क्रिप्शन (${prescriptions.length})`)}
        </button>

        <button
          onClick={() => setActiveTab('uploaded')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'uploaded' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'uploaded' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          {tr(`Uploaded Physical Slips (${uploads.length})`, `अपलोड की गई पर्चियां (${uploads.length})`, `अपलोड केलेल्या कागदी पावत्या (${uploads.length})`)}
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
      ) : activeTab === 'digital' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="card"
              style={{
                padding: '1.75rem',
                border: '1px solid var(--border)',
                background: '#FFFFFF',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {/* Prescription Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '2px dashed var(--border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success">
                      <ShieldCheck size={14} /> {tr('ABHA Digital Verified', 'ABHA डिजिटल सत्यापित', 'आभा डिजिटल सत्यापित')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {tr('Rx ID:', 'पर्ची आईडी:', 'प्रिस्क्रिप्शन आयडी:')} <strong>{rx.id}</strong>
                    </span>
                  </div>
                  <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {rx.doctorName}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {rx.doctorSpecialty} &bull; Reg No: {rx.doctorRegNo} &bull; {rx.facility}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Prominent Speaker Button to Listen to Prescription */}
                  <button
                    type="button"
                    onClick={() => handleToggleSpeakRx(rx)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: speakingRxId === rx.id ? '#fee2e2' : '#f0f9ff',
                      border: speakingRxId === rx.id ? '1.5px solid #ef4444' : '1.5px solid #0284c7',
                      color: speakingRxId === rx.id ? '#dc2626' : '#0284c7',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title="Listen to this prescription read aloud (पर्ची बोलकर सुनें)"
                  >
                    {speakingRxId === rx.id ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    <span>{speakingRxId === rx.id ? tr('Stop', 'रोकें (Stop)', 'थांबवा (Stop)') : tr('🔊 Listen to Rx', '🔊 पर्ची सुनें', '🔊 प्रिस्क्रिप्शन ऐका')}</span>
                  </button>

                  <button
                    onClick={() => handlePrintDownload(rx)}
                    className="btn btn-outline btn-sm"
                  >
                    <Download size={15} />
                    {tr('Download / Print PDF', 'डाउनलोड / प्रिंट PDF', 'डाउनलोड / प्रिंट PDF')}
                  </button>
                  <button
                    onClick={() => onNavigate('home')}
                    className="btn btn-outline btn-sm"
                    style={{
                      borderColor: '#f59e0b',
                      color: '#d97706',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Clock size={14} />
                    <span>{tr('Dose Reminders', 'दवा रिमाइंडर', 'औषध स्मरणपत्रे')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('medicines')}
                    className="btn btn-primary btn-sm"
                  >
                    <Pill size={15} />
                    {tr('Locate Medicines', 'दवाएं खोजें', 'औषधे शोधा')}
                  </button>
                </div>
              </div>

              {/* Patient & Diagnosis Metadata */}
              <div
                style={{
                  margin: '1.25rem 0',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-alt)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontSize: '0.875rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{tr('Patient Name:', 'मरीज का नाम:', 'रुग्णाचे नाव:')} </span>
                  <strong>{rx.patientName} ({rx.patientAge} {tr('yrs', 'वर्ष', 'वर्षे')})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{tr('Date:', 'दिनांक:', 'तारीख:')} </span>
                  <strong>{rx.date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{tr('Clinical Diagnosis:', 'रोग निदान:', 'रोग निदान:')} </span>
                  <strong style={{ color: 'var(--primary-hover)' }}>{rx.diagnosis}</strong>
                </div>
              </div>

              {/* Prescribed Medicines Table */}
              <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem', fontWeight: 700 }}>#</th>
                      <th style={{ padding: '0.75rem', fontWeight: 700 }}>{tr('Medicine Name', 'दवा का नाम', 'औषधाचे नाव')}</th>
                      <th style={{ padding: '0.75rem', fontWeight: 700 }}>{tr('Dosage', 'खुराक', 'डोस / प्रमाण')}</th>
                      <th style={{ padding: '0.75rem', fontWeight: 700 }}>{tr('Frequency', 'समय / बार', 'वेळ / वारंवारता')}</th>
                      <th style={{ padding: '0.75rem', fontWeight: 700 }}>{tr('Duration', 'अवधि', 'कालावधी')}</th>
                      <th style={{ padding: '0.75rem', fontWeight: 700 }}>{tr('Special Instructions', 'विशेष निर्देश', 'विशेष सूचना')}</th>
                      <th style={{ padding: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#7C3AED' }}>
                          <Sparkles size={13} /> {tr('AI Medicine Guide', 'दवा गाइड (AI)', 'औषध मार्गदर्शक (AI)')}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines.map((med, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{med.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.type}</span>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem('sehatsetu_active_med_search', med.name);
                              onNavigate('medicines');
                            }}
                            style={{
                              marginTop: '0.35rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#0284c7',
                              background: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                            title="Check Live Pharmacy Stock"
                          >
                            <Pill size={12} /> {tr('Find in Pharmacy Stock →', 'दवा दुकान में स्टॉक देखें →', 'फार्मसीमध्ये स्टॉक शोधा →')}
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{med.dosage}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                          <div>{med.frequency}</div>
                          <div style={{ marginTop: '0.3rem' }}>
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                              ⏰ {tr('Reminders Active', 'दवा रिमाइंडर सक्रिय', 'डोस स्मरणपत्रे चालू')}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{med.duration}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{med.instructions}</td>
                        {/* The AI Explainer Button circled by the user next to Special Instructions */}
                        <td style={{ padding: '0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => setExplainingMed({ medicine: med, prescription: rx })}
                            className="btn btn-sm"
                            style={{
                              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 2px 6px rgba(109, 40, 217, 0.25)',
                              cursor: 'pointer'
                            }}
                            title="Click for AI explanation of dosage, timing, and duration"
                          >
                            <Sparkles size={13} color="#FDE047" />
                            <span>{tr('Explain with AI', 'दवा समझें (AI)', 'समजून घ्या (AI)')}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* General Advice & Follow-Up */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#92400E'
                }}
              >
                <strong>{tr("Doctor's Advice:", 'डॉक्टर की सलाह:', 'डॉक्टरांचा सल्ला:')}</strong> {rx.generalAdvice}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {tr('Recommended Follow-Up Date:', 'अनुशंसित अगली जांच तारीख:', 'पुढील तपासणी तारीख:')} <strong>{rx.followUpDate}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {tr('Digitally signed via National Health Stack (ABHA)', 'राष्ट्रीय स्वास्थ्य स्टैक (ABHA) द्वारा डिजिटल हस्ताक्षरित', 'राष्ट्रीय आरोग्य स्टॅक (आभा) द्वारे डिजिटल स्वाक्षरीकृत')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Uploaded Prescriptions List */
        <div className="grid-2">
          {uploads.map((up) => (
            <div key={up.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{up.fileName}</h4>
                </div>
                <span className="badge badge-success">{up.status}</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {tr('Uploaded:', 'अपलोड किया गया:', 'अपलोड केले:')} {up.uploadDate} &bull; {tr('Size:', 'आकार:', 'आकार:')} {up.fileSize}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <strong>{tr('Doctor:', 'डॉक्टर:', 'डॉक्टर:')}</strong> {up.doctorName}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {up.notes}
              </div>

              <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                {tr('View Uploaded Document', 'अपलोड किया गया दस्तावेज़ देखें', 'अपलोड केलेले दस्तऐवज पहा')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD PHYSICAL PRESCRIPTION MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{tr('Upload Physical Doctor Prescription', 'कागजी डॉक्टर पर्ची अपलोड करें', 'कागदी डॉक्टर प्रिस्क्रिप्शन अपलोड करा')}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {tr('Take a photo of your paper prescription slip or upload a PDF. Stored privately and securely.', 'अपनी डॉक्टर पर्ची का फोटो लें या PDF अपलोड करें। सुरक्षित और गोपनीय रखा जाता है।', 'तुमच्या डॉक्टर प्रिस्क्रिप्शनचा फोटो घ्या किंवा PDF अपलोड करा. सुरक्षित आणि गोपनीय ठेवले जाते.')}
                </p>

                <div className="form-group">
                  <label className="form-label">{tr('Select Prescription Photo or PDF', 'पर्ची की फोटो या PDF चुनें', 'प्रिस्क्रिप्शनचा फोटो किंवा PDF निवडा')}</label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                  {selectedFile && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px' }}>
                      {tr('Selected:', 'चयनित:', 'निवडलेले:')} {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{tr('Doctor or Hospital Name (Optional)', 'डॉक्टर या अस्पताल का नाम (वैकल्पिक)', 'डॉक्टर किंवा रुग्णालयाचे नाव (पर्यायी)')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. V. K. Kulkarni, Khed Dispensary"
                    value={doctorNameInput}
                    onChange={(e) => setDoctorNameInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{tr('Notes or Diagnosis (Optional)', 'नोट्स या बीमारी (वैकल्पिक)', 'नोंदी किंवा निदान (पर्यायी)')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Seasonal allergic rhinitis prescription"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? tr('Uploading Securely...', 'सुरक्षित अपलोड हो रहा है...', 'सुरक्षित अपलोड होत आहे...') : tr('Save Prescription', 'पर्ची सहेजें', 'प्रिस्क्रिप्शन जतन करा')}
                </button>
              </div>
            </form>
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
    </div>
  );
};
