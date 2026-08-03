import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/ui/Toast';

const OfficerApplications: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await axios.get('/api/officer/applications', { withCredentials: true });
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (error) {
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      setVerifyingId(id);
      const res = await axios.put(`/api/officer/applications/${id}/verify`, {}, { withCredentials: true });
      if (res.data.success) {
        showToast('Application verified and forwarded to Admin.', 'success');
        fetchApplications();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to verify', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReturn = async (id: string) => {
    const reason = window.prompt('Enter reason for correction:');
    if (!reason) return;

    try {
      setVerifyingId(id);
      const res = await axios.put(`/api/officer/applications/${id}/return`, { reason }, { withCredentials: true });
      if (res.data.success) {
        showToast('Application returned for correction.', 'success');
        fetchApplications();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to return', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) return <div className="p-8"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Review Applications</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">App No</th>
                <th className="px-6 py-4 font-semibold">Applicant</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No applications pending verification.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{app.applicationNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{app.userId?.fullName || 'Unknown'}</td>
                    <td className="px-6 py-4 capitalize text-slate-600">{app.certificateType}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleVerify(app._id)}
                        disabled={verifyingId === app._id}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleReturn(app._id)}
                        disabled={verifyingId === app._id}
                        className="bg-red-50 text-red-600 hover:bg-red-100 font-medium py-1.5 px-3 rounded-lg text-xs transition-colors"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfficerApplications;
