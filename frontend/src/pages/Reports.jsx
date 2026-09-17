import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Download,
  Eye,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  X
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const Reports = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (viewingReport) {
        e.preventDefault();
        setViewingReport(null);
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [viewingReport]);

  const filtered = reports.filter(r =>
    r.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.diagnosticCenter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (r) => {
    window.print();
    addToast(`${tr('Downloaded official report for', 'आधिकारिक रिपोर्ट डाउनलोड हुई:', 'अधिकृत अहवाल डाउनलोड झाला:')} ${r.testName}`, 'info');
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <FileCheck size={28} color="var(--primary)" />
          {t('reports')} {tr('& Diagnostic History', 'एवं जांच इतिहास', 'व तपासणी इतिहास')}
        </h1>
      </div>

      {/* Search Filter */}
      <div className="search-wrapper" style={{ marginBottom: '1.5rem' }}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={tr('Search by test name, category, or lab...', 'जांच का नाम, श्रेणी या लैब खोजें...', 'चाचणीचे नाव किंवा लॅब शोधा...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Reports List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>{tr('No medical reports found', 'कोई मेडिकल रिपोर्ट नहीं मिली', 'कोणताही तपासणी अहवाल आढळला नाही')}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((report) => (
            <div
              key={report.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.25rem 1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F0FDF4',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileCheck size={24} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success">{tr('● Report Ready', '● रिपोर्ट तैयार है', '● अहवाल तयार')}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {report.id}</span>
                  </div>
                  <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {report.testName}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {report.diagnosticCenter} &bull; {report.date} &bull; {tr('Referred by:', 'सल्लागार:', 'सल्लागार:')} {report.doctorReferred}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setViewingReport(report)}
                  className="btn btn-outline btn-sm"
                >
                  <Eye size={15} />
                  {tr('View Report', 'रिपोर्ट देखें', 'अहवाल पहा')}
                </button>
                <button
                  onClick={() => handleDownload(report)}
                  className="btn btn-primary btn-sm"
                >
                  <Download size={15} />
                  {tr('Download', 'डाउनलोड', 'डाउनलोड')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW INDIVIDUAL REPORT MODAL */}
      {viewingReport && (
        <div className="modal-overlay" onClick={() => setViewingReport(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <span className="badge badge-success" style={{ marginBottom: 4 }}>
                  <ShieldCheck size={12} /> {tr('ABHA Digital Verified', 'आभा डिजिटल सत्यापित', 'आभा डिजिटल प्रमाणित')}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{viewingReport.testName}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewingReport(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Header Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem'
                }}
              >
                <div><strong>{tr('Patient:', 'मरीज:', 'रुग्ण:')}</strong> Rahul Sharma (34 M)</div>
                <div><strong>{tr('Report Date:', 'दिनांक:', 'अहवाल तारीख:')}</strong> {viewingReport.date}</div>
                <div><strong>{tr('Laboratory:', 'प्रयोगशाला:', 'प्रयोगशाळा:')}</strong> {viewingReport.diagnosticCenter}</div>
                <div><strong>{tr('Referring Doctor:', 'सल्लागार:', 'सल्लागार:')}</strong> {viewingReport.doctorReferred}</div>
              </div>

              {/* Clinical Summary */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-md)',
                  color: '#166534',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem'
                }}
              >
                {tr('Summary:', 'निष्कर्ष:', 'निष्कर्ष:')} {viewingReport.summary}
              </div>

              {/* Parameters Table */}
              {viewingReport.parameters && (
                <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>{tr('Parameter', 'जांच घटक', 'घटक')}</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>{tr('Observed Value', 'परिणाम मान', 'तपासणी मूल्य')}</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>{tr('Biological Normal Range', 'सामान्य सीमा', 'सामान्य श्रेणी')}</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>{tr('Flag', 'स्थिति', 'स्थिती')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReport.parameters.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {p.value} {p.unit}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>
                            {p.normalRange} {p.unit}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            <span className="badge badge-success">{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewingReport(null)}>
                {tr('Close', 'बंद करें', 'बंद करा')}
              </button>
              <button className="btn btn-primary" onClick={() => handleDownload(viewingReport)}>
                <Download size={16} />
                {tr('Download PDF', 'पीडीएफ डाउनलोड करें', 'पीडीएफ डाउनलोड करा')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
