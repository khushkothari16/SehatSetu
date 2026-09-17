import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  FileBadge,
  Activity,
  Ambulance,
  Bed,
  Users,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  Download,
  Gauge,
  Package,
  Layers,
  Share2,
  Clock,
  Check,
  X,
  ChevronRight,
  Search,
  FileText,
  RefreshCw,
  AlertCircle,
  Filter,
  UserCheck,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { emergencyService } from '../services/emergencyService';
import { referralTrackingService } from '../services/referralTrackingService';

export const HospitalAdminPreview = ({ onLogout }) => {
  const { user } = useAuth();
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();
  const [activeEmerg, setActiveEmerg] = useState(() => emergencyService.getActiveEmergencySync());

  // Active Tab: 'overview' | 'referrals'
  const [activeTab, setActiveTab] = useState('overview');

  // Referral Management States
  const [referrals, setReferrals] = useState([]);
  const [referralFilter, setReferralFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'UNDER_TREATMENT' | 'COMPLETED'
  const [referralSearch, setReferralSearch] = useState('');
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Status Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    referral: null,
    targetStatus: '',
    doctorName: 'Dr. Suresh Deshpande (Admin)',
    bedNumber: 'Bed #04 (Maternity/General)',
    department: 'General Medicine & Inpatient Care',
    remarks: ''
  });

  const fetchReferrals = async (quiet = false) => {
    if (!quiet) setLoadingReferrals(true);
    try {
      const data = await referralTrackingService.getTrackingChains();
      setReferrals(data || []);
    } catch (err) {
      console.error('Error fetching hospital referrals:', err);
    } finally {
      if (!quiet) setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    fetchReferrals();

    const handleEmergencyChange = (e) => {
      setActiveEmerg(e.detail || null);
    };
    window.addEventListener('emergency_state_change', handleEmergencyChange);

    const handleReferralUpdate = () => {
      fetchReferrals(true);
    };
    window.addEventListener('referral_chain_updated', handleReferralUpdate);

    return () => {
      window.removeEventListener('emergency_state_change', handleEmergencyChange);
      window.removeEventListener('referral_chain_updated', handleReferralUpdate);
    };
  }, []);

  const adminData = {
    name: user?.name || 'Dr. Suresh Deshpande (Medical Superintendent)',
    facilityName: user?.facilityName || user?.hospital || 'Khed Primary Health Centre & 108 Emergency Bay',
    facilityId: user?.facilityId || 'PHC-MH-PUN-042',
    district: user?.district || 'Pune',
    state: user?.state || 'Maharashtra',
    email: user?.email || 'admin.khedphc@arogya.gov.in',
    phone: user?.phone || '+91 94231 88990',
    authProvider: user?.authProvider || 'email',
    createdAt: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Session'
  };

  const staffOnDuty = [
    { name: 'Dr. Anjali Mehta', role: 'Duty Medical Officer (MBBS)', dept: 'OPD & Telemedicine', status: 'On Duty', badge: 'badge-success' },
    { name: 'Sunita Salunkhe', role: 'Senior Staff Nurse (RN)', dept: 'Emergency & Inpatient', status: 'On Duty', badge: 'badge-success' },
    { name: 'Rajesh Shinde', role: 'Chief Pharmacist', dept: 'Jan Aushadhi Dispensary', status: 'On Duty', badge: 'badge-success' },
    { name: 'Rekha Gaikwad', role: 'ANM / ASHA Lead', dept: 'Rural Sub-Centres Liaison', status: 'Field Visit', badge: 'badge-warning' }
  ];

  const emergencyDispatches = [
    ...(activeEmerg
      ? [
          {
            vehicleNo: activeEmerg.ambulanceVehicleNumber,
            type: '108 ALS (Citizen Live Dispatch)',
            driver: activeEmerg.driverName,
            location: activeEmerg.address,
            status: activeEmerg.status,
            patient: `Rahul Sharma (Citizen Alert) - ${activeEmerg.description}`,
            eta: `0${activeEmerg.etaMinutes} mins`
          }
        ]
      : []),
    {
      vehicleNo: 'MH-12-EA-1081',
      type: '108 ALS (Advanced Life Support)',
      driver: 'Mahesh K.',
      location: 'Alandi Rural Bypass',
      status: 'En Route to PHC',
      patient: 'Severe respiratory distress',
      eta: '8 mins'
    },
    {
      vehicleNo: 'MH-12-EA-1082',
      type: '108 BLS (Basic Life Support)',
      driver: 'Sachin P.',
      location: 'Khed PHC Bay 1',
      status: 'Ready & Available',
      patient: 'None (Standby)',
      eta: 'Immediate'
    }
  ];

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ adminData, referrals }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hospital_admin_${user?.id || 'admin'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Facility administrator record exported as JSON!', 'info');
  };

  // Open modal to update referral status
  const openActionModal = (referral, targetStatus) => {
    let defaultRemarks = '';
    if (targetStatus === 'Accepted by Facility') {
      defaultRemarks = `Referral accepted by ${adminData.facilityName}. Priority bed pre-allocated.`;
    } else if (targetStatus === 'Patient Arrived & Registered') {
      defaultRemarks = 'Patient physically arrived and completed intake registration at reception desk.';
    } else if (targetStatus === 'Treatment Started') {
      defaultRemarks = 'Specialist examination initiated; continuous vitals monitoring in progress.';
    } else if (targetStatus === 'Treatment Completed') {
      defaultRemarks = 'Clinical treatment and stabilization completed successfully. Discharge vitals stable.';
    } else if (targetStatus === 'Referral Closed') {
      defaultRemarks = 'Referral case concluded. Discharge slip issued with counter-referral to local PHC.';
    } else if (targetStatus === 'Rejected') {
      defaultRemarks = 'Referred to alternate tertiary facility due to specialized cath-lab capacity requirements.';
    }

    setActionModal({
      isOpen: true,
      referral,
      targetStatus,
      doctorName: adminData.name,
      bedNumber: 'Bed #04 (Maternity/General)',
      department: 'General Medicine & Inpatient Care',
      remarks: defaultRemarks
    });
  };

  const handleConfirmStatusUpdate = async (e) => {
    e.preventDefault();
    if (!actionModal.referral) return;

    try {
      await referralTrackingService.updateReferralStatus(
        actionModal.referral.id,
        actionModal.targetStatus,
        {
          notes: actionModal.remarks,
          facility: adminData.facilityName,
          doctorName: actionModal.doctorName,
          department: actionModal.department
        }
      );

      addToast(
        tr(
          `Referral #${actionModal.referral.id} transitioned to: ${actionModal.targetStatus}!`,
          `रेफरल #${actionModal.referral.id} की स्थिति बदली: ${actionModal.targetStatus}!`,
          `रेफरल #${actionModal.referral.id} ची स्थिती अपडेट: ${actionModal.targetStatus}!`
        ),
        'success'
      );

      setActionModal({ ...actionModal, isOpen: false });
      fetchReferrals(true);
    } catch (err) {
      addToast(err.message || 'Failed to update referral status', 'error');
    }
  };

  // Counts for tabs & badges
  const pendingCount = referrals.filter(r => r.status === 'Referral Sent' || r.status === 'In Transit to Specialist').length;
  const underTreatmentCount = referrals.filter(r => r.status === 'Accepted by Facility' || r.status === 'Patient Arrived & Registered' || r.status === 'Treatment Started' || r.status === 'Under Specialist Review').length;
  const completedCount = referrals.filter(r => r.status === 'Treatment Completed' || r.status === 'Referral Closed').length;

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch =
      r.patientName?.toLowerCase().includes(referralSearch.toLowerCase()) ||
      r.primaryCondition?.toLowerCase().includes(referralSearch.toLowerCase()) ||
      r.id?.toLowerCase().includes(referralSearch.toLowerCase()) ||
      r.village?.toLowerCase().includes(referralSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (referralFilter === 'PENDING') {
      return r.status === 'Referral Sent' || r.status === 'In Transit to Specialist';
    }
    if (referralFilter === 'IN_TRANSIT') {
      return r.status === 'In Transit to Specialist' || r.status === 'Accepted by Facility';
    }
    if (referralFilter === 'UNDER_TREATMENT') {
      return r.status === 'Patient Arrived & Registered' || r.status === 'Treatment Started' || r.status === 'Under Specialist Review';
    }
    if (referralFilter === 'COMPLETED') {
      return r.status === 'Treatment Completed' || r.status === 'Referral Closed';
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '0.3rem', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'overview' ? '#ffffff' : 'transparent',
              color: activeTab === 'overview' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: activeTab === 'overview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Building2 size={16} color={activeTab === 'overview' ? '#16a34a' : '#64748b'} />
            <span>{tr('Facility Overview & Fleet', 'सुविधा सारांश व वाहन बेड़ा', 'केंद्र माहिती व रुग्णवाहिका')}</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'referrals' ? '#ffffff' : 'transparent',
              color: activeTab === 'referrals' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: activeTab === 'referrals' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Share2 size={16} color={activeTab === 'referrals' ? '#0284c7' : '#64748b'} />
            <span>{tr('Inter-Facility Referral Desk', 'अंतर-अस्पताल रेफरल डेस्क', 'आंतर-रुग्णालय संदर्भ डेस्क')}</span>
            {pendingCount > 0 && (
              <span style={{
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px'
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1.2rem',
            fontSize: '0.875rem',
            borderColor: '#fca5a5',
            color: '#dc2626',
            backgroundColor: 'white',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
          title={tr('Logout', 'लॉगआउट', 'लॉगआउट')}
        >
          <LogOut size={16} color="#dc2626" />
          <span>{tr('Logout', 'लॉगआउट', 'लॉगआउट')}</span>
        </button>
      </div>

      {/* Facility Header Card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: '700',
              boxShadow: '0 8px 16px rgba(22, 163, 74, 0.25)'
            }}>
              <Building2 size={36} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
                  {adminData.facilityName}
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  <ShieldCheck size={14} />
                  {tr('NHA Registered', 'एनएचए पंजीकृत', 'NHA नोंदणीकृत')}
                </span>
                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {tr('Role: Hospital Incharge', 'भूमिका: अस्पताल प्रभारी', 'भूमिका: रुग्णालय प्रमुख')}
                </span>
              </div>
              <p style={{ margin: '0.35rem 0 0', color: '#15803d', fontWeight: '600', fontSize: '1rem' }}>
                {tr('Medical Superintendent:', 'चिकित्सा अधीक्षक:', 'वैद्यकीय अधीक्षक:')} {adminData.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                <Building size={15} />
                <span>{tr('Facility ID:', 'सुविधा आयडी:', 'केंद्र आयडी:')} {adminData.facilityId} &bull; {adminData.district}, {adminData.state}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchReferrals(false)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              title="Sync live referrals"
            >
              <RefreshCw size={14} />
              <span>{tr('Sync Data', 'डेटा सिंक करें', 'माहिती सिंक करा')}</span>
            </button>
            <button
              onClick={handleExportData}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              title="Export database profile JSON"
            >
              <Download size={14} />
              <span>{tr('Export Record', 'JSON रिकॉर्ड', 'JSON नोंद')}</span>
            </button>
          </div>
        </div>

        {/* Facility Info Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          paddingTop: '1.25rem'
        }}>
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              {tr('Facility Registry Code (NHA)', 'सुविधा पंजीकरण कोड (NHA)', 'आरोग्य केंद्र नोंदणी कोड (NHA)')}
            </div>
            <div style={{ fontWeight: '700', color: '#1e293b', marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              {adminData.facilityId}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              {tr('Admin Official Contact', 'प्रशासक संपर्क', 'प्रशासक अधिकृत संपर्क')}
            </div>
            <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {adminData.phone}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              {tr('Facility Official Email', 'सुविधा ईमेल', 'केंद्राचा अधिकृत ईमेल')}
            </div>
            <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {adminData.email}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              {tr('Operational Hierarchy', 'प्रचालन स्तर', 'कार्यरत स्तर')}
            </div>
            <div style={{ fontWeight: '700', color: '#16a34a', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {tr('24x7 PHC + 108 Emergency', '24x7 पीएचसी + 108 आपातकालीन', '२४x७ पीएचसी + १०८ आपत्कालीन सेवा')}
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: FACILITY OVERVIEW & FLEET */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {/* Facility Resource KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{tr('Inpatient Beds', 'भर्ती बेड', 'रुग्ण खाटा')}</span>
                <Bed size={18} color="#16a34a" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.1rem' }}>24 / 30</div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>{tr('6 Beds Available (80% Cap)', '6 बेड उपलब्ध (80% भरे)', '६ खाटा उपलब्ध (८०% भरलेले)')}</span>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{tr('108 Ambulances', '108 एम्बुलेंस', '१०८ रुग्णवाहिका')}</span>
                <Ambulance size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.1rem' }}>{tr('2 / 3 Active', '2 / 3 सक्रिय', '२ / ३ सक्रिय')}</div>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>{tr('1 Dispatched to Alandi', '1 आलंदी रवाना', '१ आळंदीकडे रवाना')}</span>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{tr('Pending Inbound Referrals', 'लंबित इनबाउंड रेफरल', 'प्रलंबित इनबाउंड संदर्भ')}</span>
                <Share2 size={18} color="#0284c7" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0284c7', margin: '0.4rem 0 0.1rem' }}>{pendingCount} Cases</div>
              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
                <button
                  onClick={() => setActiveTab('referrals')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                >
                  {tr('Review Inbound Desk →', 'रेफरल डेस्क देखें →', 'रेफरल डेस्क तपासा →')}
                </button>
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{tr('Essential Medicine Stock', 'आवश्यक दवा स्टॉक', 'जीवनावश्यक औषध साठा')}</span>
                <Package size={18} color="#7c3aed" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.1rem' }}>{tr('94% Normal', '94% सामान्य', '९४% सामान्य')}</div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>{tr('Jan Aushadhi Synced', 'जन औषधि सिंक्ड', 'जन औषध जोडलेले')}</span>
            </div>
          </div>

          {/* Two column layout: Staff & 108 Fleet */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            {/* On Duty Staff Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                {tr('Clinical Staff on Duty (Current Shift)', 'ड्यूटी पर क्लिनिकल स्टाफ (वर्तमान शिफ्ट)', 'कर्तव्यावरील वैद्यकीय कर्मचारी (सध्याची शिफ्ट)')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {staffOnDuty.map((staff, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '10px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{staff.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staff.role} &bull; {staff.dept}</div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: staff.status === 'On Duty' ? '#dcfce7' : '#fef3c7',
                      color: staff.status === 'On Duty' ? '#15803d' : '#b45309'
                    }}>
                      {staff.status === 'On Duty' ? tr('On Duty', 'ड्यूटी पर', 'कर्तव्यावर') : tr('Field Visit', 'फील्ड विजिट', 'क्षेत्र भेट')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 108 Emergency Fleet Status Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                {tr('Emergency 108 Ambulance Bay', 'आपातकालीन 108 एम्बुलेंस बे', 'आपत्कालीन १०८ रुग्णवाहिका विभाग')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {emergencyDispatches.map((amb, idx) => (
                  <div key={idx} style={{
                    padding: '0.9rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    borderLeft: amb.status.includes('En Route') ? '4px solid #dc2626' : '4px solid #16a34a'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                        {amb.vehicleNo} &bull; {amb.type}
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: amb.status.includes('En Route') ? '#dc2626' : '#16a34a'
                      }}>
                        {amb.status} (ETA: {amb.eta})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.35rem' }}>
                      Driver: {amb.driver} &bull; Current Area: {amb.location}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Case: {amb.patient}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTER-FACILITY REFERRAL DESK (PHASE 7, 9, 20 WORKFLOW) */}
      {activeTab === 'referrals' && (
        <div className="animate-fade-in">
          {/* Referral Pipeline KPI Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                {tr('Total Referrals', 'कुल रेफरल', 'एकूण संदर्भ')}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                {referrals.length}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>
                {tr('Pending Action / Sent', 'स्वीकृति हेतु लंबित', 'स्वीकृतीसाठी प्रलंबित')}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#b45309', marginTop: '0.2rem' }}>
                {pendingCount}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase' }}>
                {tr('Under Specialist Care', 'उपचाराधीन मरीज', 'उपचाराखालील रुग्ण')}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0284c7', marginTop: '0.2rem' }}>
                {underTreatmentCount}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase' }}>
                {tr('Completed & Closed', 'उपचार संपन्न / डिस्चार्ज', 'उपचार पूर्ण / डिस्चार्ज')}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>
                {completedCount}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '450px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={tr('Search patient, condition, ID, village...', 'मरीज, बीमारी, आईडी खोजें...', 'रुग्ण, आजार, आयडी शोधा...')}
                  value={referralSearch}
                  onChange={(e) => setReferralSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: tr('All Cases', 'सभी केस', 'सर्व केसेस') },
                  { key: 'PENDING', label: `${tr('Pending Action', 'लंबित', 'प्रलंबित')} (${pendingCount})` },
                  { key: 'UNDER_TREATMENT', label: tr('Under Treatment', 'उपचाराधीन', 'उपचाराखालील') },
                  { key: 'COMPLETED', label: tr('Completed / Closed', 'संपन्न', 'पूर्ण') }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setReferralFilter(f.key)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: referralFilter === f.key ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: referralFilter === f.key ? '#e0f2fe' : '#ffffff',
                      color: referralFilter === f.key ? '#0284c7' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Referrals List */}
          {loadingReferrals ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{
                width: 36,
                height: 36,
                border: '3px solid #e2e8f0',
                borderTopColor: '#0284c7',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 0.8s linear infinite'
              }} />
              <p>{t('loading')}...</p>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <AlertCircle size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                {tr('No Referrals Matching Filters', 'कोई रेफरल नहीं मिला', 'कोणताही संदर्भ आढळला नाही')}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                {tr('When Sub-centres, PHCs or ASHAs refer patients, they appear here live.', 'उप-केंद्र या आशा कार्यकर्ताओं द्वारा भेजे गए रेफरल यहां दिखेंगे।', 'उपकेंद्र किंवा आशा कर्मचाऱ्यांनी पाठवलेले संदर्भ येथे दिसतील.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredReferrals.map((chain) => {
                const latestHop = chain.hops && chain.hops.length > 0 ? chain.hops[chain.hops.length - 1] : null;

                // Determine badge style
                const isPending = chain.status === 'Referral Sent' || chain.status === 'In Transit to Specialist';
                const isAccepted = chain.status === 'Accepted by Facility';
                const isArrived = chain.status === 'Patient Arrived & Registered';
                const isTreating = chain.status === 'Treatment Started' || chain.status === 'Under Specialist Review';
                const isCompleted = chain.status === 'Treatment Completed' || chain.status === 'Referral Closed';
                const isCancelled = chain.status === 'Rejected' || chain.status === 'Cancelled';

                return (
                  <div
                    key={chain.id}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      borderLeft: isPending ? '5px solid #f59e0b' : isTreating || isArrived ? '5px solid #0284c7' : isCompleted ? '5px solid #16a34a' : '5px solid #cbd5e1',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            background: chain.priority.includes('High') || chain.priority.includes('Urgent') ? '#fee2e2' : '#f1f5f9',
                            color: chain.priority.includes('High') || chain.priority.includes('Urgent') ? '#dc2626' : '#475569'
                          }}>
                            {chain.priority}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>
                            {chain.id}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            &bull; ABHA: {chain.abhaId}
                          </span>
                        </div>

                        <h3 style={{ margin: '0.45rem 0 0.2rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          {chain.patientName} {chain.patientNameHindi ? `(${chain.patientNameHindi})` : ''}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {chain.gender}, {chain.age} yrs &bull; Village: <strong>{chain.village}</strong>
                        </div>
                      </div>

                      {/* Current Status Pill */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          background: isPending ? '#fef3c7' : isAccepted || isArrived || isTreating ? '#e0f2fe' : isCompleted ? '#dcfce7' : '#f1f5f9',
                          color: isPending ? '#b45309' : isAccepted || isArrived || isTreating ? '#0369a1' : isCompleted ? '#15803d' : '#475569'
                        }}>
                          {chain.status}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                          Updated: {chain.lastUpdated}
                        </div>
                      </div>
                    </div>

                    {/* Condition Box */}
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.9rem 1.1rem',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        {tr('Primary Clinical Condition / Diagnosis:', 'प्राथमिक चिकित्सीय स्थिति:', 'प्राथमिक वैद्यकीय स्थिती:')}
                      </div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginTop: '0.2rem' }}>
                        {chain.primaryCondition}
                      </div>

                      {latestHop && (
                        <div style={{ marginTop: '0.6rem', fontSize: '0.825rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div>
                            <strong>{tr('Referring Doctor / Unit:', 'रेफर करने वाले डॉक्टर:', 'रेफर करणारे डॉक्टर:')}</strong> {latestHop.doctorName} ({latestHop.facility})
                          </div>
                          <div>
                            <strong>{tr('Clinical Notes:', 'क्लिनिकल नोट्स:', 'वैद्यकीय नोंदी:')}</strong> &ldquo;{latestHop.doctorRemarks || latestHop.clinicalFindings}&rdquo;
                          </div>
                          {latestHop.vitals && (
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem', color: '#0f172a', fontWeight: 600 }}>
                              {latestHop.vitals.bp && <span>BP: {latestHop.vitals.bp}</span>}
                              {latestHop.vitals.pulse && <span>Pulse: {latestHop.vitals.pulse}</span>}
                              {latestHop.vitals.spo2 && <span>SpO2: {latestHop.vitals.spo2}</span>}
                              {latestHop.vitals.temp && <span>Temp: {latestHop.vitals.temp}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Toolbar (Hospital Facility Lifecycle Controls) */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {tr('Referral Chain Length:', 'रेफरल चरण:', 'संदर्भ टप्पे:')} <strong>{chain.hops?.length || 1} Hops Recorded</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Step 1: Accept or Reject Referral */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => openActionModal(chain, 'Accepted by Facility')}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                            >
                              <CheckCircle2 size={15} />
                              <span>{tr('Accept Referral', 'रेफरल स्वीकारें', 'संदर्भ स्वीकारा')}</span>
                            </button>
                            <button
                              onClick={() => openActionModal(chain, 'Rejected')}
                              className="btn btn-outline btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#fca5a5', color: '#dc2626' }}
                            >
                              <X size={15} />
                              <span>{tr('Reject', 'अस्वीकार', 'नकारा')}</span>
                            </button>
                          </>
                        )}

                        {/* Step 2: Patient Arrived */}
                        {isAccepted && (
                          <button
                            onClick={() => openActionModal(chain, 'Patient Arrived & Registered')}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, backgroundColor: '#0284c7' }}
                          >
                            <UserCheck size={15} />
                            <span>{tr('Mark Patient Arrived', 'मरीज आगमन दर्ज करें', 'रुग्ण आगमन नोंदवा')}</span>
                          </button>
                        )}

                        {/* Step 3: Start Treatment */}
                        {isArrived && (
                          <button
                            onClick={() => openActionModal(chain, 'Treatment Started')}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, backgroundColor: '#7c3aed' }}
                          >
                            <Stethoscope size={15} />
                            <span>{tr('Start Treatment', 'उपचार शुरू करें', 'उपचार सुरू करा')}</span>
                          </button>
                        )}

                        {/* Step 4: Complete Treatment */}
                        {isTreating && (
                          <button
                            onClick={() => openActionModal(chain, 'Treatment Completed')}
                            className="btn btn-success btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                          >
                            <Check size={15} />
                            <span>{tr('Complete Treatment', 'उपचार पूर्ण करें', 'उपचार पूर्ण करा')}</span>
                          </button>
                        )}

                        {/* Step 5: Close Referral */}
                        {(chain.status === 'Treatment Completed' || isTreating) && (
                          <button
                            onClick={() => openActionModal(chain, 'Referral Closed')}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                          >
                            <FileCheck size={15} />
                            <span>{tr('Close Referral & Discharge', 'केस बंद व डिस्चार्ज', 'केस पूर्ण व डिस्चार्ज')}</span>
                          </button>
                        )}

                        {isCompleted && (
                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={15} /> {tr('Case Closed & Discharged', 'केस संपन्न', 'केस पूर्ण')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* POP-UP MODAL: HOSPITAL REFERRAL ACTION DIALOG */}
      {actionModal.isOpen && actionModal.referral && (
        <div className="modal-overlay" onClick={() => setActionModal({ ...actionModal, isOpen: false })}>
          <div
            className="modal-card animate-fade-in"
            style={{ maxWidth: 540, padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {tr('Update Referral Status', 'रेफरल स्थिति अपडेट करें', 'संदर्भ स्थिती अपडेट करा')}
              </h3>
              <button
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div>Patient: <strong>{actionModal.referral.patientName}</strong> &bull; ID: {actionModal.referral.id}</div>
              <div style={{ marginTop: '0.2rem', color: '#64748b' }}>Condition: {actionModal.referral.primaryCondition}</div>
              <div style={{ marginTop: '0.4rem', color: '#0284c7', fontWeight: 700 }}>
                Target Status: &ldquo;{actionModal.targetStatus}&rdquo;
              </div>
            </div>

            <form onSubmit={handleConfirmStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  {tr('Assigned Attending Physician:', 'नियुक्त चिकित्सक:', 'नियुक्त डॉक्टर:')}
                </label>
                <input
                  type="text"
                  required
                  value={actionModal.doctorName}
                  onChange={(e) => setActionModal({ ...actionModal, doctorName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    {tr('Department:', 'विभाग:', 'विभाग:')}
                  </label>
                  <input
                    type="text"
                    required
                    value={actionModal.department}
                    onChange={(e) => setActionModal({ ...actionModal, department: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    {tr('Room / Bed No:', 'कमरा / बेड नं:', 'खोली / खाट क्र.:')}
                  </label>
                  <input
                    type="text"
                    required
                    value={actionModal.bedNumber}
                    onChange={(e) => setActionModal({ ...actionModal, bedNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  {tr('Clinical Notes / Discharge Summary / Reason:', 'क्लिनिकल नोट्स / डिस्चार्ज सारांश / कारण:', 'वैद्यकीय नोंदी / डिस्चार्ज सारांश / कारण:')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionModal.remarks}
                  onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                  className="btn btn-outline"
                >
                  {tr('Cancel', 'रद्द करें', 'रद्द करा')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  {tr('Confirm Status Update', 'स्थिति अपडेट की पुष्टि करें', 'स्थिती अद्यतन पुष्टी करा')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
