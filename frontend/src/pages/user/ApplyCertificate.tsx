import React, { useReducer, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { CertificateType } from '../../types';
import { applicationAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import StepIndicator from '../../components/user/ApplicationForm/StepIndicator';
import CertificateTypeSelector from '../../components/user/ApplicationForm/CertificateTypeSelector';
import PersonalInfoForm from '../../components/user/ApplicationForm/PersonalInfoForm';
import DocumentUploadZone, { type UploadedFile } from '../../components/user/ApplicationForm/DocumentUploadZone';
import ApplicationReview from '../../components/user/ApplicationForm/ApplicationReview';
import SpouseInfoForm from '../../components/user/ApplicationForm/SpouseInfoForm';
import { ProcessingTimeEstimate } from '../../components/smart/ProcessingTimeEstimate';
import { AxiosError } from 'axios';

// ─── State Types ─────────────────────────────────────────────────────────────
interface FormState {
  certType: CertificateType | '';
  priority: 'normal' | 'urgent';
  personalData: Record<string, string>;
  spouseData: Record<string, string>;
  files: UploadedFile[];
  confirmed: boolean;
}

type FormAction =
  | { type: 'SET_CERT_TYPE'; payload: CertificateType }
  | { type: 'SET_PRIORITY'; payload: 'normal' | 'urgent' }
  | { type: 'SET_FIELD'; payload: { key: string; value: string } }
  | { type: 'SET_SPOUSE_FIELD'; payload: { key: string; value: string } }
  | { type: 'ADD_FILE'; payload: UploadedFile }
  | { type: 'REMOVE_FILE'; payload: number }
  | { type: 'SET_CONFIRMED'; payload: boolean }
  | { type: 'AUTO_FILL'; payload: Record<string, string> };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_CERT_TYPE':
      return { ...state, certType: action.payload };
    case 'SET_PRIORITY':
      return { ...state, priority: action.payload };
    case 'SET_FIELD':
      return { ...state, personalData: { ...state.personalData, [action.payload.key]: action.payload.value } };
    case 'SET_SPOUSE_FIELD':
      return { ...state, spouseData: { ...state.spouseData, [action.payload.key]: action.payload.value } };
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };
    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter((_, i) => i !== action.payload) };
    case 'SET_CONFIRMED':
      return { ...state, confirmed: action.payload };
    case 'AUTO_FILL':
      return { ...state, personalData: { ...state.personalData, ...action.payload } };
    default:
      return state;
  }
};

const STEPS = [
  { number: 1, label: 'Certificate Type', icon: '📋' },
  { number: 2, label: 'Personal Info', icon: '👤' },
  { number: 3, label: 'Documents', icon: '📎' },
  { number: 4, label: 'Review', icon: '✅' },
];

