import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';

const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, verified: 0, returned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/officer/applications', {
          withCredentials: true,
        });
        if (response.data.success) {
          setStats({
            pending: response.data.count,
            verified: 0, // Mock stats for now
            returned: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching officer stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Officer Dashboard</h1>
      <p className="text-slate-600 mb-8">Welcome back, {user?.fullName}. Here's your verification queue.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Applications to Verify</p>
          <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Applications Verified</p>
          <p className="text-3xl font-bold text-primary-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Returned for Correction</p>
          <p className="text-3xl font-bold text-red-500">{stats.returned}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/officer/applications"
            className="flex items-center justify-center gap-2 bg-primary-50 text-primary-700 font-medium p-4 rounded-xl hover:bg-primary-100 transition-colors"
          >
            📋 Review Applications
          </Link>
          <Link
            to="/officer/profile"
            className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-medium p-4 rounded-xl hover:bg-slate-100 transition-colors"
          >
            👤 Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
