import React, { useEffect, useState } from 'react';
import { applicationAPI } from '../../services/api';

interface ProcessingTimeEstimateProps {
  certificateType: string;
  priority: 'normal' | 'urgent';
  onUpgradeToUrgent?: () => void;
}

export const ProcessingTimeEstimate: React.FC<ProcessingTimeEstimateProps> = ({ 
  certificateType, 
  priority,
  onUpgradeToUrgent
}) => {
  const [estimate, setEstimate] = useState<string>('...');
  const [historicalCount, setHistoricalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [urgentEstimate, setUrgentEstimate] = useState<string>('...');

  useEffect(() => {
    if (!certificateType) return;
    
    setIsLoading(true);
    // Fetch both normal and urgent estimates if needed, but mainly fetch for current priority
    // For the upgrade button, we ideally want to know the urgent time. 
    // We will do two parallel requests to get both estimates cleanly.
    Promise.all([
      applicationAPI.getEstimate(certificateType, priority),
      priority === 'normal' && onUpgradeToUrgent 
        ? applicationAPI.getEstimate(certificateType, 'urgent')
        : Promise.resolve(null)
    ])
      .then(([res1, res2]) => {
        if (res1.data.success && res1.data.data) {
          setEstimate(res1.data.data.estimatedDays);
          setHistoricalCount(res1.data.data.historicalCount);
        }
        if (res2 && res2.data.success && res2.data.data) {
          setUrgentEstimate(res2.data.data.estimatedDays);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch estimate:', err);
        setEstimate(priority === 'urgent' ? '2-3' : '7-10'); // fallback
      })
      .finally(() => setIsLoading(false));

  }, [certificateType, priority, onUpgradeToUrgent]);

  if (!certificateType) return null;

  const isUrgent = priority === 'urgent';

  return (
    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in ${
      isUrgent 
        ? 'bg-amber-500/10 border-amber-500/30' 
        : 'bg-slate-800/50 border-slate-700'
    }`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className={`text-2xl mt-1 sm:mt-0 ${isLoading ? 'animate-pulse' : ''}`}>
          {isUrgent ? '⚡' : '⏱️'}
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-0.5">Estimated Processing Time</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-sm font-medium ${isUrgent ? 'text-amber-400' : 'text-white'}`}>
              {isLoading ? (
                <span className="animate-pulse bg-slate-700 h-4 w-16 rounded inline-block"></span>
              ) : (
                `${estimate} working days`
              )} 
            </p>
            <span className="text-slate-500 text-xs font-normal">({priority} priority)</span>
          </div>
          {!isLoading && historicalCount > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">
              Based on {historicalCount} similar applications processed in the last 90 days.
            </p>
          )}
        </div>
      </div>
      
      {!isUrgent && onUpgradeToUrgent && (
        <button
          type="button"
          onClick={onUpgradeToUrgent}
          disabled={isLoading}
          className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg hover:bg-amber-500/20 transition-colors whitespace-nowrap self-start sm:self-center disabled:opacity-50"
        >
          Upgrade to Urgent ({isLoading ? '...' : urgentEstimate} days)
        </button>
      )}
    </div>
  );
};