// ─── Success Modal ────────────────────────────────────────────────────────────
const SuccessModal: React.FC<{ appNumber: string; onClose: () => void }> = ({
  appNumber, onClose,
}) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white p-8 max-w-md w-full text-center animate-slide-up rounded-3xl shadow-xl border border-slate-200">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
      <p className="text-slate-500 mb-5">
        आपको आवेदन सफलतापूर्वक पेश गरियो
      </p>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
        <p className="text-slate-500 text-sm mb-1">Your Application Number</p>
        <p className="text-emerald-600 font-mono text-2xl font-bold">{appNumber}</p>
        <p className="text-slate-500 text-xs mt-1">Save this number for future reference</p>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        You will be notified when your application status changes. 
        Estimated processing time: 5–7 business days.
      </p>
      <button onClick={onClose} className="btn-primary w-full py-3">
        View My Applications →
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ApplyCertificate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const defaultType = searchParams.get('type') as CertificateType | null;

  const [step, setStep] = useState(defaultType ? 2 : 1);
  const [formState, dispatch] = useReducer(formReducer, {
    certType: defaultType || '',
    priority: 'normal',
    personalData: {},
    spouseData: {},
    files: [],
    confirmed: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successAppNumber, setSuccessAppNumber] = useState('');
  const [canAutoFill, setCanAutoFill] = useState(false);
  const [previousData, setPreviousData] = useState<Record<string, string>>({});

  // Check if user has previous applications to auto-fill from
  useEffect(() => {
    const fetchPrev = async () => {
      try {
        const res = await applicationAPI.getAll({ limit: '5', status: 'approved' } as any);
        const apps = res.data.data?.applications ?? [];
        if (apps.length > 0) {
          const ad = apps[0].applicantDetails as unknown as Record<string, string>;
          const prev: Record<string, string> = {};
          Object.entries(ad || {}).forEach(([k, v]) => {
            if (v && typeof v === 'string') prev[k] = v;
          });
          if (Object.keys(prev).length > 0) {
            setPreviousData(prev);
            setCanAutoFill(true);
          }
        }
      } catch { /* silent */ }
    };
    fetchPrev();
  }, []);

  const handleAutoFill = () => {
    dispatch({ type: 'AUTO_FILL', payload: previousData });
  };

  const handleSubmit = async () => {
    if (!formState.certType || !formState.confirmed) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const cleanData = (data: Record<string, string>) => {
        const cleaned = { ...data };
        if (!cleaned.dateOfBirth) delete cleaned.dateOfBirth;
        return cleaned;
      };

      const payload: any = {
        certificateType: formState.certType,
        priority: formState.priority,
        applicantDetails: cleanData(formState.personalData),
        status: 'pending',
      };
      
      if (formState.certType === 'marriage') {
        payload.spouseDetails = cleanData(formState.spouseData);
      }
      
      const res = await applicationAPI.create(payload);

      if (res.data.success && res.data.data?.application) {
        const appId = res.data.data.application._id;
        
        if (formState.files.length > 0) {
          const uploadPromises = formState.files.map((f) => {
            const fd = new FormData();
            fd.append('document', f.file);
            fd.append('documentType', f.documentType);
            return applicationAPI.uploadDocument(appId, fd);
          });
          await Promise.all(uploadPromises);
        }

        setSuccessAppNumber(res.data.data.application.applicationNumber);
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setSubmitError(axErr.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMarriage = formState.certType === 'marriage';
  const steps = isMarriage ? [
    { number: 1, label: 'Certificate Type', icon: '📋' },
    { number: 2, label: 'Personal Info', icon: '👤' },
    { number: 3, label: 'Spouse Info', icon: '👩‍❤️‍👨' },
    { number: 4, label: 'Documents', icon: '📎' },
    { number: 5, label: 'Review', icon: '✅' },
  ] : [
    { number: 1, label: 'Certificate Type', icon: '📋' },
    { number: 2, label: 'Personal Info', icon: '👤' },
    { number: 3, label: 'Documents', icon: '📎' },
    { number: 4, label: 'Review', icon: '✅' },
  ];

  const totalSteps = steps.length;

  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return formState.certType !== '';
      case 2: {
        const pd = formState.personalData;
        return !!(pd.fullName?.trim() && pd.province && pd.districtName?.trim() && pd.municipalityName?.trim());
      }
      case 3: {
        if (isMarriage) {
          const sd = formState.spouseData;
          return !!(sd.fullName?.trim() && sd.province && sd.districtName?.trim() && sd.municipalityName?.trim());
        }
        return formState.files.length > 0;
      }
      case 4: {
        if (isMarriage) return formState.files.length > 0;
        return formState.confirmed;
      }
      case 5: {
        if (isMarriage) return formState.confirmed;
        return false;
      }
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      {/* Success Modal */}
      {successAppNumber && (
        <SuccessModal
          appNumber={successAppNumber}
          onClose={() => navigate('/applications')}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">📝 Apply for Certificate</h1>
          <p className="text-slate-500 text-sm mt-1">
            नमस्ते {user?.fullName.split(' ')[0]}! — Follow the steps to submit your application
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} steps={steps} />

        {/* Priority toggle (shown on step 1 & 2) */}
        {(step === 1 || step === 2) && (
          <div className="flex gap-3 mb-6">
            <p className="text-slate-500 text-sm self-center">Priority:</p>
            {(['normal', 'urgent'] as const).map((p) => (
              <button
                key={p}
                onClick={() => dispatch({ type: 'SET_PRIORITY', payload: p })}
                className={`px-4 py-2 rounded-xl text-sm font-medium border capitalize transition-all
                  ${formState.priority === p
                    ? p === 'urgent'
                      ? 'border-amber-500 bg-amber-50 text-amber-600'
                      : 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                  }`}
              >
                {p === 'urgent' ? '⚡ Urgent' : '📋 Normal'}
              </button>
            ))}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 mb-6 rounded-3xl shadow-md border border-slate-200 animate-fade-in">
          {step === 1 && (
            <CertificateTypeSelector
              selected={formState.certType}
              onSelect={(t) => dispatch({ type: 'SET_CERT_TYPE', payload: t })}
            />
          )}

          {(step === 1 || step === 2) && formState.certType && (
            <div className="mt-6 mb-6">
              <ProcessingTimeEstimate 
                certificateType={formState.certType}
                priority={formState.priority}
                onUpgradeToUrgent={() => dispatch({ type: 'SET_PRIORITY', payload: 'urgent' })}
              />
            </div>
          )}

          {step === 2 && formState.certType && (
            <PersonalInfoForm
              certType={formState.certType}
              data={formState.personalData}
              onChange={(key, value) => dispatch({ type: 'SET_FIELD', payload: { key, value } })}
              onAutoFill={handleAutoFill}
              canAutoFill={canAutoFill}
            />
          )}

          {step === 3 && isMarriage && formState.certType && (
            <SpouseInfoForm
              data={formState.spouseData}
              onChange={(key, value) => dispatch({ type: 'SET_SPOUSE_FIELD', payload: { key, value } })}
            />
          )}

          {((step === 3 && !isMarriage) || (step === 4 && isMarriage)) && formState.certType && (
            <DocumentUploadZone
              certType={formState.certType}
              files={formState.files}
              onAdd={(f) => dispatch({ type: 'ADD_FILE', payload: f })}
              onRemove={(i) => dispatch({ type: 'REMOVE_FILE', payload: i })}
              onAutoFill={(data) => dispatch({ type: 'AUTO_FILL', payload: data })}
            />
          )}

          {((step === 4 && !isMarriage) || (step === 5 && isMarriage)) && formState.certType && (
            <ApplicationReview
              certType={formState.certType}
              priority={formState.priority}
              formData={formState.personalData}
              files={formState.files}
              confirmed={formState.confirmed}
              onConfirm={(v) => dispatch({ type: 'SET_CONFIRMED', payload: v })}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex gap-3">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-500 text-sm">{submitError}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-ghost disabled:opacity-30 py-3 px-6"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">{step} / {totalSteps}</span>
          </div>

          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="btn-primary disabled:opacity-40 py-3 px-8"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!formState.confirmed || isSubmitting}
              className="btn-secondary disabled:opacity-40 py-3 px-8 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                '🚀 Submit Application'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplyCertificate;
