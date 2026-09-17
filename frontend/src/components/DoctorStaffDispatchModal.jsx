import React, { useState, useEffect } from 'react';
import {
  X,
  Syringe,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  CheckSquare,
  Sparkles,
  Users,
  Navigation
} from 'lucide-react';
import { staffDispatchService, AVAILABLE_STAFF_ROSTER } from '../services/staffDispatchService';
import { useLanguage } from '../context/LanguageContext';

export const DoctorStaffDispatchModal = ({
  isOpen,
  onClose,
  activeRequests: propActiveRequests,
  language: propLanguage,
  onRefresh
}) => {
  const { tr, language: ctxLanguage } = useLanguage();
  const language = propLanguage || ctxLanguage;

  if (!isOpen) return null;

  const [selectedStaffId, setSelectedStaffId] = useState(AVAILABLE_STAFF_ROSTER[0].id);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const [localRequests, setLocalRequests] = useState(() => staffDispatchService.getAllRequestsSync());

  useEffect(() => {
    const sync = () => setLocalRequests(staffDispatchService.getAllRequestsSync());
    window.addEventListener('staff_request_change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('staff_request_change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const effectiveRequests = propActiveRequests && propActiveRequests.length > 0 ? propActiveRequests : localRequests;
  const activeRequests = effectiveRequests;

  const pendingRequests = effectiveRequests.filter(r => r.status === 'Pending Staff' || r.status === 'Pending Staff Dispatch');
  const dispatchedRequests = effectiveRequests.filter(r => r.status === 'Dispatched & En Route');
  const completedRequests = effectiveRequests.filter(r => r.status === 'Completed');

  const handleDispatch = async (requestId, staff) => {
    setDispatchingId(requestId);
    try {
      await staffDispatchService.dispatchStaff(requestId, staff);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleComplete = async (requestId) => {
    setCompletingId(requestId);
    try {
      await staffDispatchService.completeStaffRequest(
        requestId,
        'Injection administered safely at patient home. Vitals checked and recorded normal.'
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const handleSimulate = async () => {
    await staffDispatchService.createStaffRequest({
      patientName: 'Rahul Sharma',
      patientPhone: '+91 98765 43210',
      patientAbhaId: '91-4829-1029-4819',
      purpose: 'Injection Administration (इंजेक्शन लगवाना)',
      subPurpose: 'Insulin Glargine / Antibiotic Injection',
      medicationDetails: 'Insulin Glargine 10 Units (Prescribed for Diabetes)',
      address: 'Khed Shivapur, Ward 2, Near Panchayat Office, House #14',
      userCoords: { lat: 18.356, lng: 73.847 },
      urgency: 'Immediate (Within 15-30 Mins)',
      notes: 'Patient requires nurse visit at home for subcutaneous insulin injection.'
    });
    if (onRefresh) onRefresh();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 740, borderRadius: '18px', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)',
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
                ● PHC CLINICAL STAFF DISPATCH
              </span>
              <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                Active Requests: {activeRequests.length}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              {tr('Urgent Medical Staff & Injection Dispatch Desk', 'मेडिकल स्टाफ सहायता व इंजेक्शन डेस्क', 'वैद्यकीय कर्मचारी व इंजेक्शन पाठवणी कक्ष')}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', opacity: 0.95 }}>
              {tr(
                'Review patient urgent requests for injections/dressings and dispatch available nurses to their address.',
                'मरीजों द्वारा घर पर इंजेक्शन या ड्रेसिंग के अनुरोध देखें और नजदीकी उपलब्ध स्टाफ रवाना करें।',
                'रुग्णांच्या इंजेक्शन किंवा मलमपट्टीच्या विनंत्या तपासा आणि उपलब्ध परिचारिका त्यांच्या पत्त्यावर पाठवा.'
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleSimulate}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Simulate a new patient request for testing"
            >
              + Demo Patient Request
            </button>
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
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Requests Section */}
          {effectiveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <Syringe size={28} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
                {tr('No Pending Medical Staff Requests', 'कोई नया स्टाफ अनुरोध लंबित नहीं है', 'कोणतीही प्रलंबित विनंती नाही')}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.35rem 0 1rem' }}>
                {tr(
                  'When patients submit requests for injections or home nursing, they will appear here in real time.',
                  'जब कोई मरीज इंजेक्शन या ड्रेसिंग के लिए स्टाफ बुलाएगा, तो उसका विवरण तुरंत यहां दिखाई देगा।',
                  'जेव्हा रुग्ण घरी इंजेक्शन किंवा नर्सिंगसाठी विनंती करतील, तेव्हा ते येथे थेट दिसेल.'
                )}
              </p>
              <button
                type="button"
                onClick={handleSimulate}
                className="btn btn-outline btn-sm"
                style={{ fontWeight: 700, borderColor: '#0d9488', color: '#0f766e' }}
              >
                + Simulate Test Patient Request (Rahul Sharma - Insulin)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {tr('Active Patient Staff Requests', 'सक्रिय मरीज अनुरोध सूची', 'सक्रिय रुग्ण विनंत्या')} ({effectiveRequests.length})
                </h4>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {pendingRequests.length} Pending &bull; {dispatchedRequests.length} En Route &bull; {completedRequests.length} Done
                </span>
              </div>

              {effectiveRequests.map((req) => {
                const isPending = req.status === 'Pending Staff';
                const isDispatched = req.status === 'Dispatched & En Route';
                const isCompleted = req.status === 'Completed';

                return (
                  <div
                    key={req.id}
                    style={{
                      border: isPending
                        ? '2px solid #f43f5e'
                        : isDispatched
                        ? '2px solid #0d9488'
                        : '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '1.15rem',
                      background: isPending ? '#fff1f2' : isDispatched ? '#f0fdfa' : '#f8fafc',
                      boxShadow: isPending ? '0 4px 14px rgba(244, 63, 94, 0.15)' : 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Top Row: Patient Info & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '10px',
                            background: isPending ? '#e11d48' : isDispatched ? '#0d9488' : '#64748b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem'
                          }}
                        >
                          <Syringe size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                              {req.patientName}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              (ABHA: {req.patientAbhaId})
                            </span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                            <Phone size={12} />
                            <span>{req.patientPhone}</span>
                            <span>&bull;</span>
                            <Clock size={12} />
                            <span>{new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                          background: isPending ? '#ffe4e6' : isDispatched ? '#ccfbf1' : '#e2e8f0',
                          color: isPending ? '#be123c' : isDispatched ? '#0f766e' : '#475569',
                          border: isPending ? '1px solid #fecdd3' : isDispatched ? '1px solid #99f6e4' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPending ? '#e11d48' : isDispatched ? '#0d9488' : '#64748b', display: 'inline-block' }} />
                        {req.status}
                      </span>
                    </div>

                    {/* Procedure & Prescription Box */}
                    <div style={{ background: '#ffffff', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#be123c', textTransform: 'uppercase' }}>
                          🎯 REQUIRED PROCEDURE: {req.purpose}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700, background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                          ⚡ {req.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                        Medicine / Care: {req.medicationDetails}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                        <strong>Patient Note:</strong> {req.notes}
                      </div>
                    </div>

                    {/* Patient Location Address */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#334155' }}>
                      <MapPin size={15} color="#e11d48" style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Visit Location:</strong> {req.address}
                      </span>
                    </div>

                    {/* Action Area: If Pending -> Show Staff Roster Dispatch; If Dispatched -> Show En Route Info */}
                    {isPending && (
                      <div style={{ marginTop: '0.25rem', padding: '0.75rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Users size={14} color="#0d9488" />
                          <span>Choose Available Staff to Dispatch to Patient Location:</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                          {AVAILABLE_STAFF_ROSTER.map((staff) => (
                            <div
                              key={staff.id}
                              style={{
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '0.65rem 0.85rem',
                                background: '#f8fafc',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '0.4rem'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>
                                    {staff.name}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '1px 5px', borderRadius: '4px' }}>
                                    ★ {staff.rating}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                  {staff.role} &bull; {staff.distanceKm} km away (~{staff.etaMinutes}m)
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={dispatchingId === req.id}
                                onClick={() => handleDispatch(req.id, staff)}
                                className="btn btn-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  padding: '0.35rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Navigation size={12} />
                                <span>Dispatch {staff.name.split(' ')[1] || staff.name} &rarr;</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isDispatched && (
                      <div style={{ padding: '0.75rem 0.95rem', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#15803d' }}>
                              🟢 En Route: {req.assignedStaff?.name} ({req.assignedStaff?.role})
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              ETA: {req.assignedStaff?.etaMinutes} mins ({req.assignedStaff?.distanceKm} km)
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>
                            Staff Phone: <strong>{req.assignedStaff?.phone}</strong> &bull; Heading to {req.address}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <a
                            href={`tel:${req.assignedStaff?.phone}`}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.72rem', borderColor: '#16a34a', color: '#15803d', fontWeight: 700 }}
                          >
                            <Phone size={12} /> Call Nurse
                          </a>

                          <button
                            type="button"
                            disabled={completingId === req.id}
                            onClick={() => handleComplete(req.id)}
                            className="btn btn-sm"
                            style={{
                              background: '#16a34a',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              padding: '0.35rem 0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Mark Injection Applied & Done</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div style={{ padding: '0.65rem 0.85rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.76rem', color: '#334155' }}>
                        <strong>Completed:</strong> {req.completionNotes} (at {new Date(req.completedAt).toLocaleTimeString()})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Available Staff Roster Information */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#0d9488" />
              <span>Registered PHC Field Nursing Staff & ANM Roster</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
              {AVAILABLE_STAFF_ROSTER.map((staff) => (
                <div
                  key={staff.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.76rem'
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{staff.name}</div>
                  <div style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.7rem' }}>{staff.role}</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '2px' }}>
                    {staff.facility} &bull; {staff.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
