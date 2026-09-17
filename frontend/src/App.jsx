import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { LocationProvider } from './context/LocationContext';

import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { OfflineBanner } from './components/common/OfflineBanner';
import { Toast } from './components/common/Toast';
import { MedicineReminderAlertModal } from './components/reminders/MedicineReminderAlertModal';
import { BottomEmergencyButton } from './components/common/BottomEmergencyButton';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { AuthPage } from './pages/AuthPage';
import { DoctorPortalPreview } from './pages/DoctorPortalPreview';
import { HospitalAdminPreview } from './pages/HospitalAdminPreview';
import { AshaDashboard } from './pages/AshaDashboard';
import { HomeDashboard } from './pages/HomeDashboard';
import { NormalCare } from './pages/NormalCare';
import { FindDoctor } from './pages/FindDoctor';
import { QueueManagement } from './pages/QueueManagement';
import { Consultation } from './pages/Consultation';
import { Prescriptions } from './pages/Prescriptions';
import { Medicines } from './pages/Medicines';
import { Tests } from './pages/Tests';
import { Reports } from './pages/Reports';
import { FollowUp } from './pages/FollowUp';
import { Referrals } from './pages/Referrals';
import { Emergency } from './pages/Emergency';
import { AIAssistant } from './pages/AIAssistant';
import { NearbyHealthcare } from './pages/NearbyHealthcare';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';

