import React from 'react';
import type { ApplicationStatus } from '../../types';

type StatusType = ApplicationStatus | 'valid' | 'expired' | 'revoked';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; classes: string; dot: string }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-slate-700/60 text-slate-300 border border-slate-600/40',
    dot: 'bg-slate-400',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400',
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dot: 'bg-blue-400 animate-pulse',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dot: 'bg-red-400',
  },
  valid: {
    label: 'Valid',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dot: 'bg-red-400',
  },
  revoked: {
    label: 'Revoked',
    classes: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-400',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const config = statusConfig[status] || statusConfig.draft;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide
        ${config.classes} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} aria-hidden="true" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
