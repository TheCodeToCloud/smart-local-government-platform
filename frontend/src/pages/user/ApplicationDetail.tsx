import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { applicationAPI } from '../../services/api';
import type { Application } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import { CERTIFICATE_TYPES } from '../../components/user/ApplicationForm/CertificateTypeSelector';
import { useSocket } from '../../hooks/useSocket';

// ─── Timeline Step ────────────────────────────────────────────────────────────
interface TimelineStepProps {
  icon: string;
  label: string;
  sublabel?: string;
  done: boolean;
  active: boolean;
  isLast?: boolean;
}

const TimelineStep: React.FC<TimelineStepProps> = ({
  icon, label, sublabel, done, active, isLast,
}) => (
  <div className="flex gap-4 relative">
    {/* Connector */}
    {!isLast && (
      <div className="absolute left-5 top-11 bottom-0 w-0.5 bg-slate-200" />
    )}
    {/* Circle */}
    <div
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm
                   z-10 relative flex-shrink-0 transition-all
                   ${done
                     ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                     : active
                     ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-lg animate-pulse'
                     : 'border-slate-300 bg-slate-100 text-slate-400'
                   }`}
    >
      {done ? '✓' : icon}
    </div>
    {/* Text */}
    <div className="pb-8">
      <p className={`font-semibold text-sm ${done ? 'text-emerald-600' : active ? 'text-slate-800' : 'text-slate-500'}`}>
        {label}
      </p>
      {sublabel && (
        <p className="text-slate-500 text-xs mt-0.5">{sublabel}</p>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const justCreated = location.state?.justCreated;

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time WebSocket hook
  const { lastUpdate } = useSocket();

  useEffect(() => {
    if (!id) return;
    const fetchApp = async () => {
      try {
        const res = await applicationAPI.getById(id);
        if (res.data.success) setApplication(res.data.data?.application || null);
        else setError('Application not found.');
      } catch {
        setError('Failed to load application.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  // Listen for socket updates targeting this specific application
  useEffect(() => {
    if (lastUpdate && application && lastUpdate.applicationId === application._id) {
      setApplication(prev => prev ? { ...prev, status: lastUpdate.status } : null);
    }
  }, [lastUpdate, application?._id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="md" text="Loading application..." />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-10 text-center max-w-sm rounded-3xl shadow-sm border border-slate-200">
          <p className="text-5xl mb-4">❌</p>
          <p className="text-red-500 mb-4">{error || 'Not found'}</p>
          <Link to="/applications" className="btn-primary">Back to Applications</Link>
        </div>
      </div>
    );
  }

  const ct = CERTIFICATE_TYPES.find((c) => c.id === application.certificateType);
  const ad = application.applicantDetails;
  const isApproved = application.status === 'approved';
  const isRejected = application.status === 'rejected';

  const timelineSteps = [
    {
      icon: '📤',
      label: 'Application Submitted',
      sublabel: new Date(application.createdAt).toLocaleString('en-NP'),
      done: true,
      active: false,
    },
    {
      icon: '⏳',
      label: 'Pending Review',
      sublabel: 'Waiting for admin to pick up',
      done: ['under_review', 'approved', 'rejected'].includes(application.status),
      active: application.status === 'pending',
    },
    {
      icon: '🔍',
      label: 'Under Review',
      sublabel: application.reviewedAt
        ? `Reviewed on ${new Date(application.reviewedAt).toLocaleDateString('en-NP')}`
        : 'Your documents are being verified',
      done: ['approved', 'rejected'].includes(application.status),
      active: application.status === 'under_review',
    },
    {
      icon: isApproved ? '✅' : isRejected ? '❌' : '🎯',
      label: isRejected ? 'Application Rejected' : 'Application Approved',
      sublabel: isApproved
        ? 'Certificate is ready'
        : isRejected
        ? application.rejectionReason
        : 'Pending decision',
      done: isApproved || isRejected,
      active: false,
    },
  ];

  const detailFields = [
    { label: 'Full Name', value: ad?.fullName },
    { label: 'Date of Birth', value: ad?.dateOfBirth ? new Date(ad.dateOfBirth).toLocaleDateString() : '' },
    { label: 'Gender', value: ad?.gender },
    { label: "Father's Name", value: ad?.fatherName },
    { label: "Mother's Name", value: ad?.motherName },
    { label: "Grandfather's Name", value: ad?.grandfatherName },
    { label: 'Ward Number', value: ad?.wardNumber },
    { label: 'Municipality', value: ad?.municipalityName },
    { label: 'District', value: ad?.districtName },
    { label: 'Province', value: ad?.province },
    { label: 'Permanent Address', value: ad?.permanentAddress },
    { label: 'Temporary Address', value: ad?.temporaryAddress },
    // Type-specific
    { label: 'Birth Place', value: (ad as any)?.birthPlace },
    { label: 'Spouse Name', value: (ad as any)?.spouseName },
    { label: 'Marriage Date', value: (ad as any)?.marriageDate },
    { label: 'Deceased Name', value: (ad as any)?.deceasedName },
    { label: 'Death Date', value: (ad as any)?.deathDate },
    { label: 'Occupation', value: (ad as any)?.occupation },
    { label: 'Annual Income', value: (ad as any)?.annualIncome ? `NPR ${(ad as any).annualIncome}` : '' },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Success Banner */}
        {justCreated && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6 animate-fade-in flex gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-emerald-700 font-semibold">Application Submitted Successfully!</p>
              <p className="text-emerald-600 text-sm">We'll notify you on status changes.</p>
            </div>
          </div>
        )}

        {/* Real-time status update flash banner */}
        {lastUpdate && lastUpdate.applicationId === application._id && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6 animate-pulse">
            <span className="text-xl">⚡</span>
            <p className="font-medium text-sm">Update: {lastUpdate.message}</p>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link to="/applications" className="text-slate-500 hover:text-slate-800 transition-colors">
            ← My Applications
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700">{application.applicationNumber}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white p-6 mb-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 text-blue-600 flex items-center justify-center text-3xl flex-shrink-0">
                {ct?.icon || '📋'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{application.applicationNumber}</h1>
                <p className="text-slate-500 text-sm capitalize mt-0.5">
                  {application.certificateType} Certificate
                  {application.priority === 'urgent' && (
                    <span className="ml-2 text-amber-600 font-medium">⚡ Urgent</span>
                  )}
                </p>
              </div>
            </div>
            <StatusBadge status={application.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Submitted', value: new Date(application.createdAt).toLocaleDateString('en-NP') },
              { label: 'Est. Completion', value: application.estimatedCompletionDate ? new Date(application.estimatedCompletionDate).toLocaleDateString('en-NP') : 'TBD' },
              { label: 'Documents', value: `${application.uploadedDocuments?.length || 0} file(s)` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className="text-slate-800 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Timeline */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-5">📊 Status Timeline</h2>
            {timelineSteps.map((step, i) => (
              <TimelineStep
                key={i}
                {...step}
                isLast={i === timelineSteps.length - 1}
              />
            ))}
          </div>

          {/* Applicant Details */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-5">👤 Applicant Details</h2>
            {detailFields.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No details provided</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailFields.map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                    <p className="text-slate-800 text-sm capitalize">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents */}
        {(application.uploadedDocuments?.length ?? 0) > 0 && (
          <div className="bg-white p-6 mb-5 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4">📎 Uploaded Documents</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {application.uploadedDocuments.map((doc, i) => (
                <a
                  key={i}
                  href={doc.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl overflow-hidden border border-slate-200
                             bg-slate-50 hover:border-primary-300 transition-all"
                >
                  <div className="h-20 bg-slate-100 flex items-center justify-center text-3xl">
                    {doc.cloudinaryUrl.includes('.pdf') ? '📄' : '🖼️'}
                  </div>
                  <div className="p-2.5">
                    <p className="text-slate-800 text-xs font-medium truncate">{doc.documentType}</p>
                    <p className="text-slate-500 text-xs truncate">{doc.fileName}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {isRejected && application.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
            <h3 className="text-red-600 font-semibold mb-2 flex items-center gap-2">
              ❌ Rejection Reason
            </h3>
            <p className="text-slate-600 text-sm">{application.rejectionReason}</p>
            {application.adminRemarks && (
              <p className="text-slate-500 text-xs mt-2 border-t border-red-200 pt-2">
                Remarks: {application.adminRemarks}
              </p>
            )}
          </div>
        )}

        {/* Admin Remarks (non-rejected) */}
        {!isRejected && application.adminRemarks && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
            <h3 className="text-blue-600 font-semibold mb-2">💬 Admin Remarks</h3>
            <p className="text-slate-600 text-sm">{application.adminRemarks}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {isApproved && (
            <Link to="/certificates" className="btn-secondary py-3 px-6 flex items-center gap-2">
              ⬇️ View Certificate
            </Link>
          )}
          {isRejected && (
            <button
              onClick={() => navigate('/apply', { state: { resubmit: application } })}
              className="btn-primary py-3 px-6"
            >
              🔄 Resubmit Application
            </button>
          )}
          <Link to="/applications" className="btn-ghost py-3 px-6">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
