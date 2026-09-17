import React from 'react';
import { Check, Clock, ChevronRight } from 'lucide-react';

export const PatientJourneyBar = ({ onNavigate }) => {
  const steps = [
    { id: 'find-doctor', label: 'Doctor OPD', sub: 'Dr. Anjali Mehta', status: 'completed', target: 'find-doctor' },
    { id: 'queue', label: 'Token Queue', sub: 'Token #27', status: 'active', target: 'queue' },
    { id: 'consultation', label: 'Teleconsult', sub: 'WebRTC Hub', status: 'completed', target: 'consultation' },
    { id: 'prescriptions', label: 'Prescription', sub: 'RX-2026-0042', status: 'completed', target: 'prescriptions' },
    { id: 'medicines', label: 'Medicines', sub: 'Jan Aushadhi', status: 'completed', target: 'medicines' },
    { id: 'tests', label: 'Diagnostic Test', sub: 'CBC Blood Test', status: 'completed', target: 'tests' },
    { id: 'reports', label: 'Lab Report', sub: 'Report Ready', status: 'completed', target: 'reports' },
    { id: 'follow-ups', label: 'Follow-Up', sub: '18 Sep 2026', status: 'upcoming', target: 'follow-ups' },
    { id: 'referrals', label: 'Specialist Referral', sub: 'Cardiology (Chakan)', status: 'active', target: 'referrals' }
  ];

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.75rem',
        padding: '1.25rem',
        background: 'linear-gradient(to right, #FFFFFF, #F8FAFC)',
        border: '1px solid var(--border)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            CONTINUOUS CONTINUUM OF CARE
          </span>
          <h4 style={{ margin: '2px 0 0 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            Rahul's Connected Healthcare Journey
          </h4>
        </div>
        <button
          onClick={() => onNavigate('normal-care')}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
        >
          View Full Pathway <ChevronRight size={14} />
        </button>
      </div>

      {/* Horizontal Scrollable Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'thin'
        }}
      >
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => onNavigate(step.target)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--primary-light)' : isDone ? '#F0FDF4' : 'var(--surface-alt)',
                  border: `1px solid ${isActive ? 'var(--primary)' : isDone ? '#BBF7D0' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={`Click to jump to ${step.label}`}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700
                  }}
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : isActive ? <Clock size={12} /> : idx + 1}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {step.sub}
                  </div>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div style={{ color: 'var(--border-strong)', flexShrink: 0 }}>
                  <ChevronRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
