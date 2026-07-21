import React from 'react';
import type { CertificateType } from '../../../types';
import type { UploadedFile } from './DocumentUploadZone';
import { CERTIFICATE_TYPES } from './CertificateTypeSelector';

interface ApplicationReviewProps {
  certType: CertificateType;
  priority: 'normal' | 'urgent';
  formData: Record<string, string>;
  files: UploadedFile[];
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
  isSubmitting: boolean;
}

const formatKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase());

const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  certType, priority, formData, files, confirmed, onConfirm, isSubmitting,
}) => {
  const certInfo = CERTIFICATE_TYPES.find((c) => c.id === certType);

  const filledFields = Object.entries(formData).filter(
    ([, v]) => v && v.trim() !== ''
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Review & Submit</h2>
      <p className="text-slate-500 text-sm mb-6">
        सबै विवरण जाँच गरी आवेदन पेश गर्नुहोस्
      </p>

      {/* Certificate Type Summary */}
      <div className="bg-white p-5 mb-4 border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center text-2xl border border-slate-100">
            {certInfo?.icon}
          </div>
          <div>
            <p className="text-slate-800 font-bold">{certInfo?.labelEnglish}</p>
            <p className="text-slate-500 text-sm">{certInfo?.labelNepali}</p>
          </div>
          <div className="ml-auto">
            {priority === 'urgent' ? (
              <span className="badge bg-amber-50 text-amber-600 border border-amber-200">
                ⚡ Urgent
              </span>
            ) : (
              <span className="badge bg-slate-50 text-slate-600 border border-slate-200">
                📋 Normal
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>⏱</span>
          <span>Estimated completion: {certInfo?.days} business days</span>
        </div>
      </div>

      {/* Personal Details */}
      {filledFields.length > 0 && (
        <div className="bg-white p-5 mb-4 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>👤</span> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {filledFields.map(([key, value]) => (
              <div key={key} className="border-b border-slate-100 pb-2">
                <p className="text-slate-500 text-xs mb-0.5">{formatKey(key)}</p>
                <p className="text-slate-800 text-sm capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="bg-white p-5 mb-5 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>📎</span> Uploaded Documents ({files.length})
        </h3>
        {files.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No documents uploaded</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-3"
              >
                {f.preview ? (
                  <img
                    src={f.preview}
                    alt={f.documentType}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-20 flex items-center justify-center rounded-lg
                                  bg-slate-100 border border-slate-200 mb-2">
                    <span className="text-3xl">📄</span>
                  </div>
                )}
                <p className="text-slate-800 text-xs font-medium truncate">{f.documentType}</p>
                <p className="text-slate-500 text-xs truncate">{f.file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Checkbox */}
      <label
        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                     ${confirmed
                       ? 'border-primary-300 bg-primary-50'
                       : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                     }`}
      >
        <input
          id="confirm-checkbox"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirm(e.target.checked)}
          disabled={isSubmitting}
          className="w-5 h-5 rounded border-slate-300 bg-white text-primary-600
                     focus:ring-primary-500 focus:ring-offset-white mt-0.5 flex-shrink-0"
        />
        <div>
          <p className="text-slate-800 text-sm font-medium">
            I confirm all the information entered is accurate and complete.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            मैले प्रविष्ट गरेका सबै जानकारी सही र पूर्ण छन् भनी पुष्टि गर्दछु।
            Submitting false information is a punishable offence.
          </p>
        </div>
      </label>
    </div>
  );
};

export default ApplicationReview;
