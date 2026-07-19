import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import type { DashboardStats, RecentActivity, DashboardInsights } from '../../types';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [certDistribution, setCertDistribution] = useState<any[]>([]);
  const [avgProcessingDays, setAvgProcessingDays] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SMART FEATURE: Priority Queue (Top urgent/old pending)
  const [priorityQueue, setPriorityQueue] = useState<any[]>([]);
  const [priorityLoading, setPriorityLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.data.success && res.data.data) {
          const { stats: fetchedStats, recentActivity, certTypeDistribution, avgProcessingDays, totalUsers, insights } = res.data.data;
          setStats(fetchedStats);
          setRecentActivity(recentActivity || []);
          setCertDistribution(certTypeDistribution || []);
          setAvgProcessingDays(avgProcessingDays || 0);
          setTotalUsers(totalUsers || 0);
          setInsights(insights || null);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPriorityQueue = async () => {
      try {
        const res = await adminAPI.getAllApplications({
          status: 'pending',
          limit: 5,
        });
        // We rely on backend sorting (urgent first, then oldest)
        if (res.data.success && res.data.data) {
          setPriorityQueue(res.data.data.applications);
        }
      } catch (error) {
        console.error('Failed to fetch priority queue:', error);
      } finally {
        setPriorityLoading(false);
      }
    };

    fetchDashboardData();
    fetchPriorityQueue();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader size="lg" text="Loading Admin Dashboard..." />
      </div>
    );
  }

  // Bar Chart calculations
  const maxCerts = Math.max(...certDistribution.map(c => c.count), 1);

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Welcome back, {user?.fullName}</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-sm text-slate-400">Avg. Processing Time:</span>
            <span className="text-lg font-bold text-primary-400">{avgProcessingDays} Days</span>
          </div>
        </div>

        {/* 1. Stats Overview Row - 6 cards: 2 col on mobile, 3 on md, 6 on lg */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card-dark p-5 border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Total Apps</span>
              <span className="text-blue-400 text-xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
          </div>
          
          <Link to="/admin/applications?status=pending" className="glass-card-dark p-5 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-400 text-sm font-medium">Pending Review</span>
              <span className="text-amber-400 text-xl animate-pulse">⏳</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.pending || 0}</div>
          </Link>

          <div className="glass-card-dark p-5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Approved Today</span>
              <span className="text-emerald-400 text-xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.approvedToday || 0}</div>
          </div>

          <div className="glass-card-dark p-5 border-red-500/20 hover:border-red-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Rejected</span>
              <span className="text-red-400 text-xl">❌</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.rejected || 0}</div>
          </div>

          <div className="glass-card-dark p-5 border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Total Users</span>
              <span className="text-purple-400 text-xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
          </div>

          <Link to="/admin/applications?status=pending" className="glass-card-dark p-5 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-sm font-medium flex items-center gap-1">⚠ Flagged</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.flaggedCount || 0}</div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 2. Priority Queue */}
            <div className="glass-card-dark border border-amber-500/20 overflow-hidden">
              <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex justify-between items-center">
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <span>⚡</span> Action Required: Priority Queue
                </h2>
                <Link to="/admin/applications?status=pending" className="text-xs text-amber-400/80 hover:text-amber-400 font-medium">
                  View All Pending →
                </Link>
              </div>
              <div className="p-0">
                {priorityLoading ? (
                  <div className="py-8 text-center"><Loader size="sm" text="Loading priority items..." /></div>
                ) : priorityQueue.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <span className="text-4xl mb-3 block">🎉</span>
                    No pending applications. Great job!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {priorityQueue.map((app) => {
                          const waitDays = Math.floor((new Date().getTime() - new Date(app.createdAt).getTime()) / (1000 * 3600 * 24));
                          const waitColor = waitDays > 7 ? 'text-red-400 font-bold' : waitDays > 3 ? 'text-amber-400' : 'text-emerald-400';
                          
                          return (
                            <tr key={app._id} className="border-b border-slate-700/30 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-mono text-primary-400">{app.applicationNumber}</td>
                              <td className="px-6 py-4">
                                <div className="text-white font-medium">{typeof app.userId === 'object' ? app.userId.fullName : 'Unknown'}</div>
                                <div className="text-slate-500 text-xs capitalize">{app.certificateType} Certificate</div>
                              </td>
                              <td className="px-6 py-4">
                                {app.priority === 'urgent' && <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 mb-1 block w-max">Urgent</span>}
                                <span className={`text-xs ${waitColor}`}>Waiting {waitDays} day{waitDays !== 1 && 's'}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Link to={`/admin/applications/${app._id}`} className="btn-primary py-1.5 px-4 text-xs">
                                  Review Now
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Certificate Type Distribution (Pure CSS Chart) */}
            <div className="glass-card-dark p-6">
              <h2 className="text-lg font-bold text-white mb-6">Certificate Type Distribution</h2>
              
              {certDistribution.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No data available.</p>
              ) : (
                <div className="space-y-4">
                  {certDistribution.map((cert) => {
                    const percentage = Math.round((cert.count / maxCerts) * 100);
                    return (
                      <div key={cert._id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300 font-medium capitalize">{cert._id}</span>
                          <span className="text-slate-400">{cert.count} apps</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-primary-600 to-secondary-500 h-2.5 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Insights Panel */}
            {insights && (
              <div className="glass-card-dark p-6 border-indigo-500/20">
                <h2 className="text-lg font-bold text-indigo-400 mb-6 flex items-center gap-2">
                  <span>🧠</span> Smart Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Most Requested</p>
                    <p className="text-white font-medium capitalize text-lg">{certDistribution[0]?._id || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Busiest Area</p>
                    <p className="text-white font-medium capitalize text-lg">{insights.busiestMunicipality}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Approval Rate</p>
                    <div className="flex items-end gap-2">
                      <p className="text-emerald-400 font-bold text-xl">{insights.approvalRate}%</p>
                      <p className="text-red-400 text-xs mb-1">({insights.rejectionRate}% rejected)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* 3. Recent Activity Feed */}
            <div className="glass-card-dark p-6 h-full">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>📝</span> Recent Activity
              </h2>
              
              {recentActivity.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">No recent activity.</p>
              ) : (
                <div className="relative border-l-2 border-slate-700/50 ml-3 space-y-6">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                        activity.action === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}></div>
                      
                      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1 flex justify-between">
                          <span className="font-medium text-white">{activity.adminName}</span>
                          <span>{new Date(activity.time).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-300">
                          {activity.action === 'approved' ? (
                            <span>Approved <span className="text-emerald-400 capitalize">{activity.certificateType}</span> for {activity.applicantName}</span>
                          ) : (
                            <span>Rejected <span className="text-red-400 capitalize">{activity.certificateType}</span> for {activity.applicantName}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1">{activity.applicationNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
