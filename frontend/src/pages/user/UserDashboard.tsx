import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationAPI, certificateAPI } from '../../services/api';
import type { Application, Certificate } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import { CERTIFICATE_TYPES } from '../../components/user/ApplicationForm/CertificateTypeSelector';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const StatSkeleton = () => (
  <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm">
    <div className="skeleton h-6 w-16 mb-2 rounded bg-slate-200" />
    <div className="skeleton h-9 w-12 mb-1 rounded bg-slate-200" />
    <div className="skeleton h-3 w-24 rounded bg-slate-200" />
  </div>
);

const RowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0 bg-slate-200" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-4 w-32 rounded bg-slate-200" />
      <div className="skeleton h-3 w-20 rounded bg-slate-200" />
    </div>
    <div className="skeleton h-6 w-20 rounded-full bg-slate-200" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appsRes, certsRes] = await Promise.allSettled([
          applicationAPI.getAll({ limit: '20' } as any),
          certificateAPI.getAll(),
        ]);
        if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
          setApplications(appsRes.value.data.data?.applications || []);
        }
        if (certsRes.status === 'fulfilled' && certsRes.value.data.success) {
          setCertificates(certsRes.value.data.data?.certificates || []);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending' || a.status === 'under_review').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const underReview = applications.some((a) => a.status === 'under_review');
  const recent = applications.slice(0, 5);

  const statCards = [
    { label: 'Total', labelNp: 'जम्मा', value: counts.total, icon: '📋', color: 'border-blue-500/30 bg-blue-500/5', textColor: 'text-blue-400' },
    { label: 'Pending', labelNp: 'विचाराधीन', value: counts.pending, icon: '⏳', color: 'border-amber-500/30 bg-amber-500/5', textColor: 'text-amber-400' },
    { label: 'Approved', labelNp: 'स्वीकृत', value: counts.approved, icon: '✅', color: 'border-emerald-500/30 bg-emerald-500/5', textColor: 'text-emerald-400' },
    { label: 'Rejected', labelNp: 'अस्वीकृत', value: counts.rejected, icon: '❌', color: 'border-red-500/30 bg-red-500/5', textColor: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">
                नमस्ते, {user?.fullName.split(' ')[0]}! 🙏
              </h1>
              <p className="text-slate-500 text-sm">
                Welcome to your Smart Government dashboard
              </p>
            </div>
            <Link to="/apply" className="btn-secondary flex items-center gap-2 shadow-sm">
              ➕ New Application
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Under Review Notification Banner */}
        {!isLoading && underReview && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-6
                          flex items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200
                            flex items-center justify-center flex-shrink-0 animate-pulse text-xl">
              🔍
            </div>
            <div>
              <p className="text-blue-700 font-semibold">आपको आवेदन समीक्षाधीन छ</p>
              <p className="text-blue-600 text-sm">Your application is currently under review — we'll notify you soon.</p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
            : statCards.map((card) => (
                <div
                  key={card.label}
                  className={`bg-white p-5 border border-slate-200 rounded-3xl shadow-sm ${card.color.replace('500/5', '50').replace('500/30', '200')}
                               hover:-translate-y-0.5 transition-all duration-200 cursor-default`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{card.icon}</span>
                    <span className={`text-3xl font-extrabold ${card.textColor.replace('400', '600')}`}>{card.value}</span>
                  </div>
                  <p className="text-slate-800 text-sm font-semibold">{card.label}</p>
                  <p className="text-slate-500 text-xs">{card.labelNp}</p>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">📋 Recent Applications</h2>
              <Link to="/applications" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array(3).fill(0).map((_, i) => <RowSkeleton key={i} />)}</div>
            ) : recent.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-slate-400 font-medium mb-1">No applications yet</p>
                <p className="text-slate-500 text-sm mb-5">Apply for your first certificate below</p>
                <Link to="/apply" className="btn-primary text-sm">Apply Now</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recent.map((app) => (
                  <Link
                    key={app._id}
                    to={`/applications/${app._id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white
                               border border-slate-200 hover:border-primary-300 hover:bg-slate-50
                               transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 text-blue-600 flex items-center justify-center
                                      flex-shrink-0 text-lg">
                        {CERTIFICATE_TYPES.find((c) => c.id === app.certificateType)?.icon || '📋'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 font-semibold text-sm group-hover:text-primary-600 transition-colors">
                          {app.applicationNumber}
                        </p>
                        <p className="text-slate-500 text-xs capitalize">
                          {app.certificateType} · {new Date(app.createdAt).toLocaleDateString('en-NP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <StatusBadge status={app.status} size="sm" />
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Certificates */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">🎖️ My Certificates</h2>
                <Link to="/certificates" className="text-primary-600 hover:text-primary-700 text-xs">
                  View all
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">{Array(2).fill(0).map((_, i) => <RowSkeleton key={i} />)}</div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🎖️</div>
                  <p className="text-slate-500 text-xs">No certificates yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {certificates.slice(0, 3).map((cert) => {
                    const expired = new Date() > new Date(cert.expiryDate);
                    return (
                      <div key={cert._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="min-w-0">
                          <p className="text-slate-800 text-xs font-medium truncate max-w-[120px] capitalize">
                            {cert.certificateType}
                          </p>
                          <p className="text-slate-500 text-xs font-mono truncate">{cert.certificateNumber}</p>
                        </div>
                        <StatusBadge status={!cert.isValid || expired ? 'expired' : 'valid'} size="sm" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Apply Grid */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-base font-bold text-slate-800 mb-4">⚡ Quick Apply</h2>
              <div className="grid grid-cols-2 gap-2">
                {CERTIFICATE_TYPES.map((cert) => (
                  <Link
                    key={cert.id}
                    to={`/apply?type=${cert.id}`}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50
                                hover:scale-105 hover:bg-slate-100 hover:border-slate-300 transition-all text-center group`}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{cert.icon}</span>
                    <span className="text-slate-800 text-xs font-medium leading-tight">{cert.labelNepali}</span>
                    <span className="text-slate-500 text-xs">{cert.days}d</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
