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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user?.fullName}</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm text-slate-500">Avg. Processing Time:</span>
            <span className="text-lg font-bold text-primary-400">{avgProcessingDays} Days</span>
          </div>
        </div>

        {/* 1. Stats Overview Row - 6 cards: 2 col on mobile, 3 on md, 6 on lg */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="stat-card border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Total Apps</span>
              <span className="text-blue-500 text-xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats?.total || 0}</div>
          </div>
          
          <Link to="/admin/applications?status=pending" className="stat-card border-amber-200 hover:bg-amber-50 transition-colors block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-600 text-sm font-medium">Pending Review</span>
              <span className="text-amber-500 text-xl animate-pulse">⏳</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats?.pending || 0}</div>
          </Link>

          <div className="stat-card border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Approved Today</span>
              <span className="text-emerald-500 text-xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats?.approvedToday || 0}</div>
          </div>

          <div className="stat-card border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Rejected</span>
              <span className="text-red-500 text-xl">❌</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats?.rejected || 0}</div>
          </div>

          <div className="stat-card border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Total Users</span>
              <span className="text-purple-500 text-xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{totalUsers}</div>
          </div>

          <Link to="/admin/applications?status=pending" className="stat-card border-red-200 hover:bg-red-50 transition-colors block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-500 text-sm font-medium flex items-center gap-1">⚠ Flagged</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats?.flaggedCount || 0}</div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 2. Priority Queue */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <span>⚡</span> Action Required: Priority Queue
                </h2>
                <Link to="/admin/applications?status=pending" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                  View All Pending →
                </Link>
              </div>
              <div className="p-0">
                {priorityLoading ? (
                  <div className="py-8 text-center"><Loader size="sm" text="Loading priority items..." /></div>
                ) : priorityQueue.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <span className="text-4xl mb-3 block">🎉</span>
                    No pending applications. Great job!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {priorityQueue.map((app) => {
                          const waitDays = Math.floor((new Date().getTime() - new Date(app.createdAt).getTime()) / (1000 * 3600 * 24));
                          const waitColor = waitDays > 7 ? 'text-red-500 font-bold' : waitDays > 3 ? 'text-amber-500' : 'text-emerald-500';
                          
                          return (
                            <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-primary-600">{app.applicationNumber}</td>
                              <td className="px-6 py-4">
                                <div className="text-slate-800 font-medium">{typeof app.userId === 'object' ? app.userId.fullName : 'Unknown'}</div>
                                <div className="text-slate-500 text-xs capitalize">{app.certificateType} Certificate</div>
                              </td>
                              <td className="px-6 py-4">
                                {app.priority === 'urgent' && <span className="badge bg-red-50 text-red-600 border border-red-200 mb-1 block w-max">Urgent</span>}
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
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Certificate Type Distribution</h2>
              
              {certDistribution.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No data available.</p>
              ) : (
                <div className="space-y-4">
                  {certDistribution.map((cert) => {
                    const percentage = Math.round((cert.count / maxCerts) * 100);
                    return (
                      <div key={cert._id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 font-medium capitalize">{cert._id}</span>
                          <span className="text-slate-500">{cert.count} apps</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
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
              <div className="bg-white p-6 border border-indigo-100 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-indigo-600 mb-6 flex items-center gap-2">
                  <span>🧠</span> Smart Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Most Requested</p>
                    <p className="text-slate-800 font-medium capitalize text-lg">{certDistribution[0]?._id || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Busiest Area</p>
                    <p className="text-slate-800 font-medium capitalize text-lg">{insights.busiestMunicipality}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Approval Rate</p>
                    <div className="flex items-end gap-2">
                      <p className="text-emerald-600 font-bold text-xl">{insights.approvalRate}%</p>
                      <p className="text-red-500 text-xs mb-1">({insights.rejectionRate}% rejected)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* 3. Recent Activity Feed */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-full">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span>📝</span> Recent Activity
              </h2>
              
              {recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">No recent activity.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        activity.action === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}></div>
                      
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1 flex justify-between">
                          <span className="font-medium text-slate-800">{activity.adminName}</span>
                          <span>{new Date(activity.time).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {activity.action === 'approved' ? (
                            <span>Approved <span className="text-emerald-600 capitalize font-medium">{activity.certificateType}</span> for {activity.applicantName}</span>
                          ) : (
                            <span>Rejected <span className="text-red-600 capitalize font-medium">{activity.certificateType}</span> for {activity.applicantName}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-1">{activity.applicationNumber}</p>
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
