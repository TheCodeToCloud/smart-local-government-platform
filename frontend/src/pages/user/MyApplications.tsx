import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applicationAPI } from '../../services/api';
import type { Application, ApplicationStatus } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import { CERTIFICATE_TYPES } from '../../components/user/ApplicationForm/CertificateTypeSelector';

const STATUS_FILTERS: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Draft', value: 'draft' },
];

const MyApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const status = (searchParams.get('status') || 'all') as ApplicationStatus | 'all';
  const certType = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params: Record<string, string | number> = { limit: 10, page };
      if (status !== 'all') params.status = status;
      if (certType !== 'all') params.certificateType = certType;

      const res = await applicationAPI.getAll(params as any);
      if (res.data.success) {
        const apps = res.data.data?.applications || [];
        const filtered = searchQuery
          ? apps.filter((a) =>
              a.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : apps;
        setApplications(filtered);
        setTotal(res.data.data?.total ?? 0);
        setTotalPages((res.data.data as any)?.totalPages ?? 1);
      }
    } catch (error) {
      console.error('Failed to load applications', error);
      setFetchError('Failed to load applications. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [status, certType, page, searchQuery]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') p.delete(key);
    else p.set(key, value);
    p.delete('page');
    setSearchParams(p);
  };

  const setPage = (n: number) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', String(n));
    setSearchParams(p);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📋 My Applications</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLoading ? 'Loading...' : `${total} application${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link to="/apply" className="btn-primary">➕ New Application</Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-5 mb-6 space-y-4 rounded-3xl shadow-sm border border-slate-200">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by application number..."
              className="form-input pl-10"
            />
          </div>

          {/* Status filter chips */}
          <div>
            <p className="text-xs text-slate-600 font-medium uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setParam('status', f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    status === f.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Certificate type filter */}
          <div>
            <p className="text-xs text-slate-600 font-medium uppercase tracking-wider mb-2">Certificate Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setParam('type', 'all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  certType === 'all'
                    ? 'bg-secondary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                All Types
              </button>
              {CERTIFICATE_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setParam('type', ct.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${
                    certType === ct.id
                      ? 'bg-secondary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span>{ct.icon}</span> {ct.labelEnglish}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader size="md" text="Loading applications..." />
          </div>
        ) : fetchError ? (
          <div className="bg-white p-16 text-center rounded-3xl shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Could Not Load Applications</h3>
            <p className="text-slate-500 mb-6">{fetchError}</p>
            <button onClick={fetchApplications} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-3xl shadow-sm border border-slate-200">
            <div className="text-7xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Applications Found</h3>
            <p className="text-slate-500 mb-6">
              {status !== 'all' || certType !== 'all' || searchQuery
                ? 'Try adjusting your filters.'
                : 'You haven\'t applied for any certificates yet.'}
            </p>
            <Link to="/apply" className="btn-primary">Apply for Certificate</Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="bg-white overflow-hidden mb-5 hidden md:block rounded-3xl shadow-sm border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-header text-left">App. Number</th>
                    <th className="table-header text-left">Certificate Type</th>
                    <th className="table-header text-left">Date</th>
                    <th className="table-header text-left">Est. Completion</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const ct = CERTIFICATE_TYPES.find((c) => c.id === app.certificateType);
                    return (
                      <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-cell font-mono text-primary-600 font-semibold">
                          {app.applicationNumber}
                        </td>
                        <td className="table-cell">
                          <span className="flex items-center gap-2 capitalize">
                            <span>{ct?.icon}</span> {app.certificateType}
                          </span>
                        </td>
                        <td className="table-cell text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString('en-NP')}
                        </td>
                        <td className="table-cell text-slate-500">
                          {app.estimatedCompletionDate
                            ? new Date(app.estimatedCompletionDate).toLocaleDateString('en-NP')
                            : '—'}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={app.status} size="sm" />
                        </td>
                        <td className="table-cell">
                          <Link
                            to={`/applications/${app._id}`}
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium whitespace-nowrap"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden mb-5">
              {applications.map((app) => {
                const ct = CERTIFICATE_TYPES.find((c) => c.id === app.certificateType);
                return (
                  <Link
                    key={app._id}
                    to={`/applications/${app._id}`}
                    className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-2xl
                               hover:border-primary-300 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 text-blue-600 flex items-center justify-center
                                    text-xl flex-shrink-0">
                      {ct?.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-600 font-mono font-semibold text-sm">
                        {app.applicationNumber}
                      </p>
                      <p className="text-slate-500 text-xs capitalize mt-0.5">
                        {app.certificateType} · {new Date(app.createdAt).toLocaleDateString('en-NP')}
                      </p>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-ghost disabled:opacity-40 py-2 px-4 text-sm"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        p === page
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-ghost disabled:opacity-40 py-2 px-4 text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
