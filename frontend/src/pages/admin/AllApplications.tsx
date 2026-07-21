import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import type { Application, ApplicationStatus } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import { Download, Search, Filter } from 'lucide-react'; // Need to add lucide-react if we use these, but let's just use emojis/svgs for now to avoid dependency issues.

const STATUSES: (ApplicationStatus | 'all')[] = ['all', 'pending', 'under_review', 'approved', 'rejected', 'draft'];

const AllApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>({});
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const statusFilter = (searchParams.get('status') || 'all') as ApplicationStatus | 'all';
  const typeFilter = searchParams.get('certificateType') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const search = searchParams.get('search') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Search input local state to prevent spamming API on every keystroke
  const [localSearch, setLocalSearch] = useState(search);

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit, page };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.certificateType = typeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await adminAPI.getAllApplications(params);
      if (res.data.success) {
        setApplications(res.data.data?.applications || []);
        setTotal((res.data.data?.pagination as any)?.total || 0);
        setStats((res.data.data as any)?.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchApps(); 
    // Clear selection on page/filter change
    setSelectedIds([]);
  }, [statusFilter, typeFilter, priorityFilter, search, dateFrom, dateTo, page, limit]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || !value) params.delete(key);
    else params.set(key, value);
    params.delete('page'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('search', localSearch);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select pending items for bulk "under review"
      setSelectedIds(applications.filter(a => a.status === 'pending').map(a => a._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUnderReview = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      // Process sequentially to avoid overwhelming server
      for (const id of selectedIds) {
        await adminAPI.setUnderReview(id);
      }
      // Refresh
      fetchApps();
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk update failed', error);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    if (applications.length === 0) return;
    
    // Create CSV header
    const headers = ['App Number', 'Applicant Name', 'Type', 'Priority', 'Status', 'Submitted Date'];
    
    // Create rows
    const rows = applications.map(app => {
      const user = typeof app.userId === 'object' ? app.userId as any : {};
      return [
        app.applicationNumber,
        `"${user.fullName || ''}"`,
        app.certificateType,
        app.priority,
        app.status,
        new Date(app.createdAt).toISOString().split('T')[0]
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / limit);
  const isAllSelected = applications.length > 0 && selectedIds.length === applications.filter(a => a.status === 'pending').length && applications.filter(a => a.status === 'pending').length > 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-primary-600">📋</span> Application Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Review and manage all certificate requests ({total} total)
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="btn-outline py-2 px-4 flex items-center gap-2 text-sm" disabled={applications.length === 0}>
              <span>📥</span> Export CSV
            </button>
            <Link to="/admin" className="btn-ghost py-2">Dashboard</Link>
          </div>
        </div>

        {/* Top Filters & Search Bar */}
        <div className="bg-white p-5 mb-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter('status', s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all border ${
                    statusFilter === s
                      ? 'bg-primary-600/20 text-primary-600 border-primary-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                  {s !== 'all' && stats[s] !== undefined && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${statusFilter === s ? 'bg-primary-600/40 text-slate-800' : 'bg-slate-200 text-slate-600'}`}>
                      {stats[s]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[300px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search app number or applicant name..."
                className="form-input pl-10 h-full py-2.5 text-sm"
              />
              {localSearch && (
                <button type="button" onClick={() => { setLocalSearch(''); setFilter('search', ''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 uppercase">Type:</span>
              <select 
                value={typeFilter} 
                onChange={e => setFilter('certificateType', e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="birth">Birth</option>
                <option value="citizenship">Citizenship</option>
                <option value="residence">Residence</option>
                <option value="marriage">Marriage</option>
                <option value="death">Death</option>
                <option value="income">Income</option>
                <option value="character">Character</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 uppercase">Priority:</span>
              <select 
                value={priorityFilter} 
                onChange={e => setFilter('priority', e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary-500"
              >
                <option value="all">All</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-slate-600 uppercase">Date Range:</span>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setFilter('dateFrom', e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-primary-500"
              />
              <span className="text-slate-600">-</span>
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setFilter('dateTo', e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 mb-4 flex justify-between items-center animate-fade-in">
            <span className="text-primary-700 text-sm font-medium">
              {selectedIds.length} application(s) selected
            </span>
            <button 
              onClick={handleBulkUnderReview}
              disabled={actionLoading}
              className="btn-primary py-1.5 px-4 text-sm bg-primary-600/80 hover:bg-primary-500"
            >
              {actionLoading ? 'Processing...' : 'Mark as Under Review'}
            </button>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white overflow-hidden rounded-3xl shadow-sm border border-slate-200">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader size="md" text="Loading applications..." /></div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Applications Found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
              {(statusFilter !== 'all' || search || typeFilter !== 'all') && (
                <button 
                  onClick={() => setSearchParams({})} 
                  className="mt-4 btn-outline py-2 text-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-4 text-left w-10">
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          disabled={applications.filter(a => a.status === 'pending').length === 0}
                          className="w-4 h-4 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 focus:ring-offset-white"
                        />
                      </th>
                      <th className="table-header text-left">App Number</th>
                      <th className="table-header text-left">Applicant</th>
                      <th className="table-header text-left">Type</th>
                      <th className="table-header text-left">Priority</th>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Status</th>
                      <th className="table-header text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const userObj = typeof app.userId === 'object' ? app.userId as any : null;
                      const isPending = app.status === 'pending';
                      
                      return (
                        <tr key={app._id} className="hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-0">
                          <td className="px-4 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(app._id)}
                              onChange={() => handleSelectOne(app._id)}
                              disabled={!isPending}
                              className="w-4 h-4 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 focus:ring-offset-white disabled:opacity-30"
                            />
                          </td>
                          <td className="table-cell font-mono text-primary-600 font-medium">
                            {app.applicationNumber}
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className="text-slate-800 font-medium flex items-center gap-2">
                                {userObj?.fullName || '—'}
                                {app.flaggedForReview && (
                                  <span className="text-red-400 text-[10px] font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30" title={app.flagReasons?.join('\n')}>
                                    ⚠ Flagged
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-500 text-xs">{userObj?.email || ''}</p>
                            </div>
                          </td>
                          <td className="table-cell capitalize font-medium text-slate-600">
                            {app.certificateType}
                          </td>
                          <td className="table-cell">
                            {app.priority === 'urgent' ? (
                              <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded border border-red-500/20">⚡ URGENT</span>
                            ) : (
                              <span className="text-slate-500 text-xs">Normal</span>
                            )}
                          </td>
                          <td className="table-cell text-slate-500 text-xs">
                            {new Date(app.createdAt).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric'})}
                          </td>
                          <td className="table-cell">
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td className="table-cell text-right pr-6">
                            <Link
                              to={`/admin/applications/${app._id}`}
                              className="btn-outline py-1.5 px-3 text-xs whitespace-nowrap bg-slate-50 hover:bg-primary-600 hover:text-white"
                            >
                              Review →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-200">
                {applications.map(app => {
                  const userObj = typeof app.userId === 'object' ? app.userId as any : null;
                  return (
                    <div key={app._id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-primary-600 font-medium text-sm block mb-1">
                            {app.applicationNumber}
                            {app.flaggedForReview && (
                              <span className="ml-2 text-red-400 text-[10px] font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                                ⚠ Flagged
                              </span>
                            )}
                          </span>
                          <StatusBadge status={app.status} size="sm" />
                        </div>
                        {app.priority === 'urgent' && (
                          <span className="text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">⚡ URGENT</span>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-slate-800 font-medium">{userObj?.fullName || '—'}</p>
                        <p className="text-slate-500 text-xs capitalize">{app.certificateType} Certificate</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 text-xs">{new Date(app.createdAt).toLocaleDateString()}</span>
                        <Link to={`/admin/applications/${app._id}`} className="text-primary-600 text-sm font-semibold">
                          Review →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-800">{(page - 1) * limit + 1}</span> to <span className="font-medium text-slate-800">{Math.min(page * limit, total)}</span> of <span className="font-medium text-slate-800">{total}</span> results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setFilter('page', String(page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                    >
                      ← Prev
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show pages around current page
                        let pageNum = page;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = page - 2 + i;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setFilter('page', String(pageNum))}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors border ${
                              page === pageNum
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => setFilter('page', String(page + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllApplications;
