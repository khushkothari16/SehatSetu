import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const Toast = () => {
  const { toasts } = useNotifications();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: 2000,
        maxWidth: 380,
        width: '90%'
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: '#0F172A',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-xl)',
              fontSize: '0.875rem',
              lineHeight: 1.4
            }}
          >
            {isSuccess && <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />}
            {isError && <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />}
            {!isSuccess && !isError && <Info size={18} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />}
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
