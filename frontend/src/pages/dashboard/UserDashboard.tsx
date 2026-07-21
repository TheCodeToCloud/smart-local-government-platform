import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationAPI, certificateAPI } from '../../services/api';
import type { Application, Certificate, DashboardStats } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, pending: 0, under_review: 0, approved: 0, rejected: 0, thisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, certsRes] = await Promise.allSettled([
          applicationAPI.getAll({ limit: 5 }),
          certificateAPI.getAll(),
        ]);

        if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
          const apps = appsRes.value.data.data?.applications || [];
          setApplications(apps);

          // Compute stats from fetched apps
          const allApps = apps;
          setStats({
            total: allApps.length,
            pending: allApps.filter(a => a.status === 'pending').length,
            under_review: allApps.filter(a => a.status === 'under_review').length,
            approved: allApps.filter(a => a.status === 'approved').length,
            rejected: allApps.filter(a => a.status === 'rejected').length,
            thisMonth: allApps.filter(a => {
              const d = new Date(a.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length,
          });
        }

        if (certsRes.status === 'fulfilled' && certsRes.value.data.success) {
          setCertificates(certsRes.value.data.data?.certificates || []);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Applications', value: stats.total, icon: '📋', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', textColor: 'text-blue-400' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', textColor: 'text-amber-400' },
    { label: 'Under Review', value: stats.under_review, icon: '🔍', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', textColor: 'text-purple-400' },
    { label: 'Approved', value: stats.approved, icon: '✅', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', textColor: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-teal-600 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Welcome back, {user?.fullName.split(' ')[0]}! 👋
              </h1>
              <p className="text-blue-200 text-sm">
                Here's an overview of your government service applications
              </p>
            </div>
            <Link to="/apply" className="btn-secondary flex items-center gap-2">
              ➕ New Application
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label}
              className={`bg-white border ${card.border} p-5 rounded-2xl shadow-sm
                          hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className={`text-3xl font-bold ${card.textColor}`}>{card.value}</span>
              </div>
              <p className="text-slate-400 text-xs font-medium">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                📋 Recent Applications
              </h2>
              <Link to="/applications" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
                View all →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-slate-400 font-medium mb-2">No applications yet</p>
                <p className="text-slate-500 text-sm mb-6">Start by applying for your first certificate</p>
                <Link to="/apply" className="btn-primary text-sm">Apply Now</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <Link
                    key={app._id}
                    to={`/applications/${app._id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50
                               border border-slate-100 hover:border-primary-300 hover:bg-slate-100
                               transition-all duration-200 group"
                  >
                    <div className="min-w-0">
                      <p className="text-slate-800 font-medium text-sm group-hover:text-primary-600 transition-colors truncate">
                        {app.applicationNumber}
                      </p>
                      <p className="text-slate-500 text-xs capitalize mt-0.5">
                        {app.certificateType} Certificate
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <StatusBadge status={app.status} size="sm" />
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-4">⚡ Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { to: '/apply', icon: '📝', label: 'New Application', color: 'text-blue-400' },
                  { to: '/applications', icon: '📋', label: 'View Applications', color: 'text-purple-400' },
                  { to: '/certificates', icon: '🎖️', label: 'My Certificates', color: 'text-emerald-400' },
                  { to: '/profile', icon: '👤', label: 'Edit Profile', color: 'text-amber-400' },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                               transition-colors group"
                  >
                    <span className={`text-lg group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </span>
                    <span className={`text-sm font-medium ${action.color}`}>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">🎖️ My Certificates</h2>
                <Link to="/certificates" className="text-primary-400 hover:text-primary-300 text-xs">
                  View all
                </Link>
              </div>

              {certificates.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🎖️</div>
                  <p className="text-slate-500 text-xs">No certificates yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {certificates.slice(0, 3).map((cert) => (
                    <div key={cert._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-slate-800 text-xs font-medium truncate max-w-[120px]">
                          {cert.certificateNumber}
                        </p>
                        <p className="text-slate-500 text-xs capitalize">{cert.certificateType}</p>
                      </div>
                      <StatusBadge status={cert.isValid ? 'valid' : 'expired'} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-4">👤 Account Info</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="text-slate-800 font-medium truncate max-w-[140px]">{user?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-800 truncate max-w-[140px] text-xs">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="text-primary-600 font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="text-emerald-600 font-medium">Active ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
