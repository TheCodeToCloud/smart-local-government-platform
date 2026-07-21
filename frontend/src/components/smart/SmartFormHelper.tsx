import React, { useState } from 'react';
import { applicationAPI } from '../../services/api';
import type { ValidationResult } from '../../types';
import { useToast } from '../ui/Toast';

interface SmartFormHelperProps {
  certificateType: string;
  applicantDetails: any;
  uploadedDocuments: any[];
}

export const SmartFormHelper: React.FC<SmartFormHelperProps> = ({ 
  certificateType, 
  applicantDetails, 
  uploadedDocuments 
}) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { showToast } = useToast();

  const handleValidate = async () => {
    setIsAnimating(true);
    setResult(null);
    try {
      // Small artificial delay for visual feedback of "AI thinking"
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const res = await applicationAPI.validateApplication('validate', {
        certificateType,
        applicantDetails,
        uploadedDocuments
      });

      if (res.data.success && res.data.data) {
        setResult(res.data.data);
        if (res.data.data.isValid) {
          showToast('Form looks good! Ready to submit.', 'success');
        } else {
          showToast('Found some issues that need your attention.', 'warning');
        }
      }
    } catch (error) {
      showToast('Validation check failed. Please check your connection.', 'error');
    } finally {
      setIsAnimating(false);
      setIsOpen(true);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 mb-8 shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-slate-800 font-bold text-sm">Smart Form Assistant</h3>
            <p className="text-slate-500 text-xs">Verify your application before submitting</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isAnimating}
            className="btn-outline border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white py-1.5 px-3 text-xs flex items-center gap-2"
          >
            {isAnimating ? (
              <><span className="animate-spin inline-block">↻</span> Analyzing...</>
            ) : (
              'Run Check'
            )}
          </button>
          {result && (
            <button 
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              {isOpen ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>

      {isOpen && result && (
        <div className="p-4 space-y-4 animate-fade-in bg-slate-50">
          
          {/* Status Banner */}
          <div className={`p-3 rounded-lg border flex items-center gap-3 ${
            result.isValid 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <span className="text-xl">{result.isValid ? '✅' : '⚠️'}</span>
            <span className="text-sm font-medium">
              {result.isValid 
                ? 'Great! Your application meets all requirements.' 
                : 'Please fix the issues below before submitting.'}
            </span>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Errors</h4>
              {result.errors.map((err, i) => (
                <div key={i} className="flex gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                  <span>❌</span> {err}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Warnings</h4>
              {result.warnings.map((warn, i) => (
                <div key={i} className="flex gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                  <span>⚠️</span> {warn}
                </div>
              ))}
            </div>
          )}

          {/* Document Completeness */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Document Readiness</h4>
              <span className="text-xs font-bold text-blue-400">{result.documentCompleteness.completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  result.documentCompleteness.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${result.documentCompleteness.completionPercentage}%` }}
              ></div>
            </div>
            {!result.documentCompleteness.isComplete && (
              <p className="text-xs text-slate-400">
                Missing: {result.documentCompleteness.missingDocuments.map(d => d.replace('_', ' ')).join(', ')}
              </p>
            )}
          </div>

          {/* Suggestions */}
          {result.smartSuggestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <span>💡</span> Smart Suggestions
              </h4>
              <ul className="text-xs text-slate-400 space-y-1 pl-6 list-disc">
                {result.smartSuggestions.map((sug, i) => (
                  <li key={i}>{sug}</li>
                ))}
              </ul>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};
