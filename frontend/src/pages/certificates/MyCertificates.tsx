import React, { useEffect, useState } from 'react';
import { certificateAPI } from '../../services/api';
import type { Certificate } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';

const MyCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await certificateAPI.getAll();
        if (res.data.success) setCertificates(res.data.data?.certificates || []);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="md" text="Loading certificates..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">🎖️ My Certificates</h1>
          <p className="text-slate-500 text-sm mt-1">View and download your issued certificates</p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-3xl shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">🎖️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Certificates Yet</h3>
            <p className="text-slate-500">Your approved applications will appear here as certificates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {certificates.map((cert) => {
              const isExpired = new Date() > new Date(cert.expiryDate);
              const status = !cert.isValid ? 'expired' : isExpired ? 'expired' : 'valid';

              return (
                <div key={cert._id} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm
                                                hover:border-primary-300 transition-all group">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center text-2xl border border-slate-100">
                      🎖️
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-1 capitalize">
                    {cert.certificateType} Certificate
                  </h3>
                  <p className="text-slate-500 text-xs font-mono mb-4">{cert.certificateNumber}</p>

                  <div className="space-y-2 text-sm mb-5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issued</span>
                      <span className="text-slate-800">{new Date(cert.issuedDate).toLocaleDateString('en-NP')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expires</span>
                      <span className={isExpired ? 'text-red-500' : 'text-slate-800'}>
                        {new Date(cert.expiryDate).toLocaleDateString('en-NP')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Downloads</span>
                      <span className="text-slate-800">{cert.downloadCount}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cert.pdfUrl && (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs py-2 px-4 flex-1 text-center"
                      >
                        ⬇️ Download PDF
                      </a>
                    )}
                    <a
                      href={`/verify/${cert.certificateNumber}`}
                      className="btn-outline text-xs py-2 px-4"
                    >
                      🔍 Verify
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCertificates;
