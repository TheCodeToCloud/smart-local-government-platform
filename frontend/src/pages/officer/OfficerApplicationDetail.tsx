import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { officerAPI, applicationAPI } from '../../services/api';
import type { Application } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import { AxiosError } from 'axios';

const OfficerApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [certificate, setCertificate] = useState<import('../../types').Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [reason, setReason] = useState('');
  
  // Modals state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Document verification state (SMART FEATURE)
  const [docStatuses, setDocStatuses] = useState<Record<string, 'verified' | 'unverified'>>({});

  const fetchApp = async () => {
    if (!id) return;
    try {
      const res = await applicationAPI.getById(id);
      if (res.data.success && res.data.data) {
        setApplication(res.data.data.application);
        if (res.data.data.certificate) {
          setCertificate(res.data.data.certificate);
        }
        // Initialize doc statuses
        const initialStatus: Record<string, 'verified' | 'unverified'> = {};
        res.data.data.application.uploadedDocuments.forEach((doc: any) => {
          initialStatus[doc._id || doc.publicId] = 'unverified';
        });
        setDocStatuses(initialStatus);
      }
    } catch {
      setError('Failed to load application.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleVerify = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await officerAPI.verifyApplication(id);
      if (res.data.success) {
        setShowVerifyModal(false);
        showMsg('success', 'Application verified and forwarded to Admin.');
        fetchApp();
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      showMsg('error', axErr.response?.data?.message || 'Verification failed.');
      setShowVerifyModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!id || !reason.trim()) {
      showMsg('error', 'Please provide a reason for return.');
      return;
    }
    setActionLoading(true);
    try {
      await officerAPI.returnApplication(id, reason);
      setShowReturnModal(false);
      showMsg('success', 'Application returned for correction.');
      fetchApp();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      showMsg('error', axErr.response?.data?.message || 'Return failed.');
      setShowReturnModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleDocStatus = (docId: string) => {
    setDocStatuses(prev => ({
      ...prev,
      [docId]: prev[docId] === 'verified' ? 'unverified' : 'verified'
    }));
  };

  const handleViewPdf = async () => {
    if (!certificate?._id) return;
    try {
      showMsg('success', 'Loading PDF...');
      const { certificateAPI } = await import('../../services/api');
      const res = await certificateAPI.download(certificate._id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      showMsg('error', 'Failed to load PDF.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="lg" text="Loading Application Details..." />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 text-center rounded-3xl shadow-sm border border-red-200 max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-500 mb-6 font-medium">{error || 'Application not found'}</p>
          <Link to="/officer/applications" className="btn-primary">Back to Applications</Link>
        </div>
      </div>
    );
  }

  const ad = application.applicantDetails;
  const canAct = ['pending', 'under_review', 'verified'].includes(application.status);
  const isVerified = application.status === 'verified';
  const userObj = typeof application.userId === 'object' ? application.userId as any : null;
  const reviewerObj = typeof application.reviewedBy === 'object' ? application.reviewedBy as any : null;

  const allDocsVerified = Object.values(docStatuses).every(s => s === 'verified');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 relative">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/officer/applications" className="text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to Applications
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-primary-600 font-mono">{application.applicationNumber}</span>
        </div>

        {/* Status Toast */}
        {message && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-in border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* 1. Header & Actions */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 border-l-4 border-l-primary-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{application.applicationNumber}</h1>
                <StatusBadge status={application.status} size="md" />
                {application.priority === 'urgent' && (
                  <span className="bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded text-xs font-bold uppercase">⚡ Urgent</span>
                )}
              </div>
              <p className="text-slate-500 capitalize flex items-center gap-2">
                <span className="text-slate-800 font-medium">{application.certificateType} Certificate</span>
                <span className="text-slate-300">•</span>
                Applied on {new Date(application.createdAt).toLocaleDateString('en-NP')}
              </p>
            </div>

            {canAct && (
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setShowReturnModal(true)} 
                  disabled={actionLoading}
                  className="btn-danger text-sm py-2 bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Return
                </button>
                <button 
                  onClick={() => setShowVerifyModal(true)} 
                  disabled={actionLoading}
                  className="btn-primary text-sm py-2 bg-indigo-600 hover:bg-indigo-500"
                >
                  Verify Documents
                </button>
              </div>
            )}
            
            {application.status === 'approved' && certificate && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleViewPdf}
                  className="btn-primary text-sm py-2 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 01.293.707V19a2 01-2 2z" /></svg>
                  View PDF Certificate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 6. Application Timeline */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Processing Timeline</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
            
            {/* Step 1: Submitted */}
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm shadow-sm">✓</div>
              <div className="text-center">
                <p className="text-xs font-bold text-primary-600">Submitted</p>
                <p className="text-[10px] text-slate-500">{new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Step 2: Under Review */}
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                ['under_review', 'approved', 'rejected'].includes(application.status) 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-slate-200 text-slate-400'
              }`}>
                {['approved', 'rejected'].includes(application.status) ? '✓' : '⏳'}
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold ${['under_review', 'approved', 'rejected'].includes(application.status) ? 'text-amber-600' : 'text-slate-400'}`}>Under Review</p>
                <p className="text-[10px] text-slate-500">
                  {application.status === 'pending' ? 'Pending' : 'Completed'}
                </p>
              </div>
            </div>

            {/* Step 3: Decision */}
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                application.status === 'approved' ? 'bg-emerald-500 text-white shadow-sm' :
                application.status === 'rejected' ? 'bg-red-500 text-white shadow-sm' :
                'bg-slate-200 text-slate-400'
              }`}>
                {application.status === 'approved' ? '✅' : application.status === 'rejected' ? '❌' : '🎖️'}
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold ${
                  application.status === 'approved' ? 'text-emerald-600' : 
                  application.status === 'rejected' ? 'text-red-600' : 
                  'text-slate-400'
                }`}>
                  {application.status === 'approved' ? 'Approved' : application.status === 'rejected' ? 'Rejected' : 'Decision'}
                </p>
                {application.reviewedAt && (
                  <p className="text-[10px] text-slate-500">{new Date(application.reviewedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 2. Applicant Information */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-3">👤 Applicant Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Full Name</p>
                  <p className="text-slate-800 font-medium text-lg">{ad.fullName}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Date of Birth</p>
                  <p className="text-slate-800 font-medium">{ad.dateOfBirth ? new Date(ad.dateOfBirth).toLocaleDateString() : '—'}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Gender</p>
                  <p className="text-slate-800 font-medium capitalize">{ad.gender || '—'}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Father's Name</p>
                  <p className="text-slate-800 font-medium">{ad.fatherName || '—'}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Mother's Name</p>
                  <p className="text-slate-800 font-medium">{ad.motherName || '—'}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 md:col-span-2">
                  <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Permanent Address</p>
                  <p className="text-slate-800 font-medium">
                    {ad.municipalityName ? `${ad.municipalityName}-${ad.wardNumber}, ${ad.districtName}, ${ad.province}` : (ad.permanentAddress || '—')}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Submitted Documents */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-800">📎 Submitted Documents</h2>
                {canAct && (
                  <span className={`text-xs font-bold px-2 py-1 rounded ${allDocsVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {allDocsVerified ? '✓ All Verified' : 'Review Needed'}
                  </span>
                )}
              </div>

              {application.uploadedDocuments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No documents attached.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {application.uploadedDocuments.map((doc: any) => {
                    const docId = doc._id || doc.publicId;
                    const isVerified = docStatuses[docId] === 'verified';
                    
                    return (
                      <div key={docId} className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
                        isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl shrink-0 border border-slate-200">
                            {doc.fileName.endsWith('.pdf') ? '📄' : '🖼️'}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-slate-800 font-medium text-sm truncate" title={doc.documentType}>{doc.documentType}</p>
                            <p className="text-slate-500 text-xs truncate" title={doc.fileName}>{doc.fileName}</p>
                            <p className="text-slate-400 text-[10px] mt-1">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-200">
                          <a 
                            href={doc.cloudinaryUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"
                          >
                            View Full ↗
                          </a>
                          
                          {canAct && (
                            <button
                              onClick={() => toggleDocStatus(docId)}
                              className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                                isVerified 
                                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {isVerified ? '✓ Verified' : 'Mark Verified'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* User Account Info */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Registered Citizen</h2>
              {userObj ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-2xl font-bold text-blue-600 mb-3">
                    {userObj.fullName.charAt(0)}
                  </div>
                  <p className="text-slate-800 font-bold text-lg">{userObj.fullName}</p>
                  <p className="text-slate-500 text-sm mb-1">{userObj.email}</p>
                  <p className="text-slate-500 text-sm">{userObj.phone}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200 w-full text-left">
                    <p className="text-slate-500 text-xs mb-1">Account Created</p>
                    <p className="text-slate-700 text-sm">{new Date(userObj.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">User information unavailable.</p>
              )}
            </div>

            {/* Review Decision Info (if decided) */}
            {['approved', 'rejected'].includes(application.status) && (
              <div className={`p-6 rounded-3xl border shadow-sm ${
                application.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${
                  application.status === 'approved' ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'
                }`}>
                  Decision Details
                </h2>
                
                <div className="space-y-4">
                  {application.status === 'rejected' && application.rejectionReason && (
                    <div>
                      <p className="text-red-500 text-xs mb-1">Rejection Reason</p>
                      <p className="text-red-700 text-sm font-medium">{application.rejectionReason}</p>
                    </div>
                  )}
                  
                  {application.adminRemarks && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Admin Remarks</p>
                      <p className="text-slate-700 text-sm italic border-l-2 border-slate-300 pl-3">"{application.adminRemarks}"</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Reviewed By</p>
                    <p className="text-slate-700 text-sm">{reviewerObj?.fullName || 'System Admin'}</p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Reviewed On</p>
                    <p className="text-slate-700 text-sm">{application.reviewedAt ? new Date(application.reviewedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerApplicationDetail;
