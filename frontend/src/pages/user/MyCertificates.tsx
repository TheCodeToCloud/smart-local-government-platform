import React, { useEffect, useState } from 'react';
import { certificateAPI } from '../../services/api';
import type { Certificate } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import { CERTIFICATE_TYPES } from '../../components/user/ApplicationForm/CertificateTypeSelector';

// ─── QR Modal ─────────────────────────────────────────────────────────────────
const QRModal: React.FC<{ certNumber: string; onClose: () => void }> = ({
  certNumber, onClose,
}) => {
  const verifyUrl = `${window.location.origin}/verify/${certNumber}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="glass-card-dark p-8 max-w-sm w-full text-center animate-slide-up border border-primary-700/40"
           onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-1">🔍 QR Verification Code</h3>
        <p className="text-slate-400 text-sm mb-5">Scan this code to verify certificate authenticity</p>

        <div className="bg-white p-4 rounded-2xl inline-block mb-5">
          <img src={qrSrc} alt="QR Code" className="w-48 h-48" />
        </div>

        <p className="text-slate-400 text-xs mb-1 font-mono break-all px-2">{certNumber}</p>
        <p className="text-slate-500 text-xs mb-6">Screenshot this QR to share with officials</p>

        <div className="flex gap-3">
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-ghost text-sm py-2.5"
          >
            🔗 Open Link
          </a>
          <button onClick={onClose} className="flex-1 btn-primary text-sm py-2.5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Certificate Card ─────────────────────────────────────────────────────────
interface CertCardProps {
  cert: Certificate;
  onQR: (certNumber: string) => void;
}

const CertCard: React.FC<CertCardProps> = ({ cert, onQR }) => {
  const ct = CERTIFICATE_TYPES.find((c) => c.id === cert.certificateType);
  const isExpired = new Date() > new Date(cert.expiryDate);
  const status = !cert.isValid ? 'revoked' : isExpired ? 'expired' : 'valid';

  const daysLeft = Math.ceil(
    (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      const res = await certificateAPI.download(cert._id);
      const url = window.URL.createObjectURL(new Blob([res.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cert.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      setDownloadError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`glass-card-dark p-6 border transition-all hover:-translate-y-0.5
                      ${status === 'valid' ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ct?.color || 'from-slate-500/20'} 
                         border ${ct?.border || 'border-slate-500/30'}
                         flex items-center justify-center text-3xl`}>
          {ct?.icon || '🎖️'}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Info */}
      <h3 className="text-lg font-bold text-white mb-0.5 capitalize">
        {cert.certificateType} Certificate
      </h3>
      <p className="text-primary-400 font-mono text-xs mb-4">{cert.certificateNumber}</p>

      <div className="space-y-2 text-sm mb-5">
        <div className="flex justify-between">
          <span className="text-slate-400">Issued</span>
          <span className="text-white">{new Date(cert.issuedDate).toLocaleDateString('en-NP')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Expires</span>
          <span className={isExpired ? 'text-red-400 font-medium' : 'text-white'}>
            {new Date(cert.expiryDate).toLocaleDateString('en-NP')}
          </span>
        </div>
        {!isExpired && status === 'valid' && (
          <div className="flex justify-between">
            <span className="text-slate-400">Valid For</span>
            <span className={`font-medium ${daysLeft < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {daysLeft} days
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-400">Downloads</span>
          <span className="text-white">{cert.downloadCount}</span>
        </div>
      </div>

      {/* Download Error */}
      {downloadError && (
        <p className="text-red-400 text-xs mt-2 text-center">{downloadError}</p>
      )}
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={status !== 'valid' || isDownloading}
          className={`flex-1 btn-secondary text-xs py-2.5 text-center ${(status !== 'valid' || isDownloading) ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {isDownloading ? 'Downloading...' : '⬇️ Download PDF'}
        </button>
        <button
          onClick={() => onQR(cert.certificateNumber)}
          className="btn-ghost text-xs py-2.5 px-3"
          title="Show QR Code"
        >
          📷 QR
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [qrCert, setQrCert] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired'>('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await certificateAPI.getAll();
        if (res.data.success) setCertificates(res.data.data?.certificates || []);
      } catch (error) {
        console.error('Failed to load certificates', error);
        setFetchError('Failed to load certificates. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredCerts = certificates.filter((cert) => {
    const isExpired = new Date() > new Date(cert.expiryDate);
    const status = !cert.isValid ? 'expired' : isExpired ? 'expired' : 'valid';
    if (filter === 'all') return true;
    return status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6">
      {qrCert && <QRModal certNumber={qrCert} onClose={() => setQrCert(null)} />}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">🎖️ My Certificates</h1>
          <p className="text-slate-400 text-sm mt-1">
            View, download, and verify your issued government certificates
          </p>
        </div>

        {/* Stats */}
        {!isLoading && certificates.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total', value: certificates.length, color: 'text-white' },
              { label: 'Valid', value: certificates.filter((c) => c.isValid && new Date() <= new Date(c.expiryDate)).length, color: 'text-emerald-400' },
              { label: 'Expired', value: certificates.filter((c) => !c.isValid || new Date() > new Date(c.expiryDate)).length, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card-dark p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-slate-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        {!isLoading && certificates.length > 0 && (
          <div className="flex gap-2 mb-6">
            {(['all', 'valid', 'expired'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader size="md" text="Loading certificates..." />
          </div>
        ) : fetchError ? (
          <div className="glass-card-dark p-16 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Could Not Load Certificates</h3>
            <p className="text-slate-400 mb-6">{fetchError}</p>
            <button
              onClick={() => { setFetchError(null); setIsLoading(true); }}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="glass-card-dark p-16 text-center">
            <div className="text-6xl mb-4">🎖️</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Certificates Found</h3>
            <p className="text-slate-400 mb-1">
              {filter !== 'all' ? `No ${filter} certificates.` : 'Your approved applications will appear as certificates here.'}
            </p>
            {filter === 'all' && (
              <p className="text-slate-500 text-sm mt-4">
                Apply for a certificate to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCerts.map((cert) => (
              <CertCard key={cert._id} cert={cert} onQR={setQrCert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCertificates;
