import React, { useEffect, useState, useRef } from 'react';
import { applicationAPI } from '../../services/api';
import BirthCertificate from './BirthCertificate';
import { useReactToPrint } from 'react-to-print';
import type { Certificate } from '../../types';

interface Props {
  cert: Certificate;
  onClose: () => void;
}

const BirthCertificatePrinter: React.FC<Props> = ({ cert, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `${cert.certificateNumber}_Birth_Certificate`,
  });

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const appId = typeof cert.applicationId === 'string' ? cert.applicationId : (cert.applicationId as any)._id;
        const res = await applicationAPI.getById(appId);
        setAppData(res.data.data?.application);
      } catch (e) {
        console.error('Error fetching application details for certificate:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [cert]);

  // Helper to safely format dates
  const formatDate = (dateString?: string, locale: string = 'en-US') => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString(locale);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
      {/* Top Bar */}
      <div className="bg-white p-3 rounded-2xl flex items-center gap-4 mb-4 shadow-xl border border-slate-200 animate-slide-down">
        {loading ? (
          <p className="text-sm font-medium text-slate-600 px-4">Loading certificate data...</p>
        ) : !appData ? (
          <p className="text-sm font-medium text-red-600 px-4">Failed to load data.</p>
        ) : (
          <>
            <button 
              onClick={() => reactToPrintFn()} 
              className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Save as PDF / Print
            </button>
            <button onClick={onClose} className="btn-ghost py-2 text-sm">
              Close
            </button>
          </>
        )}
      </div>

      {/* Certificate Preview Box */}
      {!loading && appData && (
        <div className="overflow-auto w-full max-w-[230mm] bg-[#e5e7eb] p-4 sm:p-8 rounded-xl shadow-2xl animate-fade-in custom-scrollbar flex justify-center">
          <div ref={contentRef} className="bg-white shadow-md">
            <BirthCertificate
              certificateNo={cert.certificateNumber}
              registrationNo={appData.applicationNumber || 'N/A'}
              issueDateBS={formatDate(cert.issuedDate, 'en-NP')}
              issueDateAD={formatDate(cert.issuedDate, 'en-US')}
              childNameNP={appData.applicantDetails?.fullName || '—'}
              sex={appData.applicantDetails?.gender || '—'}
              dobBS={appData.applicantDetails?.dateOfBirth || '—'}
              dobAD={appData.applicantDetails?.dateOfBirth || '—'}
              placeOfBirth={appData.applicantDetails?.birthPlace || appData.applicantDetails?.municipalityName || '—'}
              fatherName={appData.applicantDetails?.fatherName || '—'}
              motherName={appData.applicantDetails?.motherName || '—'}
              permanentAddress={appData.applicantDetails?.permanentAddress || '—'}
              issuingAuthority={`${appData.applicantDetails?.municipalityName || ''} Municipality`}
              registrationDateBS={formatDate(cert.issuedDate, 'en-NP')}
              registrationDateAD={formatDate(cert.issuedDate, 'en-US')}
              signatoryName="Ram Prasad Sharma"
              designation="Ward Chairperson"
              office={`${appData.applicantDetails?.municipalityName || ''} Ward No ${appData.applicantDetails?.wardNumber || '1'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthCertificatePrinter;
