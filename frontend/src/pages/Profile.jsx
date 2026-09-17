import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Globe,
  Lock,
  Edit2,
  Save,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import {
  registerBiometricCredential,
  getEnrolledCredentialForUser,
  removeBiometricCredential
} from '../services/biometricService';
import { BiometricPromptModal } from '../components/BiometricPromptModal';

export const Profile = () => {
  const { user, updateProfile, addEmergencyContact } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { addToast } = useNotifications();

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [formData, setFormData] = useState({
    village: user?.village || 'Khed (Rajgurunagar)',
    district: user?.district || 'Pune',
    pincode: user?.pincode || '410505',
    bloodGroup: user?.bloodGroup || 'B+'
  });

  // Biometric / Fingerprint State
  const [enrolledBio, setEnrolledBio] = useState(() =>
    getEnrolledCredentialForUser(user?.id || user?.role || 'patient')
  );
  const [showBioModal, setShowBioModal] = useState(false);

  useEffect(() => {
    const handleBioChange = () => {
      setEnrolledBio(getEnrolledCredentialForUser(user?.id || user?.role || 'patient'));
    };
    window.addEventListener('biometric_credential_changed', handleBioChange);
    return () => window.removeEventListener('biometric_credential_changed', handleBioChange);
  }, [user]);

  const handleEnrollSuccess = async () => {
    setShowBioModal(false);
    try {
      const cred = await registerBiometricCredential(user);
      setEnrolledBio(cred);
      addToast(
        language === 'hi'
          ? 'फिंगरप्रिंट सफलतापूर्वक पंजीकृत कर दिया गया है!'
          : language === 'mr'
          ? 'फिंगरप्रिंट यशस्वीरित्या नोंदणीकृत केले गेले आहे!'
          : 'Fingerprint successfully enrolled for this device!',
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Enrollment failed', 'error');
    }
  };

  const handleRemoveBio = () => {
    removeBiometricCredential(user?.id || user?.role || 'patient');
    setEnrolledBio(null);
    addToast(
      language === 'hi'
        ? 'बायोमेट्रिक कुंजी हटा दी गई है।'
        : language === 'mr'
        ? 'बायोमेट्रिक काढून टाकले.'
        : 'Biometric credential removed from this device.',
      'info'
    );
  };

  // New emergency contact modal
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditingPersonal(false);
    addToast('Profile updated successfully!', 'success');
  };

  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    await addEmergencyContact({
      name: newContactName.trim(),
      relation: newContactRelation,
      phone: newContactPhone.trim()
    });

    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
    addToast('New emergency contact saved!', 'success');
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: 880, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">
          <User size={28} color="var(--primary)" />
          {t('profile')} & Health Identity
        </h1>
      </div>

      {/* ABHA Digital Health Card Banner */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #0369A1 100%)',
          color: 'white',
          marginBottom: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                NATIONAL HEALTH STACK (ABDM)
              </span>
              <span className="badge badge-success" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                ✓ ABHA Verified
              </span>
            </div>

            <h2 style={{ margin: '4px 0', fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {user?.name || 'Rahul Sharma'}
            </h2>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              ABHA Number: <strong style={{ letterSpacing: '0.05em' }}>{user?.abhaId || '91-4829-1029-4819'}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>BLOOD GROUP</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{user?.bloodGroup || 'B+'}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Age: {user?.age || 34} • {user?.gender || 'Male'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Personal Information & Vitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Personal Info Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Personal Information</h3>
              <button
                onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                className="btn btn-ghost btn-sm"
              >
                {isEditingPersonal ? 'Cancel' : <><Edit2 size={14} /> Edit</>}
              </button>
            </div>

            {isEditingPersonal ? (
              <form onSubmit={handleSavePersonal}>
                <div className="form-group">
                  <label className="form-label">Village / Town</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <Save size={15} /> Save Changes
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Mobile Phone:</span> <strong>{user?.phone}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email ID:</span> <strong>{user?.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Village / Taluka:</span> <strong>{user?.village}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>District & State:</span> <strong>{user?.district}, {user?.state} ({user?.pincode})</strong></div>
              </div>
            )}
          </div>

          {/* Clinical Health Profile */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
              Basic Health Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ backgroundColor: 'var(--surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HEIGHT & WEIGHT</span>
                <div style={{ fontWeight: 700 }}>172 cm &bull; 68 kg</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BLOOD PRESSURE</span>
                <div style={{ fontWeight: 700 }}>120/80 mmHg (Normal)</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Known Allergies: </span>
                <strong style={{ color: 'var(--emergency)' }}>Penicillin (mild skin rash)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Chronic Conditions: </span>
                <strong>None reported</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Emergency Contacts & Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Emergency Contacts Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Emergency Contacts</h3>
              <button onClick={() => setShowAddContact(true)} className="btn btn-outline btn-sm">
                <Plus size={14} /> Add
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              These contacts automatically receive SMS alerts with your live GPS location during 108 emergency activation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {user?.emergencyContacts?.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-alt)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name} ({c.relation})</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.phone}</div>
                  </div>
                  <a href={`tel:${c.phone}`} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
                    <Phone size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Biometric & Fingerprint Security Card */}
          <div className="card" style={{ padding: '1.5rem', border: '1.5px solid #99F6E4', background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: '#CCFBF1',
                    color: '#0F766E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                    <path d="M2 12a10 10 0 0 1 18-6" />
                    <path d="M2 16h.01" />
                    <path d="M21.8 16c.2-2 .13-5.35 0-6" />
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {t('biometricSecurity')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#0F766E', fontWeight: 700 }}>
                    ABDM FAST-PASS LOCK
                  </span>
                </div>
              </div>

              {enrolledBio ? (
                <span className="badge badge-success" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800 }}>
                  ✓ {language === 'hi' ? 'सक्रिय' : language === 'mr' ? 'सक्रिय' : 'Enrolled'}
                </span>
              ) : (
                <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                  {language === 'hi' ? 'सेट नहीं है' : language === 'mr' ? 'सेट नाही' : 'Not Set'}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.825rem', color: '#475569', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
              {language === 'hi'
                ? 'अपने फिंगरप्रिंट या डिवाइस पासकी का उपयोग करके बिना पासवर्ड तुरंत 1-टच लॉगिन करें।'
                : language === 'mr'
                ? 'आपल्या फिंगरप्रिंट किंवा डिव्हाइस पासकी वापरून पासवर्ड शिवाय तात्काळ १-टच लॉगिन करा.'
                : 'Authenticate seamlessly with one-touch fingerprint or Windows Hello passkey tied to your ABHA health records.'}
            </p>

            {enrolledBio ? (
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCFBF1', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                      {enrolledBio.deviceName || 'Registered Biometric Sensor'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Enrolled on {new Date(enrolledBio.registeredAt).toLocaleDateString()} • ABHA Verified
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveBio}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Trash2 size={14} /> {t('removeBiometric')}
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowBioModal(true)}
              style={{
                width: '100%',
                padding: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)'
              }}
            >
              <Sparkles size={16} />
              <span>{enrolledBio ? (language === 'hi' ? 'फिंगरप्रिंट पुनः स्कैन करें' : language === 'mr' ? 'फिंगरप्रिंट पुन्हा स्कॅन करा' : 'Re-verify Fingerprint') : t('enrollBiometric')}</span>
            </button>
          </div>

          {/* Language & Regional Settings Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
              {t('settings')} & Language
            </h3>

            <div className="form-group">
              <label className="form-label">Preferred Application Language</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The selected language will format all navigation, OPD token alerts, AI responses, and prescription instructions.
            </div>
          </div>
        </div>
      </div>

      {/* Add Emergency Contact Modal */}
      {showAddContact && (
        <div className="modal-overlay" onClick={() => setShowAddContact(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Add Emergency Contact</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddContact(false)}>✕</button>
            </div>
            <form onSubmit={handleAddContactSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sunita Sharma"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <select
                    className="form-select"
                    value={newContactRelation}
                    onChange={(e) => setNewContactRelation(e.target.value)}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Neighbor">Neighbor / Village Elder</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 98220 12345"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddContact(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Fingerprint Enrollment Modal */}
      <BiometricPromptModal
        isOpen={showBioModal}
        onClose={() => setShowBioModal(false)}
        onSuccess={handleEnrollSuccess}
        role={user?.role || 'patient'}
        userName={user?.name || 'Rahul Sharma'}
        purpose="register"
      />
    </div>
  );
};
