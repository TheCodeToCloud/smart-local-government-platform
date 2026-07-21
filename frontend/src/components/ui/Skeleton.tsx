import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 bg-slate-200 rounded w-24"></div>
      <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
    </div>
    <div className="h-8 bg-slate-200 rounded w-16"></div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-200 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        <div className="h-6 bg-slate-200 rounded w-16 ml-auto"></div>
      </div>
    ))}
  </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`h-4 bg-slate-200 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      ></div>
    ))}
  </div>
);
