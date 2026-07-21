import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import type { User } from '../../types';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';

const ManageUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params: any = { limit, page };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      if (search) params.search = search;

      const res = await adminAPI.getAllUsers(params);
      if (res.data.success && res.data.data) {
        setUsers(res.data.data.users || []);
        setTotal((res.data.data.pagination as any)?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
      setFetchError('Failed to load users. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleStatus = async (userId: string) => {
    setActionLoading(userId);
    setToggleError(null);
    try {
      const res = await adminAPI.toggleUserStatus(userId);
      if (res.data.success) {
        // Update local state instead of re-fetching to be faster
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
      }
    } catch (error: any) {
      console.error('Failed to toggle user status', error);
      setToggleError(error?.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Quick stats derived from current list (for the top cards)
  // In a real app with large data, these should come from a separate API call for global stats
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-purple-600">👥</span> Manage Users
          </h1>
          <p className="text-slate-500 text-sm mt-1">View and manage all registered citizens and administrators</p>
        </div>

        {/* Error Banners */}
        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <p className="text-red-400 text-sm">{fetchError}</p>
            </div>
            <button onClick={fetchUsers} className="btn-outline py-1.5 px-4 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10">
              Retry
            </button>
          </div>
        )}
        {toggleError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-red-400 text-sm">⚠️ {toggleError}</p>
            <button onClick={() => setToggleError(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active (Current Page)</p>
            <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Inactive (Current Page)</p>
            <p className="text-2xl font-bold text-slate-800">{inactiveCount}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admins (Current Page)</p>
            <p className="text-2xl font-bold text-slate-800">{adminCount}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 uppercase">Role:</span>
                <select 
                  value={roleFilter} 
                  onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Citizen (User)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 uppercase">Status:</span>
                <select 
                  value={statusFilter} 
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative min-w-[250px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name or email..."
                className="form-input pl-10 h-full py-2 text-sm"
              />
              {search && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white overflow-hidden rounded-3xl shadow-sm border border-slate-200">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader size="md" text="Loading users..." /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-50">👥</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Users Found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="table-header text-left pl-6">Citizen</th>
                      <th className="table-header text-left">Contact Info</th>
                      <th className="table-header text-left">Role</th>
                      <th className="table-header text-left">Status</th>
                      <th className="table-header text-left">Joined</th>
                      <th className="table-header text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = currentUser?._id === u._id;
                      const isAdmin = u.role === 'admin';
                      const canToggle = !isSelf && !isAdmin;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-0">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-white/10 shrink-0">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-slate-800 font-medium flex items-center gap-2">
                                  {u.fullName}
                                  {isSelf && <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded uppercase font-bold border border-primary-200">You</span>}
                                </p>
                                <p className="text-slate-500 text-xs font-mono">{u._id.substring(u._id.length - 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-slate-700">{u.email}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{u.phone || 'No phone'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize border ${
                              isAdmin
                                ? 'bg-purple-50 text-purple-600 border-purple-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></span>
                              <span className={`text-xs font-bold ${u.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-500 text-xs">
                            {new Date(u.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleToggleStatus(u._id)}
                              disabled={!canToggle || actionLoading === u._id}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border flex items-center justify-center min-w-[90px] ml-auto ${
                                !canToggle 
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : u.isActive
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-500 hover:text-white'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white'
                              }`}
                              title={isAdmin ? "Cannot deactivate admins" : isSelf ? "Cannot deactivate yourself" : `Click to ${u.isActive ? 'deactivate' : 'activate'}`}
                            >
                              {actionLoading === u._id ? (
                                <span className="animate-pulse">...</span>
                              ) : !canToggle ? (
                                '🔒 Locked'
                              ) : u.isActive ? (
                                'Deactivate'
                              ) : (
                                'Activate'
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-800">{(page - 1) * limit + 1}</span> to <span className="font-medium text-slate-800">{Math.min(page * limit, total)}</span> of <span className="font-medium text-slate-800">{total}</span> users
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                    >
                      ← Prev
                    </button>
                    
                    <span className="text-sm px-2 text-slate-500">Page {page} of {totalPages}</span>

                    <button 
                      onClick={() => setPage(page + 1)}
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

export default ManageUsers;
