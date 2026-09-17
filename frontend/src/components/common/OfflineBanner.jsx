import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useLanguage } from '../../context/LanguageContext';

export const OfflineBanner = () => {
  const { isOnline } = useConnectivity();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      style={{
        backgroundColor: '#78350F',
        color: '#FEF3C7',
        padding: '0.65rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        position: 'sticky',
        top: 'var(--header-height)',
        zIndex: 95,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <WifiOff size={18} />
      <span>{t('offlineNotice')}</span>
    </div>
  );
};
