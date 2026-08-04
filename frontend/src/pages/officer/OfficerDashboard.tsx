import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { officerAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import type { Application } from '../../types';

const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, verified: 0, returned: 0 });
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([
          officerAPI.getStats(),
          officerAPI.getApplications()
        ]);
        
        if (statsRes.data.success) {
          setStats(statsRes.data.data as any);
        }
        
        if (appsRes.data.success && appsRes.data.data) {
          // Just take the top 5 most recent pending applications
          setRecentApps((appsRes.data.data as Application[]).slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching officer dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Officer Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.fullName}. Here is your verification queue.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/officer/duplicate-requests"
            className="btn-outline border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 py-2 px-6 flex items-center gap-2 rounded-xl whitespace-nowrap"
          >
            <span>⚠️</span> Duplicate Requests
          </Link>
          <Link
            to="/officer/applications"
            className="btn-primary py-2 px-6 flex items-center gap-2 rounded-xl whitespace-nowrap"
          >
            <span>📋</span> Go to Review Queue
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/officer/applications?status=pending" className="block bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-10 group-hover:bg-amber-500/20 transition-colors"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">To Verify</p>
          <p className="text-4xl font-extrabold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-slate-400 mt-2">Applications waiting for your review</p>
        </Link>
        <Link to="/officer/applications?status=verified" className="block bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Verified</p>
          <p className="text-4xl font-extrabold text-emerald-600">{stats.verified}</p>
          <p className="text-xs text-slate-400 mt-2">Applications verified by you</p>
        </Link>
        <Link to="/officer/applications?status=returned" className="block bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-red-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -z-10 group-hover:bg-red-500/20 transition-colors"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Returned</p>
          <p className="text-4xl font-extrabold text-red-500">{stats.returned}</p>
          <p className="text-xs text-slate-400 mt-2">Sent back for correction</p>
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Recent Pending Applications</h2>
          <Link to="/officer/applications" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        
        {recentApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-slate-800 font-bold mb-1">All caught up!</h3>
            <p className="text-slate-500 text-sm">There are no pending applications to verify right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">App Number</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Applicant</th>
                  <th className="p-4 font-semibold">Date Submitted</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentApps.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{app.applicationNumber}</td>
                    <td className="p-4 capitalize">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {app.certificateType}
                      </span>
                    </td>
                    <td className="p-4">
                      {app.applicantDetails?.fullName || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/officer/applications`} // Ideally links to the specific detail, assuming /officer/applications handles it
                        className="text-primary-600 font-medium hover:text-primary-800 text-sm bg-primary-50 px-3 py-1.5 rounded-lg"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;