function AppContent() {
  const { user, role, loading, logout, setAuthSession, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const resolveInitialRoute = (userRole) => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) return 'home';

      const patientRoutes = new Set([
        'home', 'normal-care', 'find-doctor', 'queue', 'consultation',
        'prescriptions', 'medicines', 'tests', 'reports', 'follow-ups',
        'referrals', 'emergency', 'ai-assistant', 'nearby', 'profile', 'notifications'
      ]);

      const doctorRoutes = new Set([
        'doctor-portal', 'doctor-home', 'doctor-queue', 'doctor-prescribe', 'teleconsult',
        'referrals', 'reports', 'emergency', 'nearby', 'profile', 'notifications'
      ]);

      const ashaRoutes = new Set([
        'asha-dashboard', 'asha-patients', 'asha-requests', 'asha-referrals', 'asha-followups',
        'emergency', 'profile', 'notifications'
      ]);

      if (userRole === 'doctor') {
        return doctorRoutes.has(hash) ? hash : 'doctor-portal';
      }
      if (userRole === 'asha') {
        return ashaRoutes.has(hash) ? hash : 'asha-dashboard';
      }
      if (userRole === 'hospital_admin') {
        return 'overview';
      }
      return patientRoutes.has(hash) ? hash : 'home';
    } catch {
      return 'home';
    }
  };

  const [currentRoute, setCurrentRoute] = useState(() => resolveInitialRoute(role));
  const [routeHistory, setRouteHistory] = useState([currentRoute]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  React.useEffect(() => {
    if (isAuthenticated && role) {
      const initial = resolveInitialRoute(role);
      setCurrentRoute(initial);
      setRouteHistory([initial]);
    }
  }, [isAuthenticated, role]);

  const handleNavigate = (route) => {
    if (route === currentRoute) return;

    // Role-based route boundary enforcement
    let target = route;
    if (role === 'patient') {
      const doctorAshaRoutes = ['doctor-portal', 'doctor-queue', 'doctor-prescribe', 'asha-dashboard', 'hospital-admin'];
      if (doctorAshaRoutes.includes(target)) {
        target = 'home';
      }
    }

    try {
      window.history.pushState({ route: target }, '', `#${target}`);
    } catch (err) {
      // ignore
    }
    setRouteHistory((prev) => {
      if (prev[prev.length - 1] === target) return prev;
      return [...prev, target];
    });
    setCurrentRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    // 1. Give active page's modals/sub-functions first chance to step back 1 level
    const backEvent = new CustomEvent('app_back_request', { cancelable: true });
    const wasHandled = !window.dispatchEvent(backEvent);
    if (wasHandled) {
      return; // An in-page modal or sub-function cleanly retreated 1 step
    }

    // 2. Otherwise step back exactly 1 route in the history stack
    setRouteHistory((prevHistory) => {
      if (prevHistory.length > 1) {
        const nextHistory = prevHistory.slice(0, -1);
        const prevRoute = nextHistory[nextHistory.length - 1] || 'home';
        setCurrentRoute(prevRoute);
        return nextHistory;
      } else {
        setCurrentRoute('home');
        return ['home'];
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const onPopState = () => {
      handleGoBack();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleTriggerEmergency = () => {
    handleNavigate('emergency');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  const handleAuthSuccess = (res) => {
    setAuthSession(res);
    setCurrentRoute('home');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentRoute('auth');
  };

  // 1. Loading Splash
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid #e2e8f0',
            borderTopColor: '#0284c7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p style={{ marginTop: '1.25rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '600' }}>
          {language === 'hi' ? 'सेहतसेतु लोड हो रहा है...' : 'Loading SehatSetu (Rural Healthcare)...'}
        </p>
      </div>
    );
  }

  // 2. Unauthenticated or Explicit Role Selection / Auth Route
  if (!isAuthenticated || !user || currentRoute === 'auth') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
        <Toast />
      </div>
    );
  }

  // 3. Hospital Administrator View
  if (role === 'hospital_admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <HospitalAdminPreview
          onLogout={handleLogout}
        />
        <Toast />
      </div>
    );
  }

  // 4. Clinical or Patient Workspace
  const renderActiveRoute = () => {
    if (role === 'doctor') {
      switch (currentRoute) {
        case 'referrals':
          return <Referrals onNavigate={handleNavigate} />;
        case 'reports':
          return <Reports onNavigate={handleNavigate} />;
        case 'emergency':
          return (
            <Emergency
              onNavigate={handleNavigate}
              onCancel={handleGoBack}
            />
          );
        case 'nearby':
          return <NearbyHealthcare onNavigate={handleNavigate} />;
        case 'profile':
          return <Profile onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications onNavigate={handleNavigate} />;
        default:
          return (
            <DoctorPortalPreview
              onLogout={handleLogout}
              currentSubView={currentRoute}
              onNavigate={handleNavigate}
            />
          );
      }
    }

    if (role === 'asha') {
      switch (currentRoute) {
        case 'emergency':
          return (
            <Emergency
              onNavigate={handleNavigate}
              onCancel={handleGoBack}
            />
          );
        case 'profile':
          return <Profile onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications onNavigate={handleNavigate} />;
        default:
          return (
            <AshaDashboard
              onLogout={handleLogout}
              currentSubView={currentRoute}
              onNavigate={handleNavigate}
            />
          );
      }
    }

    switch (currentRoute) {
      case 'home':
        return (
          <HomeDashboard
            onNavigate={handleNavigate}
            onTriggerEmergency={handleTriggerEmergency}
          />
        );
      case 'normal-care':
        return <NormalCare onNavigate={handleNavigate} onGoBack={handleGoBack} />;
      case 'find-doctor':
        return <FindDoctor onNavigate={handleNavigate} />;
      case 'queue':
        return <QueueManagement onNavigate={handleNavigate} />;
      case 'consultation':
        return <Consultation onNavigate={handleNavigate} />;
      case 'prescriptions':
        return <Prescriptions onNavigate={handleNavigate} />;
      case 'medicines':
        return <Medicines onNavigate={handleNavigate} />;
      case 'tests':
        return <Tests onNavigate={handleNavigate} />;
      case 'reports':
        return <Reports onNavigate={handleNavigate} />;
      case 'follow-ups':
        return <FollowUp onNavigate={handleNavigate} />;
      case 'referrals':
        return <Referrals onNavigate={handleNavigate} />;
      case 'emergency':
        return (
          <Emergency
            onNavigate={handleNavigate}
            onCancel={handleGoBack}
          />
        );

      case 'ai-assistant':
        return <AIAssistant onNavigate={handleNavigate} />;
      case 'nearby':
        return <NearbyHealthcare onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
      case 'notifications':
        return <Notifications onNavigate={handleNavigate} />;
      default:
        return (
          <HomeDashboard
            onNavigate={handleNavigate}
            onTriggerEmergency={handleTriggerEmergency}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Left Navigation Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Application Shell */}
      <div className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>


        {/* Top Header */}
        <Header
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          onTriggerEmergency={handleTriggerEmergency}
          onToggleSidebar={toggleSidebar}
        />


        {/* Low Connectivity / Offline Banner */}
        <OfflineBanner />

        {/* Page Content View */}
        <main style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
          {renderActiveRoute()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onTriggerEmergency={handleTriggerEmergency}
      />

      {/* Persistent Bottom Emergency SOS Button (Desktop & Tablet Access) */}
      <BottomEmergencyButton
        currentRoute={currentRoute}
        onTriggerEmergency={handleTriggerEmergency}
      />

      {/* Global Floating Toast Alert Stack */}
      <Toast />

      {/* Real-time Interactive Medicine Reminder Alert Modal */}
      <MedicineReminderAlertModal />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ConnectivityProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <LocationProvider>
                <AppContent />
              </LocationProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ConnectivityProvider>
    </ErrorBoundary>
  );
}
