import React, { useState } from 'react';
import {
  X,
  Syringe,
  MapPin,
  Clock,
  Phone,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { staffDispatchService } from '../services/staffDispatchService';
import { useLanguage } from '../context/LanguageContext';

export const UrgentStaffModal = ({
  isOpen,
  onClose,
  user,
  location,
  language: propLanguage,
  onSuccess
}) => {
  const { tr, language: ctxLanguage } = useLanguage();
  const language = propLanguage || ctxLanguage;

  if (!isOpen) return null;

  const PURPOSES = [
    {
      id: 'injection',
      label: tr('Injection Administration', 'इंजेक्शन लगवाना', 'इंजेक्शन देणे / टोचणे'),
      hindi: 'इंसुलिन, एंटीबायोटिक या दर्द निवारक इंजेक्शन',
      desc: tr('Insulin, Antibiotics, Painkiller or Vitamin injections', 'इंसुलिन, एंटीबायोटिक या दर्द निवारक इंजेक्शन', 'इन्सुलिन, ॲन्टीबायोटिक किंवा वेदनाशामक इंजेक्शन'),
      icon: '💉',
      defaultMeds: 'Insulin Glargine (10 Units) / Prescribed Dose'
    },
    {
      id: 'dressing',
      label: tr('Wound Dressing & Bandaging', 'घाव की मरहम-पट्टी', 'जखमेची मलमपट्टी व ड्रेसिंग'),
      hindi: 'सर्जरी के बाद पट्टी या चोट की सफाई',
      desc: tr('Post-op dressing, burn care, diabetic ulcer cleaning', 'सर्जरी के बाद पट्टी या चोट की सफाई', 'शस्त्रक्रियेनंतरची मलमपट्टी किंवा जखम स्वच्छ करणे'),
      icon: '🩹',
      defaultMeds: 'Sterile gauze, Betadine & antibiotic ointment'
    },
    {
      id: 'iv_drip',
      label: tr('IV Saline & Drip Setup', 'ड्रिप व स्लाइन लगाना', 'सलाइन / आयव्ही ड्रिप लावणे'),
      hindi: 'कमजोरी, डिहाइड्रेशन या नसों में दवा',
      desc: tr('Normal Saline (NS), DNS, or IV antibiotic infusion', 'कमजोरी, डिहाइड्रेशन या नसों में दवा', 'अशक्तपणा, डिहायड्रेशन किंवा सलाईन देणे'),
      icon: '💧',
      defaultMeds: 'Normal Saline 500ml IV Set'
    },
    {
      id: 'stitches',
      label: tr('Suture / Stitches Removal', 'टांके कटवाना', 'टाके काढणे'),
      hindi: 'घाव भरने के बाद सुरक्षित टांके काटना',
      desc: tr('Safe surgical suture removal with sterile cutter', 'घाव भरने के बाद सुरक्षित टांके काटना', 'जखम भरल्यानंतर सुरक्षितपणे टाके काढणे'),
      icon: '🧵',
      defaultMeds: 'Sterile suture cutter & antiseptic swab'
    },
    {
      id: 'nebulizer',
      label: tr('Nebulization & Resp Care', 'नेबुलाइजर व सांस राहत', 'नेब्युलायझर व वाफ देणे'),
      hindi: 'अस्थमा या सांस फूलने पर दवा की भाप',
      desc: tr('Asthma relief, Duolin/Budecort nebulization', 'अस्थमा या सांस फूलने पर दवा की भाप', 'दम्याचा त्रास किंवा श्वास घेण्यास अडचण'),
      icon: '🫁',
      defaultMeds: 'Duolin / Budecort Respules with Nebulizer Mask'
    },
    {
      id: 'other',
      label: tr('Other Basic Nursing Care', 'अन्य सामान्य नर्सिंग', 'इतर सामान्य नर्सिंग सेवा'),
      hindi: 'कैथेटर देखभाल, बीपी व अन्य घरेलू सहायता',
      desc: tr('Catheter care, vitals check, elderly assistance', 'कैथेटर देखभाल, बीपी व अन्य घरेलू सहायता', 'कॅथेटर काळजी, बीपी तपासणी व इतर मदत'),
      icon: '🩺',
      defaultMeds: 'General nursing supplies'
    }
  ];

  const [selectedPurposeId, setSelectedPurposeId] = useState('injection');
  const [medication, setMedication] = useState('Insulin Glargine (10 Units)');
  const [patientName, setPatientName] = useState(user?.name || 'Rahul Sharma');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [address, setAddress] = useState(
    location?.village ? `${location.village}, Ward 2, Near Panchayat Bhavan` : 'Khed Shivapur, Ward 2, House #14'
  );
  const [urgency, setUrgency] = useState('immediate'); // immediate | standard
  const [notes, setNotes] = useState('Please bring sterile disposable needle syringe.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPurpose = PURPOSES.find(p => p.id === selectedPurposeId) || PURPOSES[0];

  const handlePurposeSelect = (p) => {
    setSelectedPurposeId(p.id);
    setMedication(p.defaultMeds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newReq = await staffDispatchService.createStaffRequest({
        patientName,
        patientPhone: phone,
        patientAbhaId: user?.abhaId || '91-4829-1029-4819',
        purpose: selectedPurpose.label,
        subPurpose: selectedPurpose.desc,
        medicationDetails: medication,
        address,
        userCoords: location?.coords || { lat: 18.356, lng: 73.847 },
        urgency: urgency === 'immediate' ? 'Immediate (Within 15-30 Mins)' : 'Standard Today (Within 2 Hours)',
        notes,
        userLocation: location
      });

      if (onSuccess) {
        onSuccess(newReq);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create staff request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620, borderRadius: '18px', padding: 0, overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #BE123C 0%, #E11D48 60%, #F43F5E 100%)',
            color: 'white',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '4px' }}>
              <span style={{ background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                ● {tr('Home Nursing & Staff Dispatch', 'घरेलू नर्सिंग सेवा', 'घरी नर्सिंग व आरोग्य कर्मचारी सेवा')}
              </span>
              <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                {tr('PHC Clinical Network', 'कम्युनिटी स्वास्थ्य केंद्र', 'प्राथमिक आरोग्य केंद्र (PHC) नेटवर्क')}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              {tr('Request Urgent Medical Staff at Home', 'घर पर मेडिकल स्टाफ / इंजेक्शन बुलाएं', 'घरी वैद्यकीय कर्मचारी / परिचारिका बोलवा')}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', opacity: 0.95 }}>
              {tr(
                'A certified local PHC nurse or ANM will visit your home to administer injections & care.',
                'नजदीकी पीएचसी नर्स या एएनएम आपके स्थान पर आकर इंजेक्शन या ड्रेसिंग लगाएंगी।',
                'जवळच्या प्राथमिक आरोग्य केंद्रातील परिचारिका किंवा ANM आपल्या घरी येऊन उपचार करतील.'
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Step 1: Select Purpose */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              {tr('1. What purpose is medical staff required for?', '1. स्टाफ की आवश्यकता किस कार्य के लिए है?', '१. वैद्यकीय कर्मचाऱ्यांची आवश्यकता कोणत्या उपचारासाठी आहे?')}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.55rem' }}>
              {PURPOSES.map((p) => {
                const isSelected = p.id === selectedPurposeId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePurposeSelect(p)}
                    style={{
                      border: isSelected ? '2px solid #E11D48' : '1.5px solid #e2e8f0',
                      background: isSelected ? '#FFF1F2' : '#ffffff',
                      borderRadius: '12px',
                      padding: '0.65rem 0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#BE123C' : '#0f172a' }}>
                        {p.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Medication & Purpose Details */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              {tr('Medication / Injection Name (As Prescribed):', 'दवा या इंजेक्शन का नाम (डॉक्टर पर्ची अनुसार):', 'औषध किंवा इंजेक्शनचे नाव (डॉक्टरांच्या सल्ल्यानुसार):')}
            </label>
            <input
              type="text"
              required
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="e.g. Insulin Glargine 10 units, Diclofenac, Tetanus Toxoid..."
              className="form-input"
              style={{ width: '100%', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px' }}
            />
          </div>

          {/* Step 3: Location for Staff Visit */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              {tr('Home Address / Location for Staff Visit:', 'घर का पता / स्थान (जहां स्टाफ को पहुंचना है):', 'घराचा पत्ता / भेटीचे ठिकाण:')}
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#E11D48' }} />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House number, landmark, village/colony name..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.82rem', borderRadius: '8px' }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
              📍 {tr('Live GPS location auto-tagged for nearest nurse.', `लाइव जीपीएस (${location?.village || 'गाँव'}) निकटतम नर्स के लिए संलग्न।`, `थेट जीपीएस (${location?.village || 'गाव'}) जवळच्या परिचारिकेसाठी जोडले.`)}
            </div>
          </div>

          {/* Step 4: Urgency Selection */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
              {tr('Urgency Level:', 'प्राथमिकता:', 'तातडीची पातळी:')}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#be123c', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="urgency"
                  value="immediate"
                  checked={urgency === 'immediate'}
                  onChange={() => setUrgency('immediate')}
                />
                <span>🚨 {tr('Immediate (15-30 mins)', 'तत्काल (15-30 मिनट)', 'तातडीने (१५-३० मिनिटे)')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="urgency"
                  value="standard"
                  checked={urgency === 'standard'}
                  onChange={() => setUrgency('standard')}
                />
                <span>{tr('Standard (Within 2 Hours)', 'सामान्य (2 घंटे में)', 'सामान्य (२ तासांच्या आत)')}</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ flex: 1, padding: '0.65rem', fontWeight: 700, borderRadius: '10px' }}
            >
              {tr('Cancel', 'रद्द करें', 'रद्द करा')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                flex: 2,
                padding: '0.65rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)',
                borderColor: '#BE123C',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
              }}
            >
              <Send size={16} />
              <span>
                {isSubmitting
                  ? tr('Sending Request...', 'अनुरोध भेजा जा रहा है...', 'विनंती पाठवत आहे...')
                  : tr('Request Medical Staff Now', 'मेडिकल स्टाफ बुलाएं (अनुरोध भेजें)', 'वैद्यकीय कर्मचारी बोलवा (विनंती पाठवा)')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
