import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { certificateAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import type { Certificate } from '../../types';

const OfficerDuplicateRequests: React.FC = () => {
  const [requests, setRequests] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await certificateAPI.getDuplicateRequests();
        if (res.data.success) {
          setRequests(res.data.data?.requests || []);
        }
      } catch (error) {
        console.error('Error fetching duplicate requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Duplicate Requests</h1>
          <p className="text-slate-500 mt-1">Review citizens' requests for copy (प्रतिलिपि) certificates.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Pending Requests Queue</h2>
          <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">
            {requests.length} Pending
          </span>
        </div>
        
        {loading ? (
          <div className="p-12"><Loader /></div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-slate-800 font-bold mb-1">All caught up!</h3>
            <p className="text-slate-500 text-sm">There are no pending duplicate requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Certificate</th>
                  <th className="p-4 font-semibold">Applicant</th>
                  <th className="p-4 font-semibold">Reason</th>
                  <th className="p-4 font-semibold">Requested On</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const applicantName = typeof req.userId === 'object' ? req.userId.fullName : 'Unknown';
                  const appObj = typeof req.applicationId === 'object' ? req.applicationId : null;
                  
                  return (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{req.certificateNumber}</p>
                        <p className="text-xs text-slate-500 capitalize">{req.certificateType} Certificate</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800">{applicantName}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-sm text-slate-600 truncate" title={req.duplicateRequestReason}>
                          {req.duplicateRequestReason}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-600">
                          {req.duplicateRequestDate ? new Date(req.duplicateRequestDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        {appObj && (
                          <Link
                            to={`/officer/applications/${appObj._id}`}
                            className="btn-outline text-xs py-1.5 px-3 border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-600 hover:text-primary-600"
                          >
                            Review Request →
                          </Link>
                        )}
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
  );
};

export default OfficerDuplicateRequests;
